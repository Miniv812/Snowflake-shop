"""
Головний модуль застосунку.
Ініціалізує вебсервер FastAPI, реєструє обробники доменних винятків,
підключає API-роутери, налаштовує роздачу статичних файлів фронтенду
та створює базові системні записи при старті.
"""

import os
from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse

from src.database import engine, Base, SessionLocal
from src.models.models import CategoryModel, UserModel
from src.api.catalog import router as catalog_router
from src.api.orders import router as orders_router
from src.api.auth import router as auth_router
from src.security import hash_password
from src.services.exceptions import (
    ServiceError,
    UnauthorizedError,
    ForbiddenError,
    NotFoundError
)

# Створення таблиць у БД на основі ORM-моделей
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Інтернет-магазин Сніжинка")


# Глобальні обробники доменних винятків сервісного шару
@app.exception_handler(UnauthorizedError)
def handle_unauthorized_error(request: Request, exc: UnauthorizedError):
    return JSONResponse(status_code=401, content={"detail": str(exc)})


@app.exception_handler(ForbiddenError)
def handle_forbidden_error(request: Request, exc: ForbiddenError):
    return JSONResponse(status_code=403, content={"detail": str(exc)})


@app.exception_handler(NotFoundError)
def handle_not_found_error(request: Request, exc: NotFoundError):
    return JSONResponse(status_code=404, content={"detail": str(exc)})


@app.exception_handler(ServiceError)
def handle_service_error(request: Request, exc: ServiceError):
    return JSONResponse(status_code=400, content={"detail": str(exc)})


# Підключення модульних роутерів API
app.include_router(catalog_router)
app.include_router(orders_router)
app.include_router(auth_router)

# Перевірка наявності папки зі статичними файлами фронтенду
if not os.path.exists("static"):
    os.makedirs("static")

app.mount("/static", StaticFiles(directory="static"), name="static")


# Віддає головну сторінку клієнтської частини застосунку
@app.get("/")
def read_root():
    return FileResponse("static/index.html")


@app.on_event("startup")
def init_defaults():
    # Створює адміністратора та базові категорії при першому запуску порожньої БД
    db = SessionLocal()
    try:
        admin = db.query(UserModel).filter(UserModel.email == "admin@admin.ua").first()
        if not admin:
            admin_user = UserModel(
                email="admin@admin.ua",
                password_hash=hash_password("admin"),
                full_name="Головний Адміністратор",
                role="Admin"
            )
            db.add(admin_user)
            db.commit()
        elif not admin.password_hash.startswith("pbkdf2_sha256$"):
            admin.password_hash = hash_password(admin.password_hash)
            db.commit()

        # Створення базових категорій, щоб уникнути помилки зовнішнього ключа при додаванні товарів
        if db.query(CategoryModel).count() == 0:
            default_categories = [
                CategoryModel(name="Куртки та пуховики", description="Теплий верхній одяг"),
                CategoryModel(name="Взуття та чоботи", description="Зимове взуття та дутики"),
                CategoryModel(name="Термобілизна", description="Комплекти та білизна з шерсті мериноса"),
                CategoryModel(name="Зимові штани", description="Лижні та утеплені штани"),
                CategoryModel(name="Шапки та головні убори", description="Шапки, вушанки та капори"),
                CategoryModel(name="Аксесуари", description="Рукавиці, шарфи та термоустілки"),
            ]
            db.add_all(default_categories)
            db.commit()
    finally:
        db.close()