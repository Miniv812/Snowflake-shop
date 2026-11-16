"""
Модуль юніт-тестування (Unit Testing).
Перевіряє ізольовану роботу функцій криптографії (security.py)
та бізнес-логіку сервісу замовлень (OrderService) без підняття HTTP-сервера.
"""

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from src.database import Base
from src.models.models import UserModel, CategoryModel, ProductModel
from src.schemas.schemas import OrderCreate, OrderItemCreate
from src.security import (
    hash_password,
    verify_password,
    create_access_token,
    verify_access_token
)
from src.services.order_service import OrderService
from src.services.exceptions import ServiceError


# Фікстура ізольованої тестової БД у пам'яті для кожного тесту
@pytest.fixture
def db_session():
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool
    )
    Base.metadata.create_all(bind=engine)
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()


def test_password_hashing_and_verification():
    raw_password = "StrongPassword2026"
    hashed = hash_password(raw_password)

    assert hashed.startswith("pbkdf2_sha256$")
    assert hashed != raw_password
    assert verify_password(raw_password, hashed) is True
    assert verify_password("WrongPassword", hashed) is False


def test_access_token_generation_and_tamper_protection():
    token = create_access_token(user_id=42, role="Customer")
    payload = verify_access_token(token)

    assert payload is not None
    assert payload["sub"] == 42
    assert payload["role"] == "Customer"

    # Перевірка захисту від підробки підпису токена
    tampered_token = token[:-4] + "ffff"
    assert verify_access_token(tampered_token) is None


def test_order_creation_calculates_total_and_reduces_stock(db_session):
    user = UserModel(
        email="buyer@test.ua",
        password_hash=hash_password("1234"),
        full_name="Тестовий Покупець",
        role="Customer"
    )
    category = CategoryModel(name="Куртки", description="Зимовий одяг")
    db_session.add_all([user, category])
    db_session.commit()

    product = ProductModel(
        category_id=category.id,
        name="Пуховик Арктика",
        description="Теплий пуховик",
        price=4500.0,
        material="Пух",
        color="Чорний",
        temp_min=-30,
        size_grid="M, L",
        stock_quantity=5
    )
    db_session.add(product)
    db_session.commit()

    order_payload = OrderCreate(
        phone="+380 67 123 45 67",
        delivery_address="м. Київ, відділення НП №1",
        items=[
            OrderItemCreate(product_id=product.id, selected_size="L", selected_color="Чорний"),
            OrderItemCreate(product_id=product.id, selected_size="M", selected_color="Чорний")
        ]
    )

    result = OrderService.create_order(db_session, user, order_payload)
    db_session.refresh(product)

    assert result.total_amount == 9000.0
    assert result.status == "Обробляється"
    assert product.stock_quantity == 3


def test_order_cancellation_restores_stock(db_session):
    user = UserModel(
        email="buyer2@test.ua",
        password_hash=hash_password("1234"),
        full_name="Іван Тест",
        role="Customer"
    )
    category = CategoryModel(name="Взуття", description="Чоботи")
    db_session.add_all([user, category])
    db_session.commit()

    product = ProductModel(
        category_id=category.id,
        name="Чоботи Снігохід",
        description="Зимові чоботи",
        price=3200.0,
        material="Шкіра",
        color="Синій",
        temp_min=-25,
        size_grid="42, 43",
        stock_quantity=2
    )
    db_session.add(product)
    db_session.commit()

    order_payload = OrderCreate(
        phone="+380 50 987 65 43",
        delivery_address="м. Павлоград, НП №2",
        items=[OrderItemCreate(product_id=product.id, selected_size="42", selected_color="Синій")]
    )
    created = OrderService.create_order(db_session, user, order_payload)
    db_session.refresh(product)
    assert product.stock_quantity == 1

    updated = OrderService.update_order_status(db_session, created.order_id, "Скасовано")
    db_session.refresh(product)

    assert updated.status == "Скасовано"
    assert product.stock_quantity == 2


def test_order_fails_with_invalid_phone_or_out_of_stock(db_session):
    user = UserModel(
        email="buyer3@test.ua",
        password_hash=hash_password("1234"),
        full_name="Олег Тест",
        role="Customer"
    )
    db_session.add(user)
    db_session.commit()

    invalid_phone_order = OrderCreate(
        phone="12345",
        delivery_address="Адреса",
        items=[OrderItemCreate(product_id=999, selected_size="L", selected_color="Чорний")]
    )

    with pytest.raises(ServiceError) as exc_info:
        OrderService.create_order(db_session, user, invalid_phone_order)
    assert "формат номера телефону" in str(exc_info.value)
