from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Float
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base


class PlayerDB(Base):
    __tablename__ = "players"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    password_hash = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

    games = relationship("GameDB", back_populates="player", cascade="all, delete")
    stats = relationship("PlayerStatsDB", back_populates="player", uselist=False, cascade="all, delete")


class GameDB(Base):
    __tablename__ = "games"

    id = Column(Integer, primary_key=True, index=True)
    player_id = Column(Integer, ForeignKey("players.id"))
    score = Column(Integer)
    avg_mic_level = Column(Float)
    max_mic_level = Column(Float)
    duration_seconds = Column(Integer)
    created_at = Column(DateTime, default=datetime.utcnow)

    player = relationship("PlayerDB", back_populates="games")


class PlayerStatsDB(Base):
    __tablename__ = "player_stats"

    id = Column(Integer, primary_key=True, index=True)
    player_id = Column(Integer, ForeignKey("players.id"), unique=True)

    total_games = Column(Integer, default=0)
    best_score = Column(Integer, default=0)
    avg_score = Column(Float, default=0)

    updated_at = Column(DateTime, default=datetime.utcnow)

    player = relationship("PlayerDB", back_populates="stats")
