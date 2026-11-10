# from sqlalchemy import Column, Integer, String, Float
# from src.database import Base

# class ProductModel(Base):
#     __tablename__ = "products"

#     id = Column(Integer, primary_key=True, index=True)
#     name = Column(String, nullable=False)
#     description = Column(String)
#     price = Column(Float, nullable=False)
    
#     # Спеціалізовані поля для зимового одягу магазину "Сніжинка"
#     material = Column(String)         # Склад: вовна, пух, фліс тощо
#     temp_min = Column(Integer)        # Мінімальна температура (наприклад, -20°C)
#     size_grid = Column(String)        # Сітка розмірів: S, M, L, XL
#     stock_quantity = Column(Integer, default=0)


# from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
# from sqlalchemy.orm import relationship
# from datetime import datetime
# from src.database import Base

# class UserModel(Base):
#     __tablename__ = "users"

#     id = Column(Integer, primary_key=True, index=True)
#     email = Column(String, unique=True, index=True, nullable=False)
#     password_hash = Column(String, nullable=False)
#     full_name = Column(String, nullable=False)
#     role = Column(String, default="Customer")

#     orders = relationship("OrderModel", back_populates="user")

# class CategoryModel(Base):
#     __tablename__ = "categories"

#     id = Column(Integer, primary_key=True, index=True)
#     name = Column(String, nullable=False)
#     description = Column(String)

#     products = relationship("ProductModel", back_populates="category")

# class ProductModel(Base):
#     __tablename__ = "products"

#     id = Column(Integer, primary_key=True, index=True)
#     category_id = Column(Integer, ForeignKey("categories.id"))
#     name = Column(String, nullable=False)
#     description = Column(String)
#     price = Column(Float, nullable=False)
#     material = Column(String)          # "Вовна 100%", "Пух 90%"
#     temp_min = Column(Integer)         # Рекомендована мінімальна температура (напр. -25)
#     size_grid = Column(String)        # "S, M, L, XL"
#     stock_quantity = Column(Integer, default=10)

#     category = relationship("CategoryModel", back_populates="products")

# class OrderModel(Base):
#     __tablename__ = "orders"

#     id = Column(Integer, primary_key=True, index=True)
#     user_id = Column(Integer, ForeignKey("users.id"))
#     created_at = Column(DateTime, default=datetime.utcnow)
#     status = Column(String, default="Обробляється")
#     delivery_address = Column(String, nullable=False)
#     total_amount = Column(Float, nullable=False)

#     user = relationship("UserModel", back_populates="orders")
#     items = relationship("OrderItemModel", back_populates="order")

# class OrderItemModel(Base):
#     __tablename__ = "order_items"

#     id = Column(Integer, primary_key=True, index=True)
#     order_id = Column(Integer, ForeignKey("orders.id"))
#     product_id = Column(Integer, ForeignKey("products.id"))
#     quantity = Column(Integer, nullable=False)
#     price_per_unit = Column(Float, nullable=False)
#     selected_size = Column(String, nullable=False)

#     order = relationship("OrderModel", back_populates="items")
#     product = relationship("ProductModel")