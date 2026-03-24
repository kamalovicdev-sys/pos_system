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

    # YANGI: Nasiya va Ta'minotchi ma'lumotlari
    is_credit: bool = False
    supplier_name: Optional[str] = None


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

    # YANGI: Nasiya va Mijoz ma'lumotlari
    is_credit: bool = False
    customer_name: Optional[str] = None

    items: List[SaleItemCreate]


# Backend'dan React'ga qaytuvchi tayyor chek ichidagi mahsulot
class SaleItemResponse(BaseModel):
    product_id: int
    quantity: float
    price: float
    cost_price: float = 0.0  # Sof foydani hisoblash uchun
    product: Product  # Mahsulotning to'liq obyekti (nomi chiqishi uchun)

    model_config = {"from_attributes": True}


# Tayyor to'liq chek (Printerga yuborish uchun)
class SaleResponse(BaseModel):
    id: int
    total_amount: float
    payment_type: str

    # YANGI: Nasiya ma'lumotlari qaytishi uchun
    is_credit: bool
    customer_name: Optional[str] = None

    created_at: datetime
    items: List[SaleItemResponse]

    model_config = {"from_attributes": True}

# --- QARZ TO'LOVLARI UCHUN SXEMA ---
class DebtPaymentCreate(BaseModel):
    name: str
    amount: float