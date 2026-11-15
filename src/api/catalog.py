from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from src.database import get_db
from src.models.models import ProductModel, CategoryModel
from src.schemas.schemas import ProductSchema, ProductCreate

router = APIRouter(prefix="/api/v1/catalog", tags=["Catalog"])

@router.get("/products", response_model=List[ProductSchema])
def get_products(
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
    query = db.query(ProductModel)
    
    if temp_from is not None:
        query = query.filter(ProductModel.temp_min <= temp_from)
    if temp_to is not None:
        query = query.filter(ProductModel.temp_min >= temp_to)
    if min_price is not None:
        query = query.filter(ProductModel.price >= min_price)
    if max_price is not None:
        query = query.filter(ProductModel.price <= max_price)
    if search:
        query = query.filter(ProductModel.name.ilike(f"%{search}%"))
    if material:
        query = query.filter(ProductModel.material.ilike(f"%{material}%"))
    if size:
        query = query.filter(ProductModel.size_grid.ilike(f"%{size}%"))
    if color:
        query = query.filter(ProductModel.color.ilike(f"%{color}%"))
        
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

@router.delete("/products/{product_id}", status_code=status.HTTP_200_OK)
def delete_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(ProductModel).filter(ProductModel.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Товар не знайдено")
    db.delete(product)
    db.commit()
    return {"message": "Товар успішно видалено"}


@router.put("/products/{product_id}", response_model=ProductSchema)
def update_product(product_id: int, product_data: ProductCreate, db: Session = Depends(get_db)):
    product = db.query(ProductModel).filter(ProductModel.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Товар не знайдено")

    product.name = product_data.name
    product.description = product_data.description
    product.price = product_data.price
    product.material = product_data.material
    product.color = product_data.color
    product.temp_min = product_data.temp_min
    product.size_grid = product_data.size_grid
    product.stock_quantity = product_data.stock_quantity

    # Оновлюємо фото тільки якщо адміністратор завантажив нове
    if product_data.image_url is not None:
        product.image_url = product_data.image_url

    db.commit()
    db.refresh(product)
    return product