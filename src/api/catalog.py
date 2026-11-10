from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional
from src.database import get_db
from src.models.models import ProductModel, CategoryModel
from src.schemas.schemas import ProductSchema, ProductCreate

router = APIRouter(prefix="/api/v1/catalog", tags=["Catalog"])

@router.get("/products", response_model=List[ProductSchema])
def get_products(
    temp_min: Optional[int] = Query(None, description="Фільтр за мінімальною температурою"),
    db: Session = Depends(get_db)
):
    query = db.query(ProductModel)
    if temp_min is not None:
        query = query.filter(ProductModel.temp_min <= temp_min)
    return query.all()

@router.post("/products", response_model=ProductSchema, status_code=status.HTTP_201_CREATED)
def create_product(product_data: ProductCreate, db: Session = Depends(get_db)):
    category = db.query(CategoryModel).first()
    category_id = category.id if category else 1

    new_product = ProductModel(
        category_id=category_id,
        name=product_data.name,
        description=product_data.description,
        price=product_data.price,
        material=product_data.material,
        temp_min=product_data.temp_min,
        size_grid=product_data.size_grid,
        stock_quantity=product_data.stock_quantity
    )
    db.add(new_product)
    db.commit()
    db.refresh(new_product)
    return new_product