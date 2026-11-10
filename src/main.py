from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os

from src.database import engine, Base, SessionLocal
from src.models.models import ProductModel, CategoryModel, UserModel
from src.api.catalog import router as catalog_router
from src.api.orders import router as orders_router
from src.api.auth import router as auth_router

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Інтернет-магазин Сніжинка")

app.include_router(catalog_router)
app.include_router(orders_router)
app.include_router(auth_router)

if not os.path.exists("static"):
    os.makedirs("static")

app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/")
def read_root():
    return FileResponse("static/index.html")

@app.on_event("startup")
def seed_db():
    db = SessionLocal()
    
    # 1. Створення Адміністратора за замовчуванням
    admin = db.query(UserModel).filter(UserModel.email == "admin@admin.ua").first()
    if not admin:
        admin_user = UserModel(
            email="admin@admin.ua",
            password_hash="admin",
            full_name="Головний Адміністратор",
            role="Admin"
        )
        db.add(admin_user)
        db.commit()

    # 2. Створення тестових товарів
    if db.query(ProductModel).count() == 0:
        cat = CategoryModel(name="Верхній одяг", description="Зимові куртки та пуховики")
        db.add(cat)
        db.commit()

        demo_products = [
            ProductModel(
                category_id=cat.id,
                name="Зимовий пуховик 'Арктика'",
                description="Натуральний гусячий пух 90%, вологозахисна тканина",
                price=4500.0,
                material="Гусячий пух / Поліестер",
                temp_min=-30,
                size_grid="M, L, XL",
                stock_quantity=15
            ),
            ProductModel(
                category_id=cat.id,
                name="Парка 'Сніжна буря'",
                description="Тепла парка з хутряним коміром та захистом від вітру",
                price=3800.0,
                material="Холлофайбер / Бавовна",
                temp_min=-20,
                size_grid="S, M, L",
                stock_quantity=8
            ),
            ProductModel(
                category_id=cat.id,
                name="Комплект термобілизни 'Nordic'",
                description="Двошарова термобілизна з шерстю мериноса",
                price=1800.0,
                material="Шерсть мериноса 70%",
                temp_min=-25,
                size_grid="S, M, L, XL",
                stock_quantity=20
            ),
        ]
        db.add_all(demo_products)
        db.commit()
    db.close()