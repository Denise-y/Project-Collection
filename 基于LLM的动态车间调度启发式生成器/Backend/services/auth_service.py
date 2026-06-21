from datetime import datetime, timedelta, timezone
from typing import Optional

import bcrypt
from jose import jwt, JWTError
from sqlalchemy.orm import Session

from Backend.config import SECRET_KEY, JWT_ALGORITHM, ACCESS_TOKEN_EXPIRE
from Backend.db.models import User

# bcrypt max password length is 72 bytes
BCRYPT_MAX_PASSWORD_BYTES = 72


def _truncate_for_bcrypt(password: str) -> bytes:
    encoded = password.encode("utf-8")
    if len(encoded) <= BCRYPT_MAX_PASSWORD_BYTES:
        return encoded
    return encoded[:BCRYPT_MAX_PASSWORD_BYTES]


def hash_password(password: str) -> str:
    pwd_bytes = _truncate_for_bcrypt(password)
    return bcrypt.hashpw(pwd_bytes, bcrypt.gensalt()).decode("ascii")


def verify_password(plain_password: str, password_hash: str) -> bool:
    pwd_bytes = _truncate_for_bcrypt(plain_password)
    return bcrypt.checkpw(pwd_bytes, password_hash.encode("ascii"))


def create_access_token(*, user_id: int, username: str, expires_delta: timedelta = ACCESS_TOKEN_EXPIRE) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": str(user_id),
        "username": username,
        "iat": int(now.timestamp()),
        "exp": int((now + expires_delta).timestamp()),
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=JWT_ALGORITHM)


def decode_token(token: str) -> dict:
    return jwt.decode(token, SECRET_KEY, algorithms=[JWT_ALGORITHM])


def get_user_by_username(db: Session, username: str) -> Optional[User]:
    return db.query(User).filter(User.username == username).first()


def get_user_by_id(db: Session, user_id: int) -> Optional[User]:
    return db.query(User).filter(User.id == user_id).first()


def register_user(db: Session, *, username: str, password: str, email: Optional[str] = None) -> User:
    existing = get_user_by_username(db, username)
    if existing:
        raise ValueError("Username already exists")

    if email:
        email_existing = db.query(User).filter(User.email == email).first()
        if email_existing:
            raise ValueError("Email already exists")

    user = User(
        username=username,
        password_hash=hash_password(password),
        email=email,
        is_active=True,
        role="user",
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def authenticate_user(db: Session, *, username: str, password: str) -> Optional[User]:
    user = get_user_by_username(db, username)
    if not user:
        return None
    if not user.is_active:
        return None
    if not verify_password(password, user.password_hash):
        return None
    return user


def token_subject_user_id(token_payload: dict) -> Optional[int]:
    sub = token_payload.get("sub")
    try:
        return int(sub)
    except Exception:
        return None


class TokenValidationError(Exception):
    pass


def validate_token_and_get_user_id(token: str) -> int:
    try:
        payload = decode_token(token)
    except JWTError as e:
        raise TokenValidationError(str(e))

    user_id = token_subject_user_id(payload)
    if not user_id:
        raise TokenValidationError("Invalid token subject")
    return user_id

