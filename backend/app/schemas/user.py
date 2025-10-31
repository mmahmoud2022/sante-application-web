"""
User schemas for request/response validation
"""
from pydantic import BaseModel, EmailStr, Field, ConfigDict, field_validator
from typing import Optional, Union
from datetime import datetime, date

from app.models.user import UserRole


class UserBase(BaseModel):
    """Base user schema"""
    email: EmailStr
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    phone: Optional[str] = Field(None, max_length=20)
    role: UserRole = UserRole.PATIENT


class UserCreate(UserBase):
    """Schema for creating a new user"""
    password: str = Field(..., min_length=8, max_length=100)
    admin_secret: Optional[str] = None  # Required only for admin registration
    
    # Additional optional fields
    date_of_birth: Optional[Union[datetime, date, str]] = None
    gender: Optional[str] = None
    
    # Doctor-specific fields
    specialization: Optional[str] = Field(None, max_length=100)
    license_number: Optional[str] = Field(None, max_length=50)
    practice_name: Optional[str] = Field(None, max_length=200)
    city: Optional[str] = Field(None, max_length=100)
    
    @field_validator('date_of_birth', mode='before')
    @classmethod
    def parse_date_of_birth(cls, v):
        """Parse date_of_birth from string if needed"""
        if v is None or v == '':
            return None
        if isinstance(v, str):
            try:
                # Try parsing as date only (YYYY-MM-DD) and convert to datetime
                return datetime.strptime(v, '%Y-%m-%d')
            except ValueError:
                try:
                    # Try parsing as datetime
                    return datetime.fromisoformat(v.replace('Z', '+00:00'))
                except ValueError:
                    return None
        return v


class UserLogin(BaseModel):
    """Schema for user login"""
    email: EmailStr
    password: str


class UserUpdate(BaseModel):
    """Schema for updating user information"""
    first_name: Optional[str] = Field(None, min_length=1, max_length=100)
    last_name: Optional[str] = Field(None, min_length=1, max_length=100)
    phone: Optional[str] = Field(None, max_length=20)
    date_of_birth: Optional[Union[datetime, date, str]] = None
    specialization: Optional[str] = Field(None, max_length=100)
    bio: Optional[str] = None
    experience_years: Optional[int] = Field(None, ge=0)
    consultation_fee: Optional[int] = Field(None, ge=0)
    address_line1: Optional[str] = Field(None, max_length=255)
    address_line2: Optional[str] = Field(None, max_length=255)
    city: Optional[str] = Field(None, max_length=100)
    state: Optional[str] = Field(None, max_length=100)
    postal_code: Optional[str] = Field(None, max_length=20)
    country: Optional[str] = Field(None, max_length=100)
    is_active: Optional[bool] = None
    is_verified: Optional[bool] = None
    
    @field_validator('date_of_birth', mode='before')
    @classmethod
    def parse_date_of_birth(cls, v):
        """Parse date_of_birth from string if needed"""
        if v is None or v == '':
            return None
        if isinstance(v, str):
            try:
                # Try parsing as date only (YYYY-MM-DD) and convert to datetime
                return datetime.strptime(v, '%Y-%m-%d')
            except ValueError:
                try:
                    # Try parsing as datetime
                    return datetime.fromisoformat(v.replace('Z', '+00:00'))
                except ValueError:
                    return None
        return v


class UserResponse(UserBase):
    """Schema for user response"""
    id: int
    is_active: bool
    is_verified: bool
    date_of_birth: Optional[datetime] = None
    specialization: Optional[str] = None
    license_number: Optional[str] = None
    bio: Optional[str] = None
    experience_years: Optional[int] = None
    consultation_fee: Optional[int] = None
    address_line1: Optional[str] = None
    address_line2: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    postal_code: Optional[str] = None
    country: Optional[str] = None
    profile_image: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)


class Token(BaseModel):
    """Schema for authentication token"""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class TokenPayload(BaseModel):
    """Schema for token payload"""
    sub: Optional[int] = None
    exp: Optional[int] = None
