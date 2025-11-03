"""
User management endpoints
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_active_user, check_user_role
from app.models.user import User, UserRole
from app.schemas.user import UserResponse, UserUpdate
from app.services.user_service import (
    get_user_by_id,
    get_users,
    get_doctors,
    update_user,
    delete_user
)

router = APIRouter()


@router.get("/me", response_model=UserResponse)
def get_current_user_info(
    current_user: User = Depends(get_current_active_user)
):
    """
    Get current user information
    """
    return current_user


@router.put("/me", response_model=UserResponse)
def update_current_user(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Update current user information
    """
    allow_privileged = current_user.role == UserRole.ADMIN
    return update_user(db, current_user.id, user_update, allow_privileged_fields=allow_privileged)


@router.get("", response_model=List[UserResponse])
@router.get("/", response_model=List[UserResponse], include_in_schema=False)
def list_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=200),
    role: Optional[UserRole] = None,
    current_user: User = Depends(check_user_role("admin")),
    db: Session = Depends(get_db)
):
    """
    List all users (admin only)
    """
    return get_users(db, skip=skip, limit=limit, role=role)


@router.get("/doctors", response_model=List[UserResponse])
async def list_doctors(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    specialization: Optional[str] = None,
    city: Optional[str] = None,
    min_rating: Optional[float] = Query(None, ge=0, le=5),
    accepting_new_patients: Optional[bool] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    List all doctors with optional filtering by specialization, city, rating, and search
    
    Results are cached for 5 minutes to improve performance
    """
    return get_doctors(
        db, 
        skip=skip, 
        limit=limit, 
        specialization=specialization,
        city=city,
        min_rating=min_rating,
        accepting_new_patients=accepting_new_patients,
        search=search
    )


@router.get("/doctors/{doctor_id}", response_model=UserResponse)
def get_doctor_details(
    doctor_id: int,
    db: Session = Depends(get_db)
):
    """
    Retrieve detailed information about a doctor by ID
    """
    doctor = get_user_by_id(db, doctor_id)

    if not doctor or doctor.role != UserRole.DOCTOR:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Doctor not found"
        )

    return doctor


@router.get("/{user_id}", response_model=UserResponse)
def get_user(
    user_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get user by ID
    
    Users can only view their own profile unless they are admin
    """
    if current_user.id != user_id and current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    user = get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return user


@router.put("/{user_id}", response_model=UserResponse)
def update_user_by_id(
    user_id: int,
    user_update: UserUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Update user by ID
    
    Users can only update their own profile unless they are admin
    """
    if current_user.id != user_id and current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    allow_privileged = current_user.role == UserRole.ADMIN
    return update_user(db, user_id, user_update, allow_privileged_fields=allow_privileged)


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user_by_id(
    user_id: int,
    current_user: User = Depends(check_user_role("admin")),
    db: Session = Depends(get_db)
):
    """
    Delete user by ID (admin only)
    
    This performs a soft delete by setting is_active to False
    """
    delete_user(db, user_id)
    return None


@router.post("/{user_id}/verify", response_model=UserResponse)
def verify_doctor(
    user_id: int,
    current_user: User = Depends(check_user_role("admin")),
    db: Session = Depends(get_db)
):
    """
    Verify a doctor account (admin only)
    
    Sets is_verified to True for the doctor
    """
    user = get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    if user.role != UserRole.DOCTOR:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only doctors can be verified"
        )
    
    user.is_verified = True
    db.commit()
    db.refresh(user)
    
    return user


@router.get("/stats/overview", response_model=dict)
def get_user_stats(
    current_user: User = Depends(check_user_role("admin")),
    db: Session = Depends(get_db)
):
    """
    Get user statistics overview (admin only)
    
    Returns counts of users by role, verification status, etc.
    """
    from sqlalchemy import func
    
    total_users = db.query(func.count(User.id)).scalar()
    total_patients = db.query(func.count(User.id)).filter(User.role == UserRole.PATIENT).scalar()
    total_doctors = db.query(func.count(User.id)).filter(User.role == UserRole.DOCTOR).scalar()
    verified_doctors = db.query(func.count(User.id)).filter(
        User.role == UserRole.DOCTOR, 
        User.is_verified == True
    ).scalar()
    unverified_doctors = db.query(func.count(User.id)).filter(
        User.role == UserRole.DOCTOR, 
        User.is_verified == False
    ).scalar()
    active_users = db.query(func.count(User.id)).filter(User.is_active == True).scalar()
    
    # Doctor count by specialization
    doctors_by_specialization = db.query(
        User.specialization,
        func.count(User.id).label('count')
    ).filter(User.role == UserRole.DOCTOR).group_by(User.specialization).all()
    
    specialization_stats = {spec: count for spec, count in doctors_by_specialization if spec}
    
    return {
        "total_users": total_users,
        "total_patients": total_patients,
        "total_doctors": total_doctors,
        "verified_doctors": verified_doctors,
        "unverified_doctors": unverified_doctors,
        "active_users": active_users,
        "doctors_by_specialization": specialization_stats
    }


@router.post("/me/2fa/enable", response_model=UserResponse)
def enable_two_factor(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Enable two-factor authentication for current user
    """
    if current_user.mfa_enabled:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Two-factor authentication is already enabled"
        )
    
    current_user.mfa_enabled = True
    db.commit()
    db.refresh(current_user)
    
    return current_user


@router.post("/me/2fa/disable", response_model=UserResponse)
def disable_two_factor(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Disable two-factor authentication for current user
    """
    if not current_user.mfa_enabled:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Two-factor authentication is already disabled"
        )
    
    current_user.mfa_enabled = False
    db.commit()
    db.refresh(current_user)
    
    return current_user
