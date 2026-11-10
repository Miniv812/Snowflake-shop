from pydantic import BaseModel
from typing import List

class OrderItemSchema(BaseModel):
    product_id: int
    quantity: int
    selected_size: any
    selected_color: any

class OrderCreateSchema(BaseModel):
    delivery_address: str
    items: List[OrderItemSchema]

class OrderResponseSchema(OrderCreateSchema):
    id: int
    user_id: int
    status: str
    total_amount: float

    class Config:
        from_attributes = True