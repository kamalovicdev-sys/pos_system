from sqlalchemy.orm import Session
from sqlalchemy import func
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


# --- HISOBOTLAR (DASHBOARD) MANTIG'I ---
def get_dashboard_stats(db: Session):
    # 1. Jami tushumni hisoblash
    total_revenue = db.query(func.sum(models.Sale.total_amount)).scalar() or 0.0

    # 2. Jami sotilgan cheklar soni
    total_sales_count = db.query(models.Sale).count()

    # 3. Omborda kam qolgan (tugayotgan) mahsulotlar (masalan, 10 tadan kam)
    # Tizim xavfsizligi uchun mahsulot nomi bilan birga olamiz
    low_stock_query = db.query(models.Inventory).filter(models.Inventory.quantity <= 10).all()

    low_stock_items = []
    for item in low_stock_query:
        low_stock_items.append({
            "product_name": item.product.name,
            "quantity": item.quantity,
            "selling_price": item.selling_price
        })

    return {
        "total_revenue": total_revenue,
        "total_sales_count": total_sales_count,
        "low_stock_items": low_stock_items
    }