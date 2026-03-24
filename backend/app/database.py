from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base

# Ma'lumotlar bazasi manzili
SQLALCHEMY_DATABASE_URL = "sqlite:///./pos_system.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# MANA SHU FUNKSIYA YETISHMAYOTGAN EDI
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()