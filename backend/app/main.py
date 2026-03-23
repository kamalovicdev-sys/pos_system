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
@app.get("/products/scan/{barcode}", response_model=schemas.Product)
def scan_product(barcode: str, db: Session = Depends(get_db)):
    db_product = crud.get_product_by_barcode(db, barcode=barcode)
    if db_product is None:
        raise HTTPException(status_code=404, detail="Mahsulot topilmadi")
    return db_product