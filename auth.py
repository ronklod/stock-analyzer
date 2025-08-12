from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from database.database import get_db
from database import User, pwd_context
from pydantic import BaseModel
import os

# Generate a secure random key:
# Use: openssl rand -hex 32
# Store this securely in production!
SECRET_KEY = os.environ.get("SECRET_KEY", "09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

# OAuth2 config for Google login
GOOGLE_CLIENT_ID = os.environ.get("GOOGLE_CLIENT_ID", "")
GOOGLE_CLIENT_SECRET = os.environ.get("GOOGLE_CLIENT_SECRET", "")
GOOGLE_REDIRECT_URI = os.environ.get("GOOGLE_REDIRECT_URI", "http://localhost:5001/api/auth/google/callback")

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/token")

# Pydantic Models
class Token(BaseModel):
    access_token: str
    token_type: str
    user_id: int
    email: str
    display_name: Optional[str] = None
    is_admin: bool = False
    is_active: bool = True

class TokenData(BaseModel):
    email: Optional[str] = None
    user_id: Optional[int] = None

class UserCreate(BaseModel):
    email: str
    password: str
    display_name: Optional[str] = None

class UserResponse(BaseModel):
    id: int
    email: str
    display_name: Optional[str] = None
    created_at: datetime
    is_active: bool = True
    is_admin: bool = False
    
    class Config:
        from_attributes = True

# Password Functions
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

# User Functions
def get_user(db: Session, email: str):
    return db.query(User).filter(User.email == email).first()

def get_user_by_id(db: Session, user_id: int):
    return db.query(User).filter(User.id == user_id).first()

def get_user_by_google_id(db: Session, google_id: str):
    return db.query(User).filter(User.google_id == google_id).first()

def create_user(db: Session, user: UserCreate):
    hashed_password = get_password_hash(user.password)
    db_user = User(
        email=user.email,
        hashed_password=hashed_password,
        display_name=user.display_name or user.email.split("@")[0]
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def create_or_update_google_user(db: Session, google_info):
    user = get_user_by_google_id(db, google_info["sub"])
    
    # If user doesn't exist by Google ID, try to find by email
    if not user:
        user = get_user(db, google_info["email"])
        
        # If user exists by email but doesn't have Google ID, update it
        if user:
            user.google_id = google_info["sub"]
            db.commit()
            db.refresh(user)
        # If the user doesn't exist at all, create a new one
        else:
            user = User(
                email=google_info["email"],
                google_id=google_info["sub"],
                display_name=google_info.get("name", google_info["email"].split("@")[0]),
                is_active=True
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            
    return user

def authenticate_user(db: Session, email: str, password: str):
    user = get_user(db, email)
    if not user:
        return None
    if not user.hashed_password:  # Google user without password
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user

# JWT Functions
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        user_id: int = payload.get("user_id")
        if email is None or user_id is None:
            raise credentials_exception
        token_data = TokenData(email=email, user_id=user_id)
    except JWTError:
        raise credentials_exception
    user = get_user_by_id(db, token_data.user_id)
    if user is None:
        raise credentials_exception
    return user

async def get_current_active_user(current_user: User = Depends(get_current_user)):
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Inactive user"
        )
    return current_user

async def get_current_admin_user(current_user: User = Depends(get_current_user)):
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized. Admin privileges required."
        )
    return current_user
