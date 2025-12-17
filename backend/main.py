from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import router
from app.database import Base, engine

Base.metadata.create_all(bind=engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8080", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)
