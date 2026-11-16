"""
Сервіс автентифікації та управління обліковими записами (AuthService).
Інкапсулює бізнес-логіку реєстрації користувачів, перевірки унікальності пошти,
хешування паролів та видачі токенів доступу.
"""

from sqlalchemy.orm import Session

from src.models.models import UserModel
from src.schemas.schemas import UserRegister, UserLogin, UserResponse
from src.security import hash_password, verify_password, create_access_token
from src.services.exceptions import ServiceError, UnauthorizedError


# Сервісний клас для реєстрації та входу користувачів у систему
class AuthService:
    # Реєструє нового покупця після валідації даних та перевірки унікальності Email
    @staticmethod
    def register_user(db: Session, user_data: UserRegister) -> UserModel:
        first_name = user_data.first_name.strip()
        last_name = user_data.last_name.strip()
        email = user_data.email.strip().lower()

        if not first_name or not last_name:
            raise ServiceError("Вкажіть ім'я та прізвище")

        if len(user_data.password) < 4:
            raise ServiceError("Пароль має містити щонайменше 4 символи")

        # Перевірка, чи не зареєстрована вже така електронна адреса
        existing = db.query(UserModel).filter(UserModel.email == email).first()
        if existing:
            raise ServiceError("Користувач з таким Email вже існує")

        # Створення запису користувача з криптографічним хешем пароля
        user = UserModel(
            email=email,
            password_hash=hash_password(user_data.password),
            full_name=f"{first_name} {last_name}",
            role="Customer"
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        return user

    # Перевіряє облікові дані користувача та формує підписаний токен доступу
    @staticmethod
    def authenticate_user(db: Session, credentials: UserLogin) -> UserResponse:
        email = credentials.email.strip().lower()
        user = db.query(UserModel).filter(UserModel.email == email).first()

        # Звірка введеного пароля зі збереженим PBKDF2-хешем
        if not user or not verify_password(credentials.password, user.password_hash):
            raise UnauthorizedError("Невірний Email або пароль")

        token = create_access_token(user.id, user.role)
        return UserResponse(
            id=user.id,
            email=user.email,
            full_name=user.full_name,
            role=user.role,
            access_token=token
        )
