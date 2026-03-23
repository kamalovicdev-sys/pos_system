from sqlalchemy.orm import Session
from . import models, schemas

# --- KATEGORIYALAR UCHUN ---
def create_category(db: Session, category: schemas.CategoryCreate):
    db_category = models.Category(name=category.name)
    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    return db_category

def get_categories(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Category).offset(skip).limit(limit).all()

# --- MAHSULOTLAR UCHUN ---
def create_product(db: Session, product: schemas.ProductCreate):
    db_product = models.Product(**product.model_dump())
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product

# Skaner uchun eng asosiy funksiya: shtrix-kod bo'yicha qidirish
def get_product_by_barcode(db: Session, barcode: str):
    return db.query(models.Product).filter(models.Product.barcode == barcode).first()