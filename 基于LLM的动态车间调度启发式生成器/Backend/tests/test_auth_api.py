"""
Author: Minpei LIN (authentication API tests)
"""

from Backend.db.models import User


def test_register_success_creates_user(client, db_session):
    payload = {
        "username": "alice",
        "password": "Password123!",
        "email": "alice@example.com",
    }

    response = client.post("/api/auth/register", json=payload)

    assert response.status_code == 201
    body = response.json()
    assert body["user"]["username"] == "alice"
    assert body["user"]["email"] == "alice@example.com"
    assert body["user"]["role"] == "user"

    stored = db_session.query(User).filter(User.username == "alice").first()
    assert stored is not None
    assert stored.email == "alice@example.com"
    assert stored.password_hash != payload["password"]


def test_register_duplicate_username_returns_400(client):
    payload = {
        "username": "alice",
        "password": "Password123!",
        "email": "alice@example.com",
    }

    first = client.post("/api/auth/register", json=payload)
    second = client.post(
        "/api/auth/register",
        json={
            "username": "alice",
            "password": "Password123!",
            "email": "alice2@example.com",
        },
    )

    assert first.status_code == 201
    assert second.status_code == 400
    assert second.json()["detail"] == "Username already exists"


def test_register_invalid_email_returns_422(client):
    response = client.post(
        "/api/auth/register",
        json={
            "username": "alice",
            "password": "Password123!",
            "email": "not-an-email",
        },
    )

    assert response.status_code == 422


def test_login_success_returns_access_token(client):
    register_response = client.post(
        "/api/auth/register",
        json={
            "username": "alice",
            "password": "Password123!",
            "email": "alice@example.com",
        },
    )
    assert register_response.status_code == 201

    response = client.post(
        "/api/auth/login",
        json={"username": "alice", "password": "Password123!"},
    )

    assert response.status_code == 200
    body = response.json()
    assert isinstance(body["access_token"], str)
    assert body["access_token"]
    assert body["token_type"] == "bearer"
    assert body["user"]["username"] == "alice"


def test_login_failure_returns_401(client):
    register_response = client.post(
        "/api/auth/register",
        json={
            "username": "alice",
            "password": "Password123!",
            "email": "alice@example.com",
        },
    )
    assert register_response.status_code == 201

    response = client.post(
        "/api/auth/login",
        json={"username": "alice", "password": "wrong-password"},
    )

    assert response.status_code == 401
    assert response.json()["detail"] == "Incorrect username or password"


def test_protected_endpoint_requires_authentication(client):
    """Accessing protected API without Authorization header should return 401."""
    response = client.get("/api/machines/")

    assert response.status_code == 401
    body = response.json()
    # FastAPI's OAuth2PasswordBearer usually returns this message
    assert "Not authenticated" in body.get("detail", "")
