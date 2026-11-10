from pydantic import BaseModel
from typing import List, Optional

class ProductSchema(BaseModel):
    id: int
    name: str
    description: Optional[str]
    price: float
    material: str
    temp_min: int
    size_grid: str
    stock_quantity: int

    class Config:
        from_attributes = True

class ProductCreate(BaseModel):
    name: str
    description: str
    price: float
    material: str
    temp_min: int
    size_grid: str
    stock_quantity: int

class OrderItemCreate(BaseModel):
    product_id: int
    quantity: int
    selected_size: str

class OrderCreate(BaseModel):
    user_email: str
    delivery_address: str
    items: List[OrderItemCreate]

class OrderResponse(BaseModel):
    order_id: int
    status: str
    total_amount: float
    message: str

class UserRegister(BaseModel):
    email: str
    password: str
    full_name: str

class UserLogin(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: int
    email: str
    full_name: str
    role: str

    class Config:
        from_attributes = True