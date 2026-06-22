from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_cors_origins
from app.database import init_db
from app.routes import consent, reports, sessions


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(
    title="GazeLink API",
    description="University prototype API for gamified ADHD screening support.",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=get_cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(sessions.router)
app.include_router(reports.router)
app.include_router(consent.router)


@app.get("/")
def root():
    return {
        "status": "ok",
        "service": "GazeLink API",
        "message": "University prototype — not a medical diagnostic device.",
    }
