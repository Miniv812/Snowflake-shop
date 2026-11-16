"""
Модуль конфігурації бази даних (Database Layer).
Відповідає за підключення до PostgreSQL через SQLAlchemy, створення фабрики сесій
та надання ізольованих сесій БД для кожного HTTP-запиту (Dependency Injection).
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# Рядок підключення до PostgreSQL
DATABASE_URL = "postgresql+psycopg2://postgres:postgres@localhost:5432/snizhinka_db"

# Створення рушія БД та фабрики сесій без автокоміту
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Базовий клас для оголошення ORM-моделей
Base = declarative_base()

# Генератор сесії БД для ін'єкції залежностей у маршрутах FastAPI.
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
        