from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session

from Backend.db.session import get_db
from Backend.services.auth_service import authenticate_user, create_access_token, register_user


router = APIRouter(prefix="/api/auth", tags=["Auth"])


class RegisterRequest(BaseModel):
    username: str
    password: str
    email: EmailStr | None = None


class UserOut(BaseModel):
    id: int
    username: str
    email: str | None = None
    role: str


class RegisterResponse(BaseModel):
    user: UserOut


class LoginRequest(BaseModel):
    username: str
    password: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


@router.post("/register", response_model=RegisterResponse, status_code=201)
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    try:
        user = register_user(db, username=payload.username.strip(), password=payload.password, email=payload.email)
        return RegisterResponse(
            user=UserOut(id=user.id, username=user.username, email=user.email, role=user.role)
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/login", response_model=LoginResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = authenticate_user(db, username=payload.username.strip(), password=payload.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
        )

    token = create_access_token(user_id=user.id, username=user.username)
    return LoginResponse(
        access_token=token,
        token_type="bearer",
        user=UserOut(id=user.id, username=user.username, email=user.email, role=user.role),
    )

