"""
Сервіс обробки та супроводу замовлень (OrderService).
Інкапсулює перевірку залишків на складі, розрахунок вартості замовлення,
транзакційне списання та повернення товарів при зміні статусу.
"""

import re
from typing import List
from sqlalchemy.orm import Session

from src.models.models import OrderModel, OrderItemModel, ProductModel, UserModel
from src.schemas.schemas import (
    OrderCreate,
    OrderResponse,
    OrderDetailSchema,
    OrderItemDetailSchema
)
from src.services.exceptions import ServiceError, ForbiddenError, NotFoundError

# Сервісний клас життєвого циклу замовлень покупців
class OrderService:
    ALLOWED_STATUSES = {"Обробляється", "Відправлено", "Виконано", "Скасовано"}

    # Перетворює ORM-модель замовлення та пов'язані позиції у DTO-схему відповіді
    @staticmethod
    def _serialize_order(order: OrderModel) -> OrderDetailSchema:
        items_data = [
            OrderItemDetailSchema(
                id=item.id,
                product_id=item.product_id,
                product_name=item.product.name if item.product else f"Товар #{item.product_id}",
                quantity=item.quantity,
                price_per_unit=item.price_per_unit,
                selected_size=item.selected_size,
                selected_color=item.selected_color
            )
            for item in order.items
        ]

        return OrderDetailSchema(
            id=order.id,
            created_at=order.created_at,
            status=order.status,
            phone=order.phone,
            delivery_address=order.delivery_address,
            total_amount=order.total_amount,
            customer_name=order.user.full_name if order.user else "Покупець",
            customer_email=order.user.email if order.user else "",
            items=items_data
        )

    # Оформлює нове замовлення: перевіряє телефон, наявність товарів і списує залишки зі складу
    @classmethod
    def create_order(
        cls,
        db: Session,
        current_user: UserModel,
        order_data: OrderCreate
    ) -> OrderResponse:
        if current_user.role == "Admin":
            raise ForbiddenError("Адміністратор не може оформлювати замовлення")

        if not order_data.items:
            raise ServiceError("Кошик порожній")

        # Валідація номера телефону
        digits = re.sub(r"\D", "", order_data.phone)
        if len(digits) != 12 or not digits.startswith("380"):
            raise ServiceError("Некоректний формат номера телефону (+380 XX XXX XX XX)")

        total_amount = 0.0
        order_items_to_create = []

        # Перевірка наявності кожної позиції, розрахунок суми та резервування залишків
        for item in order_data.items:
            product = db.query(ProductModel).filter(ProductModel.id == item.product_id).first()
            if not product or product.stock_quantity < 1:
                raise ServiceError(
                    f"Товар '{product.name if product else item.product_id}' відсутній на складі"
                )

            product.stock_quantity -= 1
            total_amount += product.price

            order_items_to_create.append(
                OrderItemModel(
                    product_id=product.id,
                    quantity=1,
                    price_per_unit=product.price,
                    selected_size=item.selected_size,
                    selected_color=item.selected_color
                )
            )

        # Створення заголовка замовлення в БД
        new_order = OrderModel(
            user_id=current_user.id,
            phone=order_data.phone,
            delivery_address=order_data.delivery_address,
            total_amount=total_amount,
            status="Обробляється"
        )
        db.add(new_order)
        db.commit()
        db.refresh(new_order)

        # Прив'язка та збереження всіх товарних позицій замовлення
        for item in order_items_to_create:
            item.order_id = new_order.id
            db.add(item)
        db.commit()

        return OrderResponse(
            order_id=new_order.id,
            status=new_order.status,
            total_amount=total_amount,
            message="Замовлення успішно створено!"
        )

    # Повертає історію замовлень конкретного покупця від найновіших до старіших
    @classmethod
    def get_user_orders(cls, db: Session, user_id: int) -> List[OrderDetailSchema]:
        orders = (
            db.query(OrderModel)
            .filter(OrderModel.user_id == user_id)
            .order_by(OrderModel.created_at.desc())
            .all()
        )
        return [cls._serialize_order(order) for order in orders]

    # Повертає всі замовлення клієнтів магазину для панелі адміністратора
    @classmethod
    def get_all_orders(cls, db: Session) -> List[OrderDetailSchema]:
        orders = (
            db.query(OrderModel)
            .order_by(OrderModel.created_at.desc())
            .all()
        )
        return [cls._serialize_order(order) for order in orders]

    # Оновлює статус замовлення з автоматичним перерахунком складських залишків
    @classmethod
    def update_order_status(
        cls,
        db: Session,
        order_id: int,
        new_status: str
    ) -> OrderDetailSchema:
        if new_status not in cls.ALLOWED_STATUSES:
            raise ServiceError("Недопустимий статус замовлення")

        order = db.query(OrderModel).filter(OrderModel.id == order_id).first()
        if not order:
            raise NotFoundError("Замовлення не знайдено")

        # Повернення товарів на склад у разі скасування замовлення
        if order.status != "Скасовано" and new_status == "Скасовано":
            for item in order.items:
                if item.product:
                    item.product.stock_quantity += item.quantity

        # Повторне списання товарів у разі відновлення скасованого замовлення
        elif order.status == "Скасовано" and new_status != "Скасовано":
            for item in order.items:
                if not item.product or item.product.stock_quantity < item.quantity:
                    raise ServiceError("Недостатньо товару на складі для відновлення замовлення")
            for item in order.items:
                item.product.stock_quantity -= item.quantity

        order.status = new_status
        db.commit()
        db.refresh(order)
        return cls._serialize_order(order)
