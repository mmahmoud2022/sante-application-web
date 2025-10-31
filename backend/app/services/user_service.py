"""
User service for business logic
"""
from typing import Optional, List
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.user import User, UserRole
from app.schemas.user import UserCreate, UserUpdate
from app.core.security import get_password_hash, verify_password


def get_user_by_id(db: Session, user_id: int) -> Optional[User]:
    """Get user by ID"""
    return db.query(User).filter(User.id == user_id).first()


def get_user_by_email(db: Session, email: str) -> Optional[User]:
    """Get user by email"""
    return db.query(User).filter(User.email == email).first()


def get_users(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    role: Optional[UserRole] = None
) -> List[User]:
    """Get list of users with optional filtering"""
    query = db.query(User)
    
    if role:
        query = query.filter(User.role == role)
    
    return query.offset(skip).limit(limit).all()


def create_user(db: Session, user: UserCreate) -> User:
    """Create a new user"""
    # Check if user already exists
    existing_user = get_user_by_email(db, user.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new user with all provided fields
    db_user = User(
        email=user.email,
        hashed_password=get_password_hash(user.password),
        first_name=user.first_name,
        last_name=user.last_name,
        phone=user.phone,
        role=user.role,
        date_of_birth=user.date_of_birth,
        specialization=user.specialization,
        license_number=user.license_number,
        city=user.city,
    )
    
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    return db_user


def update_user(
    db: Session,
    user_id: int,
    user_update: UserUpdate,
    allow_privileged_fields: bool = False
) -> Optional[User]:
    """Update user information"""
    db_user = get_user_by_id(db, user_id)
    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Update only provided fields
    update_data = user_update.model_dump(exclude_unset=True)

    if not allow_privileged_fields:
        restricted_fields = {"is_active", "is_verified"}
        attempted_restricted = restricted_fields.intersection(update_data.keys())
        if attempted_restricted:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not enough permissions to update these fields"
            )

    for field, value in update_data.items():
        setattr(db_user, field, value)
    
    db.commit()
    db.refresh(db_user)
    
    return db_user


def delete_user(db: Session, user_id: int) -> bool:
    """Delete a user (soft delete by setting is_active to False)"""
    db_user = get_user_by_id(db, user_id)
    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    db_user.is_active = False
    db.commit()
    
    return True


def authenticate_user(db: Session, email: str, password: str) -> Optional[User]:
    """Authenticate a user"""
    user = get_user_by_email(db, email)
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user


def get_doctors(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    specialization: Optional[str] = None,
    city: Optional[str] = None,
    min_rating: Optional[float] = None,
    accepting_new_patients: Optional[bool] = None,
    search: Optional[str] = None
) -> List[User]:
    """Get list of doctors with optional filtering"""
    query = db.query(User).filter(User.role == UserRole.DOCTOR, User.is_active == True)
    
    if specialization:
        query = query.filter(User.specialization.ilike(f"%{specialization}%"))
    
    if city:
        query = query.filter(User.city.ilike(f"%{city}%"))
    
    if min_rating:
        query = query.filter(User.rating_average >= min_rating)
    
    if accepting_new_patients is not None:
        query = query.filter(User.accepting_new_patients == accepting_new_patients)
    
    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            (User.first_name.ilike(search_filter)) |
            (User.last_name.ilike(search_filter)) |
            (User.specialization.ilike(search_filter))
        )
    
    return query.offset(skip).limit(limit).all()
