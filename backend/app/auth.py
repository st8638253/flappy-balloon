from datetime import datetime, timedelta
from fastapi import HTTPException, Cookie, Depends
from jose import jwt, JWTError
from sqlalchemy.orm import Session
from passlib.context import CryptContext

from app.config import SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES
from app.database import get_db
from app.models import PlayerDB

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def _prepare_password(password: str) -> bytes:
    return password.encode("utf-8")[:72]


def hash_password(password: str):
    return pwd_context.hash(_prepare_password(password))


def verify_password(password: str, hashed: str):
    return pwd_context.verify(_prepare_password(password), hashed)


def create_access_token(data: dict, expires_delta=None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def get_current_user(
    access_token: str = Cookie(None),
    db: Session = Depends(get_db)
):
    if not access_token:
        raise HTTPException(401)

    try:
        payload = jwt.decode(access_token, SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get("sub")
        if not username:
            raise HTTPException(401)
    except JWTError:
        raise HTTPException(401)

    user = db.query(PlayerDB).filter(PlayerDB.username == username).first()
    if not user:
        raise HTTPException(401)

    return user
