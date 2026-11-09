from sqlalchemy import Column, Integer, String, Float
from src.database import Base

class ProductModel(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(String)
    price = Column(Float, nullable=False)
    
    # Спеціалізовані поля для зимового одягу магазину "Сніжинка"
    material = Column(String)         # Склад: вовна, пух, фліс тощо
    temp_min = Column(Integer)        # Мінімальна температура (наприклад, -20°C)
    size_grid = Column(String)        # Сітка розмірів: S, M, L, XL
    stock_quantity = Column(Integer, default=0)