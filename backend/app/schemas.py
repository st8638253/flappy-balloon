from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class Player(BaseModel):
    id: int
    username: str
    created_at: datetime

    class Config:
        orm_mode = True


class PlayerCreate(BaseModel):
    username: str
    password: str


class GameCreate(BaseModel):
    score: int
    avg_mic_level: Optional[float] = 0
    max_mic_level: Optional[float] = 0
    duration_seconds: Optional[int] = 0


class Game(BaseModel):
    id: int
    player_id: int
    score: int
    avg_mic_level: float
    max_mic_level: float
    duration_seconds: int
    created_at: datetime

    class Config:
        orm_mode = True


class PlayerStats(BaseModel):
    player_id: int
    total_games: int
    best_score: int
    avg_score: float

    class Config:
        orm_mode = True
