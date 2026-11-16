"""
Модуль ORM-моделей бази даних (Data Models Layer).
Описує структуру таблиць PostgreSQL (користувачі, категорії, товари, замовлення
та позиції замовлень) і зв'язки між ними за допомогою SQLAlchemy.
"""

from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from src.database import Base

# Модель користувача системи (покупець або адміністратор)
class UserModel(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    role = Column(String, default="Customer")

    orders = relationship("OrderModel", back_populates="user")

# Модель категорії товарів зимового одягу
class CategoryModel(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(String)

    products = relationship("ProductModel", back_populates="category")

# Модель товару в каталозі магазину
class ProductModel(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    category_id = Column(Integer, ForeignKey("categories.id"))
    name = Column(String, nullable=False)
    description = Column(String)
    price = Column(Float, nullable=False)
    material = Column(String)
    color = Column(String, default="Чорний")
    temp_min = Column(Integer)
    size_grid = Column(String)
    stock_quantity = Column(Integer, default=10)
    image_url = Column(String, nullable=True)

    category = relationship("CategoryModel", back_populates="products")

# Модель оформленого замовлення
class OrderModel(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    status = Column(String, default="Обробляється")
    phone = Column(String, nullable=False)
    delivery_address = Column(String, nullable=False)
    total_amount = Column(Float, nullable=False)

    user = relationship("UserModel", back_populates="orders")
    items = relationship("OrderItemModel", back_populates="order")

# Модель окремої позиції (товару з обраним розміром і кольором) у замовленні
class OrderItemModel(Base):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"))
    product_id = Column(Integer, ForeignKey("products.id"))
    quantity = Column(Integer, default=1)
    price_per_unit = Column(Float, nullable=False)
    selected_size = Column(String, nullable=False)
    selected_color = Column(String, nullable=False)

    order = relationship("OrderModel", back_populates="items")
    product = relationship("ProductModel")
