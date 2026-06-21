"""
Author: Zizhen WANG (backend framework and core API wiring)
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from Backend.api.routes import schedule, machines, llm_test, auth, history, user_configs
from Backend.config import FRONTEND_ORIGINS
from Backend.db.session import engine
from Backend.db.session import Base  # noqa: F401
from Backend.db import models  # noqa: F401


@asynccontextmanager
async def lifespan(_app: FastAPI):
    """Create DB tables on startup (simple mode; Alembic can replace this later)."""
    try:
        Base.metadata.create_all(bind=engine)
        print("[DB] Tables ensured.")
    except Exception as e:
        print(f"[DB] Failed to create tables: {e}")
    yield


app = FastAPI(title="IntelliSched Backend System", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=FRONTEND_ORIGINS or [],
    allow_origin_regex=r"http://(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+)(:\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routes
app.include_router(schedule.router)
app.include_router(machines.router)
app.include_router(llm_test.router)
app.include_router(auth.router)
app.include_router(history.router)
app.include_router(user_configs.router)


@app.get("/")
def root():
    """Health check endpoint"""
    return {"message": "IntelliSched Backend is running"}

