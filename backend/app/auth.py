from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
import bcrypt  # <--- passlib o'rniga sof bcrypt chaqirildi
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from . import models, schemas, database

# Xavfsizlik sozlamalari (Bularni sir saqlash kerak)
SECRET_KEY = "super-secret-enterprise-key-change-this-in-production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 600  # Token 10 soat yashaydi (1 smena)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")


# --- PAROLLARNI TEKSHIRISH VA SHIFRLASH (Yangilangan) ---
def verify_password(plain_password: str, hashed_password: str):
    # bcrypt faqat baytlar (bytes) bilan ishlaydi, shuning uchun encode() qilamiz
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))


def get_password_hash(password: str):
    # Parolni shifrlash va bazaga yozish uchun oddiy matnga (string) aylantirish
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')


# --- TOKEN YARATISH ---
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


# --- FOYDALANUVCHINI TEKSHIRISH (Qorovul) ---
def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(database.get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Token yaroqsiz yoki muddati tugagan",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = schemas.TokenData(username=username)
    except JWTError:
        raise credentials_exception

    user = db.query(models.User).filter(models.User.username == token_data.username).first()
    if user is None:
        raise credentials_exception
    return user