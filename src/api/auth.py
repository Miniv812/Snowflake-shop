from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from src.database import get_db

router = APIRouter(prefix="/api/v1/auth", tags=["Auth"])

@router.post("/register", status_code=status.HTTP_201_CREATED)
def register_user(user_data: dict, db: Session = Depends(get_db)):
    """
    Базовий ендпоінт для реєстрації користувача (каркас логіки).
    """
    return {"message": "Користувача зареєстровано", "email": user_data.get("email")}