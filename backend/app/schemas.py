from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

# --- KATEGORIYA SXEMALARI ---
class CategoryBase(BaseModel):
    name: str

class CategoryCreate(CategoryBase):
    pass

class Category(CategoryBase):
    id: int

    model_config = {"from_attributes": True}

# --- MAHSULOT SXEMALARI ---
class ProductBase(BaseModel):
    barcode: str
    name: str
    unit: str
    category_id: int

class ProductCreate(ProductBase):
    pass

class Product(ProductBase):
    id: int

    model_config = {"from_attributes": True}

# --- OMBOR (INVENTORY) SXEMALARI ---
class InventoryBase(BaseModel):
    product_id: int
    quantity: float
    cost_price: float
    selling_price: float
    expiry_date: Optional[datetime] = None

class InventoryCreate(InventoryBase):
    pass

class Inventory(InventoryBase):
    id: int
    created_at: datetime

    model_config = {"from_attributes": True}


# --- CHEK VA SAVDO SXEMALARI ---

# React'dan keladigan bitta mahsulot ma'lumoti
class SaleItemCreate(BaseModel):
    product_id: int
    quantity: float


# React'dan keladigan to'liq chek ma'lumoti (savat)
class SaleCreate(BaseModel):
    payment_type: str  # 'cash' yoki 'card'
    items: List[SaleItemCreate]


# Backend'dan React'ga qaytuvchi tayyor chek ichidagi mahsulot
class SaleItemResponse(BaseModel):
    product_id: int
    quantity: float
    price: float
    product: Product

    model_config = {"from_attributes": True}


# Tayyor to'liq chek (Printerga yuborish uchun)
class SaleResponse(BaseModel):
    id: int
    total_amount: float
    payment_type: str
    created_at: datetime
    items: List[SaleItemResponse]

    model_config = {"from_attributes": True}