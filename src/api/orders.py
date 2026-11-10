from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from src.database import get_db
from src.models.models import OrderModel, OrderItemModel, ProductModel, UserModel
from src.schemas.schemas import OrderCreate, OrderResponse

router = APIRouter(prefix="/api/v1/orders", tags=["Orders"])

@router.post("", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
def create_order(order_data: OrderCreate, db: Session = Depends(get_db)):
    # 1. Пошук або автоматичне створення користувача за email
    user = db.query(UserModel).filter(UserModel.email == order_data.user_email).first()
    if not user:
        user = UserModel(email=order_data.user_email, password_hash="hashed_demo", full_name="Покупець Сніжинки")
        db.add(user)
        db.commit()
        db.refresh(user)

    total_amount = 0.0
    order_items_to_create = []

    # 2. Перевірка наявності товарів на складі та обчислення суми
    for item in order_data.items:
        product = db.query(ProductModel).filter(ProductModel.id == item.product_id).first()
        if not product or product.stock_quantity < item.quantity:
            raise HTTPException(
                status_code=400, 
                detail=f"Товар '{product.name if product else item.product_id}' відсутній у потрібній кількості"
            )
        
        # Зменшення залишку на складі (update_stock)
        product.stock_quantity -= item.quantity
        item_total = product.price * item.quantity
        total_amount += item_total

        order_items_to_create.append(
            OrderItemModel(
                product_id=product.id,
                quantity=item.quantity,
                price_per_unit=product.price,
                selected_size=item.selected_size
            )
        )

    # 3. Збереження замовлення у базі даних
    new_order = OrderModel(
        user_id=user.id,
        delivery_address=order_data.delivery_address,
        total_amount=total_amount,
        status="Обробляється"
    )
    db.add(new_order)
    db.commit()
    db.refresh(new_order)

    for item in order_items_to_create:
        item.order_id = new_order.id
        db.add(item)
    db.commit()

    return OrderResponse(
        order_id=new_order.id,
        status=new_order.status,
        total_amount=total_amount,
        message="Замовлення успішно створене!"
    )