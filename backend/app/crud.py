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


# --- SAVDO (CHECKOUT) MANTIG'I ---
def create_sale(db: Session, sale_data: schemas.SaleCreate):
    # 1. Avval bo'sh chek yaratib olamiz
    db_sale = models.Sale(payment_type=sale_data.payment_type, total_amount=0)
    db.add(db_sale)
    db.commit()
    db.refresh(db_sale)

    total_amount = 0.0

    # 2. Savatchadagi har bir mahsulotni aylanib chiqamiz
    for item in sale_data.items:
        # Mahsulotning narxini va qoldig'ini Inventory'dan qidiramiz
        inventory = db.query(models.Inventory).filter(models.Inventory.product_id == item.product_id).first()

        # Agar mahsulot omborda bor bo'lsa
        if inventory:
            price = inventory.selling_price
            # Ombor qoldig'ini ayiramiz (Invertarizatsiya shu yerda ishlaydi)
            inventory.quantity -= item.quantity
        else:
            price = 0.0  # Xavfsizlik uchun (garchi amaliyotda xato berish kerak bo'lsa ham)

        # Qator summasi = narx * soni
        line_total = price * item.quantity
        total_amount += line_total

        # Chek ichiga mahsulotni yozamiz
        db_sale_item = models.SaleItem(
            sale_id=db_sale.id,
            product_id=item.product_id,
            quantity=item.quantity,
            price=price
        )
        db.add(db_sale_item)

    # 3. Jami summani yangilab, o'zgarishlarni bazaga saqlaymiz
    db_sale.total_amount = total_amount
    db.commit()
    db.refresh(db_sale)

    return db_sale

# --- OMBOR (INVENTORY) MANTIG'I ---
def create_inventory(db: Session, inventory: schemas.InventoryCreate):
    # Mahsulotni omborga qabul qilish (Prixod)
    db_inventory = models.Inventory(**inventory.model_dump())
    db.add(db_inventory)
    db.commit()
    db.refresh(db_inventory)
    return db_inventory