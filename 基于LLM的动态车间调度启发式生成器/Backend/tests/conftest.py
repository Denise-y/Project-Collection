"""
Author: Minpei LIN (pytest configuration and fixtures)
"""

import os
import sys
import tempfile
from pathlib import Path

import pytest


ROOT_DIR = Path(__file__).resolve().parents[2]
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

TEST_DB_PATH = Path(tempfile.gettempdir()) / "intellisched-pytest.sqlite3"
os.environ["DATABASE_URL"] = f"sqlite:///{TEST_DB_PATH.as_posix()}"
os.environ.setdefault("SECRET_KEY", "pytest-secret-key")
os.environ.setdefault("ACCESS_TOKEN_EXPIRE_MINUTES", "30")
os.environ.setdefault("LLM_API_KEY", "test-key")
os.environ.setdefault("LLM_MODEL", "test-model")

from fastapi.testclient import TestClient

from Backend.db.session import Base, SessionLocal, engine, get_db
from Backend.main import app
from Backend.services.auth_service import create_access_token, register_user


@pytest.fixture(autouse=True)
def reset_database():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield


@pytest.fixture
def db_session():
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def client():
    def override_get_db():
        db = SessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    try:
        with TestClient(app) as test_client:
            yield test_client
    finally:
        app.dependency_overrides.clear()


@pytest.fixture
def user_factory(db_session):
    created = {"count": 0}

    def _create_user(
        *,
        username: str | None = None,
        password: str = "Password123!",
        email: str | None = None,
    ):
        created["count"] += 1
        final_username = username or f"user{created['count']}"
        final_email = email
        if final_email is None:
            final_email = f"{final_username}@example.com"
        return register_user(
            db_session,
            username=final_username,
            password=password,
            email=final_email,
        )

    return _create_user


@pytest.fixture
def test_user(user_factory):
    return user_factory()


@pytest.fixture
def auth_token(test_user):
    return create_access_token(user_id=test_user.id, username=test_user.username)


@pytest.fixture
def auth_headers(auth_token):
    return {"Authorization": f"Bearer {auth_token}"}
