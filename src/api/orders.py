"""
HTTP-роутер замовлень (Orders API Controller).
Відповідає за авторизацію користувачів і маршрутизацію запитів
до сервісу управління замовленнями OrderService.
"""

from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from src.database import get_db
from src.models.models import UserModel
from src.schemas.schemas import (
    OrderCreate,
    OrderResponse,
    OrderDetailSchema,
    OrderStatusUpdate
)
from src.security import get_current_user, get_current_admin
from src.services.order_service import OrderService

# Ініціалізація роутера для оформлення та адміністрування замовлень
router = APIRouter(prefix="/api/v1/orders", tags=["Orders"])

# Ендпоїнт оформлення нового замовлення авторизованим покупцем
@router.post("", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
def create_order(
    order_data: OrderCreate,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    return OrderService.create_order(db, current_user, order_data)

# Ендпоїнт перегляду власної історії замовлень поточного покупця
@router.get("/my", response_model=List[OrderDetailSchema])
def get_my_orders(
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    return OrderService.get_user_orders(db, current_user.id)

# Захищений ендпоїнт отримання всіх замовлень клієнтів (лише для адміністратора)
@router.get("", response_model=List[OrderDetailSchema])
def get_all_orders(
    db: Session = Depends(get_db),
    admin: UserModel = Depends(get_current_admin)
):
    return OrderService.get_all_orders(db)

# Захищений ендпоїнт зміни статусу виконання замовлення (лише для адміністратора)
@router.patch("/{order_id}/status", response_model=OrderDetailSchema)
def update_order_status(
    order_id: int,
    status_data: OrderStatusUpdate,
    db: Session = Depends(get_db),
    admin: UserModel = Depends(get_current_admin)
):
    return OrderService.update_order_status(db, order_id, status_data.status)
