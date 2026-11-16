"""
Модуль компонентного тестування (Component Testing).
Перевіряє інтеграцію HTTP-роутерів FastAPI, залежностей авторизації,
сервісного шару та бази даних через TestClient.
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from src.database import Base, get_db
from src.main import app
from src.models.models import UserModel, CategoryModel
from src.security import hash_password


@pytest.fixture
def client():
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool
    )
    Base.metadata.create_all(bind=engine)
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

    # Початкове наповнення тестової БД адміністратором та категорією
    db = TestingSessionLocal()
    admin = UserModel(
        email="admin@test.ua",
        password_hash=hash_password("admin123"),
        full_name="Тестовий Адмін",
        role="Admin"
    )
    category = CategoryModel(name="Термобілизна", description="Комплекти")
    db.add_all([admin, category])
    db.commit()
    db.close()

    def override_get_db():
        session = TestingSessionLocal()
        try:
            yield session
        finally:
            session.close()

    app.dependency_overrides[get_db] = override_get_db
    yield TestClient(app)
    app.dependency_overrides.clear()


def test_register_and_login_flow(client):
    reg_res = client.post("/api/v1/auth/register", json={
        "first_name": "Владислав",
        "last_name": "Чмуленко",
        "email": "vlad@test.ua",
        "password": "secret"
    })
    assert reg_res.status_code == 201
    assert reg_res.json()["full_name"] == "Владислав Чмуленко"

    login_res = client.post("/api/v1/auth/login", json={
        "email": "vlad@test.ua",
        "password": "secret"
    })
    assert login_res.status_code == 200
    data = login_res.json()
    assert data["access_token"] is not None
    assert data["role"] == "Customer"


def test_rbac_blocks_customer_from_creating_product(client):
    client.post("/api/v1/auth/register", json={
        "first_name": "Покупець",
        "last_name": "Звичайний",
        "email": "cust@test.ua",
        "password": "secret"
    })
    login_res = client.post("/api/v1/auth/login", json={
        "email": "cust@test.ua",
        "password": "secret"
    })
    token = login_res.json()["access_token"]

    res = client.post(
        "/api/v1/catalog/products",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "category_id": 1,
            "name": "Заборонений товар",
            "description": "Опис",
            "price": 1000.0,
            "material": "Фліс",
            "color": "Чорний",
            "temp_min": -15,
            "size_grid": "M",
            "stock_quantity": 5
        }
    )
    assert res.status_code == 403


def test_full_order_lifecycle_and_delete_protection(client):
    # 1. Вхід адміністратора та створення товару
    admin_login = client.post("/api/v1/auth/login", json={
        "email": "admin@test.ua",
        "password": "admin123"
    })
    admin_token = admin_login.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    prod_res = client.post("/api/v1/catalog/products", headers=admin_headers, json={
        "category_id": 1,
        "name": "Термокомплект Меринос",
        "description": "Шерсть мериноса",
        "price": 2100.0,
        "material": "Шерсть мериноса",
        "color": "Чорний",
        "temp_min": -25,
        "size_grid": "S, M, L",
        "stock_quantity": 4
    })
    assert prod_res.status_code == 201
    product_id = prod_res.json()["id"]

    # 2. Реєстрація покупця та оформлення замовлення
    client.post("/api/v1/auth/register", json={
        "first_name": "Олена",
        "last_name": "Коваленко",
        "email": "olena@test.ua",
        "password": "secret"
    })
    cust_login = client.post("/api/v1/auth/login", json={
        "email": "olena@test.ua",
        "password": "secret"
    })
    cust_headers = {"Authorization": f"Bearer {cust_login.json()['access_token']}"}

    order_res = client.post("/api/v1/orders", headers=cust_headers, json={
        "phone": "+380 93 111 22 33",
        "delivery_address": "м. Дніпро, НП №5",
        "items": [{"product_id": product_id, "selected_size": "M", "selected_color": "Чорний"}]
    })
    assert order_res.status_code == 201
    assert order_res.json()["total_amount"] == 2100.0

    # 3. Перевірка блокування видалення товару, який вже присутній у замовленні
    del_res = client.delete(f"/api/v1/catalog/products/{product_id}", headers=admin_headers)
    assert del_res.status_code == 400
    assert "вже є в оформлених замовленнях" in del_res.json()["detail"]
    