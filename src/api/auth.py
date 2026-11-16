"""
HTTP-роутер автентифікації (Auth API Controller).
Делегує бізнес-логіку реєстрації та входу до сервісу AuthService.
"""

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from src.database import get_db
from src.schemas.schemas import UserRegister, UserLogin, UserResponse
from src.services.auth_service import AuthService

# Ініціалізація роутера для маршрутів авторизації та реєстрації
router = APIRouter(prefix="/api/v1/auth", tags=["Auth"])

# Ендпоїнт реєстрації нового облікового запису покупця
@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(user_data: UserRegister, db: Session = Depends(get_db)):
    return AuthService.register_user(db, user_data)

# Ендпоїнт входу в систему та отримання токена доступу
@router.post("/login", response_model=UserResponse)
def login(credentials: UserLogin, db: Session = Depends(get_db)):
    return AuthService.authenticate_user(db, credentials)
