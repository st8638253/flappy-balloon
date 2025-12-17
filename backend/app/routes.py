from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models import PlayerDB, GameDB, PlayerStatsDB
from app.schemas import Player, PlayerCreate, Game, GameCreate, PlayerStats
from app.auth import hash_password, verify_password, create_access_token, get_current_user

router = APIRouter()


@router.post("/register", response_model=Player)
def register(data: PlayerCreate, db: Session = Depends(get_db)):
    if db.query(PlayerDB).filter(PlayerDB.username == data.username).first():
        raise HTTPException(400, "Username already exists")

    user = PlayerDB(username=data.username, password_hash=hash_password(data.password))
    db.add(user)
    db.commit()
    db.refresh(user)

    stats = PlayerStatsDB(player_id=user.id)
    db.add(stats)
    db.commit()

    return user


@router.post("/login")
def login(form: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(PlayerDB).filter(PlayerDB.username == form.username).first()
    if not user or not verify_password(form.password, user.password_hash):
        raise HTTPException(401)

    token = create_access_token({"sub": user.username})
    response = JSONResponse({"message": "Login successful"})
    response.set_cookie("access_token", token, httponly=True, secure=False, samesite="Lax", max_age=3600)
    return response


@router.post("/logout")
def logout():
    resp = JSONResponse({"message": "Logged out"})
    resp.delete_cookie("access_token")
    return resp


@router.get("/me", response_model=Player)
def me(current_user: PlayerDB = Depends(get_current_user)):
    return current_user


@router.post("/games", response_model=Game)
def create_game(
    data: GameCreate,
    db: Session = Depends(get_db),
    current_user: PlayerDB = Depends(get_current_user)
):
    game = GameDB(
        player_id=current_user.id,
        score=data.score,
        avg_mic_level=data.avg_mic_level,
        max_mic_level=data.max_mic_level,
        duration_seconds=data.duration_seconds,
    )
    db.add(game)
    db.commit()
    db.refresh(game)

    stats = db.query(PlayerStatsDB).filter(PlayerStatsDB.player_id == current_user.id).first()
    if not stats:
        stats = PlayerStatsDB(player_id=current_user.id)
        db.add(stats)

    stats.total_games += 1
    stats.best_score = max(stats.best_score, data.score)

    all_scores = db.query(GameDB.score).filter(GameDB.player_id == current_user.id).all()
    stats.avg_score = sum(s[0] for s in all_scores) / len(all_scores)

    db.commit()
    return game


@router.get("/games/me", response_model=List[Game])
def my_games(
    db: Session = Depends(get_db),
    current_user: PlayerDB = Depends(get_current_user),
):
    return db.query(GameDB).filter(GameDB.player_id == current_user.id).order_by(GameDB.created_at.desc()).all()


@router.get("/stats/me", response_model=PlayerStats)
def my_stats(
    db: Session = Depends(get_db),
    current_user: PlayerDB = Depends(get_current_user),
):
    stats = db.query(PlayerStatsDB).filter(PlayerStatsDB.player_id == current_user.id).first()
    if not stats:
        raise HTTPException(404)
    return stats


@router.get("/leaderboard", response_model=List[PlayerStats])
def leaderboard(db: Session = Depends(get_db)):
    return db.query(PlayerStatsDB).order_by(PlayerStatsDB.best_score.desc()).limit(10).all()


@router.get("/players/{player_id}", response_model=Player)
def get_player(player_id: int, db: Session = Depends(get_db)):
    player = db.query(PlayerDB).filter(PlayerDB.id == player_id).first()
    if not player:
        raise HTTPException(404, "Player not found")
    return player


@router.delete("/players/{player_id}")
def delete_account(
    player_id: int,
    db: Session = Depends(get_db),
    current_user: PlayerDB = Depends(get_current_user)
):
    if current_user.id != player_id:
        raise HTTPException(403)

    db.delete(current_user)
    db.commit()
    return {"detail": "Player deleted"}
