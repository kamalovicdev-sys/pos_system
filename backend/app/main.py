from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from . import models, schemas, crud
from .database import engine, SessionLocal

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Oziq-ovqat POS API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Har bir so'rov uchun bazaga ulanish va uzishni ta'minlaydigan funksiya
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.get("/")
def read_root():
    return {"status": "Muvaffaqiyatli", "message": "POS tizimi serveri ishlab turibdi!"}

# --- KATEGORIYA API'LARI ---
@app.post("/categories/", response_model=schemas.Category)
def create_category(category: schemas.CategoryCreate, db: Session = Depends(get_db)):
    return crud.create_category(db=db, category=category)

@app.get("/categories/", response_model=list[schemas.Category])
def read_categories(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.get_categories(db, skip=skip, limit=limit)

# --- MAHSULOT VA SKANER API'LARI ---
@app.post("/products/", response_model=schemas.Product)
def create_product(product: schemas.ProductCreate, db: Session = Depends(get_db)):
    # Bazada bunday shtrix-kodli mahsulot bor-yo'qligini tekshiramiz
    db_product = crud.get_product_by_barcode(db, barcode=product.barcode)
    if db_product:
        raise HTTPException(status_code=400, detail="Bu shtrix-kod allaqachon ro'yxatdan o'tgan!")
    return crud.create_product(db=db, product=product)

# Skaner shu API'ga so'rov yuboradi
@app.get("/products/scan/{barcode}")
def scan_product(barcode: str, db: Session = Depends(get_db)):
    # 1. Mahsulotni topamiz
    db_product = crud.get_product_by_barcode(db, barcode=barcode)
    if db_product is None:
        raise HTTPException(status_code=404, detail="Mahsulot topilmadi")

    # 2. Ombordan shu mahsulotning eng oxirgi kiritilgan narxini qidiramiz
    inventory = db.query(models.Inventory).filter(models.Inventory.product_id == db_product.id).order_by(
        models.Inventory.id.desc()).first()

    # Agar omborda bo'lsa haqiqiy narxni, bo'lmasa 0 ni olamiz
    current_price = inventory.selling_price if inventory else 0.0

    # 3. Frontend'ga nomini va narxini qo'shib jo'natamiz
    return {
        "id": db_product.id,
        "barcode": db_product.barcode,
        "name": db_product.name,
        "unit": db_product.unit,
        "category_id": db_product.category_id,
        "price": current_price  # <--- Haqiqiy narx qo'shildi!
    }


# --- SAVDO VA CHEK API'LARI ---
@app.post("/sales/", response_model=schemas.SaleResponse)
def checkout(sale: schemas.SaleCreate, db: Session = Depends(get_db)):
    """
    Kassadan savdoni amalga oshirish va chek shakllantirish.
    Frontend bu yerga mahsulotlar ro'yxati va to'lov turini yuboradi.
    """
    # Chek yaratiladi va ombor qoldig'i avtomatik yangilanadi
    return crud.create_sale(db=db, sale_data=sale)


# --- OMBOR (INVENTORY) API'LARI ---
@app.post("/inventory/", response_model=schemas.Inventory)
def add_to_inventory(inventory: schemas.InventoryCreate, db: Session = Depends(get_db)):
    """
    Yangi kelgan tovarlarni omborga kiritish (Prixod qilish).
    Bu yerda kelish narxi, sotish narxi va miqdori kiritiladi.
    """
    return crud.create_inventory(db=db, inventory=inventory)


# --- HISOBOTLAR API'LARI ---
@app.get("/reports/dashboard")
def get_dashboard_data(db: Session = Depends(get_db)):
    """
    Admin panel uchun asosiy statistikalarni qaytaradi.
    """
    return crud.get_dashboard_stats(db)