from sqlalchemy.orm import Session
from sqlalchemy import func
from . import models, schemas


# ==========================================
# KATEGORIYALAR UCHUN MANTIQ
# ==========================================
def create_category(db: Session, category: schemas.CategoryCreate):
    db_category = models.Category(name=category.name)
    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    return db_category


def get_categories(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Category).offset(skip).limit(limit).all()


# ==========================================
# MAHSULOTLAR (KATALOG) UCHUN MANTIQ
# ==========================================
def create_product(db: Session, product: schemas.ProductCreate):
    db_product = models.Product(**product.model_dump())
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product


# Skaner uchun eng asosiy funksiya: shtrix-kod bo'yicha qidirish
def get_product_by_barcode(db: Session, barcode: str):
    return db.query(models.Product).filter(models.Product.barcode == barcode).first()


# ==========================================
# OMBOR (INVENTORY - PRIXOD) MANTIG'I
# ==========================================
def create_inventory(db: Session, inventory: schemas.InventoryCreate):
    # Mahsulotni omborga qabul qilish (shu jumladan nasiyaga olingan bo'lsa)
    db_inventory = models.Inventory(**inventory.model_dump())
    db.add(db_inventory)
    db.commit()
    db.refresh(db_inventory)
    return db_inventory


# ==========================================
# SAVDO (KASSA VA CHEK) MANTIG'I
# ==========================================
def create_sale(db: Session, sale_data: schemas.SaleCreate):
    # 1. Avval bo'sh chek yaratib olamiz (Nasiya va Mijoz ismini ham qo'shib)
    db_sale = models.Sale(
        payment_type=sale_data.payment_type,
        total_amount=0,
        is_credit=sale_data.is_credit,
        customer_name=sale_data.customer_name
    )
    db.add(db_sale)
    db.commit()
    db.refresh(db_sale)

    total_amount = 0.0

    # 2. Savatchadagi har bir mahsulotni aylanib chiqamiz
    for item in sale_data.items:
        # Mahsulotning eng oxirgi narxini va qoldig'ini Inventory'dan qidiramiz
        inventory = db.query(models.Inventory).filter(models.Inventory.product_id == item.product_id).order_by(
            models.Inventory.id.desc()).first()

        # Agar mahsulot omborda bor bo'lsa
        if inventory:
            price = inventory.selling_price
            cost_price = inventory.cost_price  # P&L hisoboti uchun tan narxni olib qolamiz
            # Ombor qoldig'ini ayiramiz
            inventory.quantity -= item.quantity
        else:
            price = 0.0
            cost_price = 0.0

            # Qator summasi = narx * soni
        line_total = price * item.quantity
        total_amount += line_total

        # Chek ichiga mahsulotni yozamiz
        db_sale_item = models.SaleItem(
            sale_id=db_sale.id,
            product_id=item.product_id,
            quantity=item.quantity,
            price=price,
            cost_price=cost_price  # Foydani hisoblash uchun bazaga yozamiz
        )
        db.add(db_sale_item)

    # 3. Jami summani yangilab, o'zgarishlarni bazaga saqlaymiz
    db_sale.total_amount = total_amount
    db.commit()
    db.refresh(db_sale)

    return db_sale


# ==========================================
# BIZNES ANALITIKA VA DASHBOARD MANTIG'I
# ==========================================
def get_dashboard_stats(db: Session):
    # 1. P&L (Daromad, Xarajat va Sof Foyda)
    sales = db.query(models.Sale).all()
    total_revenue = sum(sale.total_amount for sale in sales)

    sale_items = db.query(models.SaleItem).all()
    # Jami xarajat (Tan narx * Sotilgan soni)
    total_cogs = sum(item.cost_price * item.quantity for item in sale_items)
    # Sof foyda
    net_profit = total_revenue - total_cogs

    # 2. Bizga qarzlar (Nasiyaga berilgan mahsulotlar)
    customer_debts = [
        {
            "customer": sale.customer_name,
            "amount": sale.total_amount,
            "date": sale.created_at
        }
        for sale in sales if sale.is_credit
    ]
    total_customer_debt = sum(d["amount"] for d in customer_debts)

    # 3. Bizning qarzlar (Ta'minotchidan nasiyaga olingan tovarlar)
    inventories = db.query(models.Inventory).all()
    supplier_debts = [
        {
            "supplier": inv.supplier_name,
            "product": inv.product.name,
            "amount": inv.quantity * inv.cost_price,
            "date": inv.created_at
        }
        for inv in inventories if inv.is_credit
    ]
    total_supplier_debt = sum(d["amount"] for d in supplier_debts)

    # 4. Low stock (Omborda 10 tadan kam qolgan mahsulotlar)
    low_stock_query = db.query(models.Inventory).filter(models.Inventory.quantity <= 10).all()
    low_stock_items = [
        {
            "product_name": item.product.name,
            "quantity": item.quantity,
            "selling_price": item.selling_price
        }
        for item in low_stock_query
    ]

    # Frontend kutayotgan formatda qaytaramiz
    return {
        "pl_analysis": {
            "revenue": total_revenue,
            "cogs": total_cogs,
            "net_profit": net_profit
        },
        "debts_receive": {
            "total": total_customer_debt,
            "list": customer_debts
        },
        "debts_pay": {
            "total": total_supplier_debt,
            "list": supplier_debts
        },
        "low_stock_items": low_stock_items
    }