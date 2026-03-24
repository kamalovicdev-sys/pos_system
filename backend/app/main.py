from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import Optional  # <--- Sana majburiy bo'lmasligi uchun qo'shildi
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


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@app.get("/")
def read_root():
    return {"status": "Muvaffaqiyatli", "message": "POS tizimi serveri ishlab turibdi!"}


@app.post("/categories/", response_model=schemas.Category)
def create_category(category: schemas.CategoryCreate, db: Session = Depends(get_db)):
    return crud.create_category(db=db, category=category)


@app.get("/categories/", response_model=list[schemas.Category])
def read_categories(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.get_categories(db, skip=skip, limit=limit)


@app.post("/products/", response_model=schemas.Product)
def create_product(product: schemas.ProductCreate, db: Session = Depends(get_db)):
    db_product = crud.get_product_by_barcode(db, barcode=product.barcode)
    if db_product:
        raise HTTPException(status_code=400, detail="Bu shtrix-kod allaqachon ro'yxatdan o'tgan!")
    return crud.create_product(db=db, product=product)


@app.get("/products/scan/{barcode}")
def scan_product(barcode: str, db: Session = Depends(get_db)):
    db_product = crud.get_product_by_barcode(db, barcode=barcode)
    if db_product is None:
        raise HTTPException(status_code=404, detail="Mahsulot topilmadi")

    inventory = db.query(models.Inventory).filter(models.Inventory.product_id == db_product.id).order_by(
        models.Inventory.id.desc()).first()
    current_price = inventory.selling_price if inventory else 0.0

    return {
        "id": db_product.id,
        "barcode": db_product.barcode,
        "name": db_product.name,
        "unit": db_product.unit,
        "category_id": db_product.category_id,
        "price": current_price
    }


@app.post("/inventory/", response_model=schemas.Inventory)
def add_to_inventory(inventory: schemas.InventoryCreate, db: Session = Depends(get_db)):
    return crud.create_inventory(db=db, inventory=inventory)


@app.post("/sales/", response_model=schemas.SaleResponse)
def checkout(sale: schemas.SaleCreate, db: Session = Depends(get_db)):
    return crud.create_sale(db=db, sale_data=sale)


@app.post("/debts/customer/pay")
def pay_customer(payment: schemas.DebtPaymentCreate, db: Session = Depends(get_db)):
    return crud.pay_customer_debt(db, payment)


@app.post("/debts/supplier/pay")
def pay_supplier(payment: schemas.DebtPaymentCreate, db: Session = Depends(get_db)):
    return crud.pay_supplier_debt(db, payment)


# --- YANGILANGAN: Sanalarni qabul qiladigan hisobotlar API'si ---
@app.get("/reports/dashboard")
def get_dashboard_data(
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        db: Session = Depends(get_db)
):
    return crud.get_dashboard_stats(db, start_date=start_date, end_date=end_date)