"""
Модуль Pydantic-схем (Data Transfer Objects / Validation Layer).
Визначає структуру та правила валідації JSON-даних для вхідних запитів
і вихідних відповідей REST API (категорії, каталог, замовлення, авторизація).
"""

from datetime import datetime
from pydantic import BaseModel
from typing import List, Optional


# Схема для передачі даних про категорію товарів клієнту
class CategorySchema(BaseModel):
    id: int
    name: str
    description: Optional[str] = None

    class Config:
        from_attributes = True


# Схема для повернення даних про товар клієнту
class ProductSchema(BaseModel):
    id: int
    category_id: Optional[int] = None
    name: str
    description: Optional[str]
    price: float
    material: str
    color: str
    temp_min: int
    size_grid: str
    stock_quantity: int
    image_url: Optional[str] = None

    class Config:
        from_attributes = True


# Схема вхідних даних для створення або оновлення товару адміністратором
class ProductCreate(BaseModel):
    category_id: int
    name: str
    description: str
    price: float
    material: str
    color: str
    temp_min: int
    size_grid: str
    stock_quantity: int
    image_url: Optional[str] = None


# Схема окремої позиції товару під час оформлення замовлення
class OrderItemCreate(BaseModel):
    product_id: int
    selected_size: str
    selected_color: str


# Схема вхідного запиту на створення замовлення
class OrderCreate(BaseModel):
    user_email: Optional[str] = None
    phone: str
    delivery_address: str
    items: List[OrderItemCreate]


# Схема відповіді сервера після успішного оформлення замовлення
class OrderResponse(BaseModel):
    order_id: int
    status: str
    total_amount: float
    message: str


# Схема детальної позиції товару в історії замовлень
class OrderItemDetailSchema(BaseModel):
    id: int
    product_id: Optional[int] = None
    product_name: str
    quantity: int
    price_per_unit: float
    selected_size: str
    selected_color: str


# Схема повної інформації про замовлення (для покупця та адміністратора)
class OrderDetailSchema(BaseModel):
    id: int
    created_at: datetime
    status: str
    phone: str
    delivery_address: str
    total_amount: float
    customer_name: str
    customer_email: str
    items: List[OrderItemDetailSchema]


# Схема запиту на зміну статусу замовлення адміністратором
class OrderStatusUpdate(BaseModel):
    status: str


# Схема вхідних даних для реєстрації нового користувача
class UserRegister(BaseModel):
    first_name: str
    last_name: str
    email: str
    password: str


# Схема вхідних даних для авторизації користувача
class UserLogin(BaseModel):
    email: str
    password: str


# Схема публічних даних профілю користувача та токена сесії
class UserResponse(BaseModel):
    id: int
    email: str
    full_name: str
    role: str
    access_token: Optional[str] = None

    class Config:
        from_attributes = True