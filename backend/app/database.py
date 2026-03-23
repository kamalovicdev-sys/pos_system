from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# Ma'lumotlar bazasi fayli manzili
SQLALCHEMY_DATABASE_URL = "sqlite:///./pos_system.db"

# SQLite uchun maxsus parametrlar bilan engine yaratish
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)

# Har bir API so'rov uchun alohida sessiya ochish uchun
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Jadvallarni yaratish uchun asosiy klass
Base = declarative_base()