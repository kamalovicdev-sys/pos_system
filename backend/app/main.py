from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import Optional
from datetime import timedelta
from . import models, schemas, crud, auth
from .database import engine, get_db # <--- get_db endi to'g'ri joydan kelyapti

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Enterprise POS API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Tizim yonganda Default Admin yaratish
@app.on_event("startup")
def create_default_admin():
    # Endi get_db() generator bo'lgani uchun uni to'g'ri chaqiramiz
    db = next(get_db())
    admin = crud.get_user_by_username(db, "admin")
    if not admin:
        admin_data = schemas.UserCreate(username="admin", password="password123", role="admin")
        crud.create_user(db, admin_data)
        print("DIQQAT: Default admin yaratildi! Login: admin, Parol: password123")
    db.close()

# --- LOGIN (TOKEN OLISH) API ---
@app.post("/login", response_model=schemas.Token)
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = crud.get_user_by_username(db, username=form_data.username)
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Noto'g'ri login yoki parol",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": user.username, "role": user.role}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

# --- BARCHA API'LAR HIMOYALANDI ---
@app.get("/")
def read_root():
    return {"status": "Secure Enterprise API is running"}

@app.post("/categories/", response_model=schemas.Category)
def create_category(category: schemas.CategoryCreate, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    return crud.create_category(db=db, category=category)

@app.get("/categories/", response_model=list[schemas.Category])
def read_categories(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    return crud.get_categories(db, skip=skip, limit=limit)

@app.post("/products/", response_model=schemas.Product)
def create_product(product: schemas.ProductCreate, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    db_product = crud.get_product_by_barcode(db, barcode=product.barcode)
    if db_product:
        raise HTTPException(status_code=400, detail="Shtrix-kod band")
    return crud.create_product(db=db, product=product)

@app.get("/products/scan/{barcode}")
def scan_product(barcode: str, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    db_product = crud.get_product_by_barcode(db, barcode=barcode)
    if db_product is None:
        raise HTTPException(status_code=404, detail="Topilmadi")
    inventory = db.query(models.Inventory).filter(models.Inventory.product_id == db_product.id).order_by(models.Inventory.id.desc()).first()
    return {
        "id": db_product.id, "barcode": db_product.barcode, "name": db_product.name,
        "unit": db_product.unit, "category_id": db_product.category_id,
        "price": inventory.selling_price if inventory else 0.0
    }

@app.post("/inventory/", response_model=schemas.Inventory)
def add_to_inventory(inventory: schemas.InventoryCreate, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    return crud.create_inventory(db=db, inventory=inventory)

@app.post("/sales/", response_model=schemas.SaleResponse)
def checkout(sale: schemas.SaleCreate, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    return crud.create_sale(db=db, sale_data=sale)

@app.post("/debts/customer/pay")
def pay_customer(payment: schemas.DebtPaymentCreate, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    return crud.pay_customer_debt(db, payment)

@app.post("/debts/supplier/pay")
def pay_supplier(payment: schemas.DebtPaymentCreate, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    return crud.pay_supplier_debt(db, payment)

@app.get("/reports/dashboard")
def get_dashboard_data(start_date: Optional[str] = None, end_date: Optional[str] = None, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    return crud.get_dashboard_stats(db, start_date=start_date, end_date=end_date)