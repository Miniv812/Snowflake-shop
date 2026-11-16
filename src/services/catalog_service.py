"""
Сервіс управління каталогом товарів і категорій (CatalogService).
Інкапсулює фільтрацію асортименту та CRUD-операції над товарами в базі даних.
"""

from typing import List, Optional
from sqlalchemy.orm import Session

from src.models.models import ProductModel, CategoryModel, OrderItemModel
from src.schemas.schemas import ProductCreate
from src.services.exceptions import NotFoundError, ServiceError

# Сервісний клас для роботи з категоріями та асортиментом товарів
class CatalogService:
    # Повертає повний список категорій зимового одягу, відсортований за ідентифікатором
    @staticmethod
    def list_categories(db: Session) -> List[CategoryModel]:
        return db.query(CategoryModel).order_by(CategoryModel.id).all()

    # Виконує динамічну фільтрацію товарів у БД за всіма переданими параметрами
    @staticmethod
    def list_products(
        db: Session,
        category_id: Optional[int] = None,
        temp_from: Optional[int] = None,
        temp_to: Optional[int] = None,
        min_price: Optional[float] = None,
        max_price: Optional[float] = None,
        search: Optional[str] = None,
        material: Optional[str] = None,
        size: Optional[str] = None,
        color: Optional[str] = None
    ) -> List[ProductModel]:
        query = db.query(ProductModel)

        # Застосування фільтрів за категорією, температурою та ціновим діапазоном
        if category_id is not None:
            query = query.filter(ProductModel.category_id == category_id)
        if temp_from is not None:
            query = query.filter(ProductModel.temp_min <= temp_from)
        if temp_to is not None:
            query = query.filter(ProductModel.temp_min >= temp_to)
        if min_price is not None:
            query = query.filter(ProductModel.price >= min_price)
        if max_price is not None:
            query = query.filter(ProductModel.price <= max_price)

        # Регістронезалежний пошук за назвою, матеріалом, розміром та кольором
        if search:
            query = query.filter(ProductModel.name.ilike(f"%{search}%"))
        if material:
            query = query.filter(ProductModel.material.ilike(f"%{material}%"))
        if size:
            query = query.filter(ProductModel.size_grid.ilike(f"%{size}%"))
        if color:
            query = query.filter(ProductModel.color.ilike(f"%{color}%"))

        return query.all()

    # Створює нову позицію товару в каталозі після перевірки існування категорії
    @staticmethod
    def create_product(db: Session, product_data: ProductCreate) -> ProductModel:
        category = db.query(CategoryModel).filter(CategoryModel.id == product_data.category_id).first()
        if not category:
            raise NotFoundError("Обрану категорію не знайдено")

        new_product = ProductModel(
            category_id=product_data.category_id,
            name=product_data.name,
            description=product_data.description,
            price=product_data.price,
            material=product_data.material,
            color=product_data.color,
            temp_min=product_data.temp_min,
            size_grid=product_data.size_grid,
            stock_quantity=product_data.stock_quantity,
            image_url=product_data.image_url
        )
        db.add(new_product)
        db.commit()
        db.refresh(new_product)
        return new_product

    # Оновлює характеристики існуючого товару (зображення змінюється лише якщо передано нове)
    @staticmethod
    def update_product(db: Session, product_id: int, product_data: ProductCreate) -> ProductModel:
        product = db.query(ProductModel).filter(ProductModel.id == product_id).first()
        if not product:
            raise NotFoundError("Товар не знайдено")

        category = db.query(CategoryModel).filter(CategoryModel.id == product_data.category_id).first()
        if not category:
            raise NotFoundError("Обрану категорію не знайдено")

        product.category_id = product_data.category_id
        product.name = product_data.name
        product.description = product_data.description
        product.price = product_data.price
        product.material = product_data.material
        product.color = product_data.color
        product.temp_min = product_data.temp_min
        product.size_grid = product_data.size_grid
        product.stock_quantity = product_data.stock_quantity

        if product_data.image_url is not None:
            product.image_url = product_data.image_url

        db.commit()
        db.refresh(product)
        return product

    # Видаляє товар із бази даних, якщо він не задіяний в оформлених замовленнях
    @staticmethod
    def delete_product(db: Session, product_id: int) -> None:
        product = db.query(ProductModel).filter(ProductModel.id == product_id).first()
        if not product:
            raise NotFoundError("Товар не знайдено")

        has_orders = db.query(OrderItemModel).filter(OrderItemModel.product_id == product_id).first()
        if has_orders:
            raise ServiceError("Неможливо видалити товар, оскільки він вже є в оформлених замовленнях")

        db.delete(product)
        db.commit()
