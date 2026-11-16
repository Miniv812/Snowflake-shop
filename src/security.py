"""
Модуль безпеки та авторизації (Security Layer).
Забезпечує криптографічне хешування паролів (PBKDF2-HMAC-SHA256),
генерацію та перевірку підписаних токенів доступу, а також захист
маршрутів користувачів і адміністратора через FastAPI Dependency Injection.
"""

import os
import hmac
import json
import time
import base64
import hashlib
import secrets
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from src.database import get_db
from src.models.models import UserModel

SECRET_KEY = os.getenv("SECRET_KEY", "snizhinka-secret-signing-key-2026")
TOKEN_TTL_SECONDS = 60 * 60 * 24  # Термін дії токена — 24 години
PBKDF2_ITERATIONS = 600_000

security_scheme = HTTPBearer(auto_error=False)


# Генерує криптографічний хеш пароля
def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    derived_key = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt.encode("utf-8"),
        PBKDF2_ITERATIONS
    )
    return f"pbkdf2_sha256${salt}${derived_key.hex()}"


# Перевіряє відповідність введеного пароля збереженому хешу
def verify_password(plain_password: str, stored_hash: str) -> bool:
    if not stored_hash or not stored_hash.startswith("pbkdf2_sha256$"):
        return False
    try:
        _, salt, hash_hex = stored_hash.split("$", 2)
        derived_key = hashlib.pbkdf2_hmac(
            "sha256",
            plain_password.encode("utf-8"),
            salt.encode("utf-8"),
            PBKDF2_ITERATIONS
        )
        return hmac.compare_digest(derived_key.hex(), hash_hex)
    except ValueError:
        return False


# Створює підписаний токен доступу для авторизованого користувача
def create_access_token(user_id: int, role: str) -> str:
    payload = {
        "sub": user_id,
        "role": role,
        "exp": int(time.time()) + TOKEN_TTL_SECONDS
    }
    payload_bytes = json.dumps(payload, separators=(",", ":")).encode("utf-8")
    payload_b64 = base64.urlsafe_b64encode(payload_bytes).decode("utf-8")

    signature = hmac.new(
        SECRET_KEY.encode("utf-8"),
        payload_b64.encode("utf-8"),
        hashlib.sha256
    ).hexdigest()

    return f"{payload_b64}.{signature}"


# Перевіряє підпис і термін дії токена доступу
def verify_access_token(token: str) -> Optional[dict]:
    try:
        payload_b64, signature = token.split(".", 1)
        expected_sig = hmac.new(
            SECRET_KEY.encode("utf-8"),
            payload_b64.encode("utf-8"),
            hashlib.sha256
        ).hexdigest()

        if not hmac.compare_digest(signature, expected_sig):
            return None

        payload_bytes = base64.urlsafe_b64decode(payload_b64.encode("utf-8"))
        payload = json.loads(payload_bytes.decode("utf-8"))

        if payload.get("exp", 0) < int(time.time()):
            return None

        return payload
    except Exception:
        return None


# Залежність FastAPI для отримання поточного авторизованого користувача за токеном
def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme),
    db: Session = Depends(get_db)
) -> UserModel:
    if not credentials or credentials.scheme.lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Необхідна авторизація в системі"
        )

    payload = verify_access_token(credentials.credentials)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Недійсний або прострочений токен доступу"
        )

    user = db.query(UserModel).filter(UserModel.id == payload.get("sub")).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Користувача не знайдено"
        )

    return user


# Залежність FastAPI для захисту ендпоїнтів, доступних лише адміністратору
def get_current_admin(
    current_user: UserModel = Depends(get_current_user)
) -> UserModel:
    if current_user.role != "Admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Доступ заборонено: потрібні права адміністратора"
        )

    return current_user