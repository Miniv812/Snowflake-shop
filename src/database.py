from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# Рядок підключення до БД PostgreSQL
DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/snizhinka_db"

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Генератор сесій для залежностей FastAPI (DIP)
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()