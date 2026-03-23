from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base


class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)

    # Kategoriya ichidagi mahsulotlarni chaqirib olish uchun
    products = relationship("Product", back_populates="category")


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    barcode = Column(String, unique=True, index=True)  # Skaner uchun shtrix-kod
    name = Column(String, index=True)
    unit = Column(String)  # O'lchov birligi: dona, kg, litr
    category_id = Column(Integer, ForeignKey("categories.id"))

    category = relationship("Category", back_populates="products")
    inventories = relationship("Inventory", back_populates="product")


class Inventory(Base):
    __tablename__ = "inventory"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"))
    quantity = Column(Float, default=0.0)  # Ombordagi qoldiq
    cost_price = Column(Float)  # Kelish narxi (tan narx)
    selling_price = Column(Float)  # Kassa uchun sotish narxi
    expiry_date = Column(DateTime, nullable=True)  # Yaroqlilik muddati
    created_at = Column(DateTime, default=datetime.utcnow)  # Partiya kelgan vaqt

    product = relationship("Product", back_populates="inventories")


class Sale(Base):
    __tablename__ = "sales"

    id = Column(Integer, primary_key=True, index=True)
    total_amount = Column(Float, default=0.0)
    payment_type = Column(String)  # 'cash' (naqd) yoki 'card' (plastik)
    created_at = Column(DateTime, default=datetime.utcnow)

    items = relationship("SaleItem", back_populates="sale")


class SaleItem(Base):
    __tablename__ = "sale_items"

    id = Column(Integer, primary_key=True, index=True)
    sale_id = Column(Integer, ForeignKey("sales.id"))
    product_id = Column(Integer, ForeignKey("products.id"))
    quantity = Column(Float)
    price = Column(Float)  # Chek urilgan paytdagi narx (tarix uchun)

    sale = relationship("Sale", back_populates="items")
    product = relationship("Product")