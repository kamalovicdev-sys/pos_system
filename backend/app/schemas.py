from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class CategoryBase(BaseModel):
    name: str

class CategoryCreate(CategoryBase):
    pass

class Category(CategoryBase):
    id: int
    model_config = {"from_attributes": True}

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

class InventoryBase(BaseModel):
    product_id: int
    quantity: float
    cost_price: float
    selling_price: float

class InventoryCreate(InventoryBase):
    is_credit: bool = False
    supplier_name: Optional[str] = None

class Inventory(InventoryBase):
    id: int
    created_at: datetime
    is_credit: bool
    supplier_name: Optional[str] = None
    model_config = {"from_attributes": True}

class SaleItemCreate(BaseModel):
    product_id: int
    quantity: float

class SaleCreate(BaseModel):
    payment_type: str
    is_credit: bool = False
    customer_name: Optional[str] = None
    items: List[SaleItemCreate]

class SaleItemResponse(BaseModel):
    product_id: int
    quantity: float
    price: float
    product: Product
    model_config = {"from_attributes": True}

class SaleResponse(BaseModel):
    id: int
    total_amount: float
    payment_type: str
    created_at: datetime
    is_credit: bool
    customer_name: Optional[str] = None
    items: List[SaleItemResponse]
    model_config = {"from_attributes": True}

class DebtPaymentCreate(BaseModel):
    name: str
    amount: float

# YANGI: Xavfsizlik sxemalari
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

class UserCreate(BaseModel):
    username: str
    password: str
    role: str = "cashier"

class UserResponse(BaseModel):
    id: int
    username: str
    role: str
    is_active: bool
    model_config = {"from_attributes": True}