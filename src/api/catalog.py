"""
HTTP-роутер каталогу товарів (Catalog API Controller).
Відповідає за маршрутизацію HTTP-запитів та перевірку прав адміністратора,
делегуючи роботу з даними сервісу CatalogService.
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from src.database import get_db
from src.models.models import UserModel
from src.schemas.schemas import ProductSchema, ProductCreate, CategorySchema
from src.security import get_current_admin
from src.services.catalog_service import CatalogService

# Ініціалізація роутера для роботи з категоріями та товарами каталогу
router = APIRouter(prefix="/api/v1/catalog", tags=["Catalog"])

# Публічний ендпоїнт отримання списку всіх категорій товарів
@router.get("/categories", response_model=List[CategorySchema])
def get_categories(db: Session = Depends(get_db)):
    return CatalogService.list_categories(db)

# Публічний ендпоїнт отримання каталогу товарів з підтримкою багатокритеріальної фільтрації
@router.get("/products", response_model=List[ProductSchema])
def get_products(
    category_id: Optional[int] = Query(None),
    temp_from: Optional[int] = Query(None),
    temp_to: Optional[int] = Query(None),
    min_price: Optional[float] = Query(None),
    max_price: Optional[float] = Query(None),
    search: Optional[str] = Query(None),
    material: Optional[str] = Query(None),
    size: Optional[str] = Query(None),
    color: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    return CatalogService.list_products(
        db=db,
        category_id=category_id,
        temp_from=temp_from,
        temp_to=temp_to,
        min_price=min_price,
        max_price=max_price,
        search=search,
        material=material,
        size=size,
        color=color
    )

# Захищений ендпоїнт додавання нового товару (лише для адміністратора)
@router.post("/products", response_model=ProductSchema, status_code=status.HTTP_201_CREATED)
def create_product(
    product_data: ProductCreate,
    db: Session = Depends(get_db),
    admin: UserModel = Depends(get_current_admin)
):
    return CatalogService.create_product(db, product_data)

# Захищений ендпоїнт редагування параметрів існуючого товару (лише для адміністратора)
@router.put("/products/{product_id}", response_model=ProductSchema)
def update_product(
    product_id: int,
    product_data: ProductCreate,
    db: Session = Depends(get_db),
    admin: UserModel = Depends(get_current_admin)
):
    return CatalogService.update_product(db, product_id, product_data)

# Захищений ендпоїнт видалення товару з бази даних (лише для адміністратора)
@router.delete("/products/{product_id}", status_code=status.HTTP_200_OK)
def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    admin: UserModel = Depends(get_current_admin)
):
    CatalogService.delete_product(db, product_id)
    return {"message": "Товар успішно видалено"}
