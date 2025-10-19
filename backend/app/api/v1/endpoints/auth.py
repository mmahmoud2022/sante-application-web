"""
Authentication endpoints
"""
from datetime import timedelta
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr

from app.core.database import get_db
from app.core.config import settings
from app.core.security import create_access_token, create_refresh_token, get_current_user
from app.schemas.user import UserCreate, UserResponse, Token
from app.services.user_service import create_user, authenticate_user
from app.services.notification_service import send_password_reset_email
import secrets
import hashlib
from datetime import datetime, timedelta

router = APIRouter()


# Password reset schemas
class PasswordResetRequest(BaseModel):
    email: EmailStr


class PasswordResetTokenValidation(BaseModel):
    token: str


class PasswordReset(BaseModel):
    token: str
    new_password: str


class EmailVerification(BaseModel):
    token: str


# In-memory storage for password reset tokens (in production, use Redis or database)
password_reset_tokens = {}
email_verification_tokens = {}



@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(
    user: UserCreate,
    db: Session = Depends(get_db)
):
    """
    Register a new user
    
    - **email**: User email (must be unique)
    - **password**: User password (min 8 characters)
    - **first_name**: User first name
    - **last_name**: User last name
    - **role**: User role (patient, doctor, admin)
    """
    return create_user(db, user)


@router.post("/login", response_model=Token)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """
    Login and get access token
    
    - **username**: User email
    - **password**: User password
    """
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
    
    # Create access token
    access_token = create_access_token(
        data={"sub": str(user.id)}
    )
    
    # Create refresh token
    refresh_token = create_refresh_token(
        data={"sub": str(user.id)}
    )
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }


@router.post("/request-password-reset", status_code=status.HTTP_200_OK)
async def request_password_reset(
    request: PasswordResetRequest,
    db: Session = Depends(get_db)
) -> dict[str, str]:
    """
    Request a password reset email
    
    - **email**: User email
    
    Returns success even if email doesn't exist (security best practice)
    """
    from app.models.user import User
    
    # Check if user exists
    user = db.query(User).filter(User.email == request.email).first()
    
    if user:
        # Generate secure token
        token = secrets.token_urlsafe(32)
        
        # Store token with expiry (15 minutes)
        expiry = datetime.utcnow() + timedelta(minutes=15)
        password_reset_tokens[token] = {
            "user_id": user.id,
            "email": user.email,
            "expiry": expiry
        }
        
        # Send reset email
        reset_url = f"{settings.FRONTEND_URL}/reset-password?token={token}"
        await send_password_reset_email(user.email, user.first_name, reset_url)
    
    # Always return success (don't reveal if email exists)
    return {"message": "If the email exists, a password reset link has been sent"}


@router.post("/validate-reset-token", status_code=status.HTTP_200_OK)
def validate_reset_token(
    request: PasswordResetTokenValidation
) -> dict[str, str]:
    """
    Validate a password reset token
    
    - **token**: Reset token from email
    """
    token_data = password_reset_tokens.get(request.token)
    
    if not token_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired token"
        )
    
    if datetime.utcnow() > token_data["expiry"]:
        # Token expired, remove it
        del password_reset_tokens[request.token]
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Token has expired"
        )
    
    return {"message": "Token is valid"}


@router.post("/reset-password", status_code=status.HTTP_200_OK)
def reset_password(
    request: PasswordReset,
    db: Session = Depends(get_db)
) -> dict[str, str]:
    """
    Reset password using token
    
    - **token**: Reset token from email
    - **new_password**: New password (min 8 characters)
    """
    from app.models.user import User
    from app.core.security import get_password_hash
    
    token_data = password_reset_tokens.get(request.token)
    
    if not token_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired token"
        )
    
    if datetime.utcnow() > token_data["expiry"]:
        # Token expired, remove it
        del password_reset_tokens[request.token]
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Token has expired"
        )
    
    # Validate password length
    if len(request.new_password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 8 characters long"
        )
    
    # Get user and update password
    user = db.query(User).filter(User.id == token_data["user_id"]).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Update password
    user.hashed_password = get_password_hash(request.new_password)
    db.commit()
    
    # Remove used token
    del password_reset_tokens[request.token]
    
    return {"message": "Password has been reset successfully"}


@router.post("/verify-email", status_code=status.HTTP_200_OK)
def verify_email(
    request: EmailVerification,
    db: Session = Depends(get_db)
) -> dict[str, str]:
    """
    Verify user email using token
    
    - **token**: Email verification token from email
    """
    from app.models.user import User
    
    token_data = email_verification_tokens.get(request.token)
    
    if not token_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification token"
        )
    
    if datetime.utcnow() > token_data["expiry"]:
        # Token expired, remove it
        del email_verification_tokens[request.token]
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Verification token has expired"
        )
    
    # Get user and verify email
    user = db.query(User).filter(User.id == token_data["user_id"]).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Mark user as verified
    user.is_verified = True
    db.commit()
    
    # Remove used token
    del email_verification_tokens[request.token]
    
    return {"message": "Email verified successfully"}


@router.post("/resend-verification", status_code=status.HTTP_200_OK)
async def resend_verification_email(
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> dict[str, str]:
    """
    Resend verification email to current user
    
    Requires authentication
    """
    if current_user.is_verified:
        return {"message": "Email already verified"}
    
    # Generate new token
    token = secrets.token_urlsafe(32)
    
    # Store token with expiry (24 hours for email verification)
    expiry = datetime.utcnow() + timedelta(hours=24)
    email_verification_tokens[token] = {
        "user_id": current_user.id,
        "email": current_user.email,
        "expiry": expiry
    }
    
    # Send verification email
    verification_url = f"{settings.FRONTEND_URL}/verify-email?token={token}"
    await send_verification_email(
        current_user.email,
        current_user.first_name,
        verification_url
    )
    
    return {"message": "Verification email sent"}


async def send_verification_email(email: str, first_name: str, verification_url: str):
    """
    Send email verification email
    
    Args:
        email: User email address
        first_name: User first name
        verification_url: URL for email verification
    """
    # TODO: Integrate with email service
    print(f"Email verification for {first_name} ({email})")
    print(f"Verification URL: {verification_url}")
    
    # In production:
    # subject = "Vérifiez votre adresse email - Santé"
    # body = f"""
    # Bonjour {first_name},
    # 
    # Merci de vous être inscrit sur Santé!
    # 
    # Veuillez cliquer sur le lien ci-dessous pour vérifier votre adresse email:
    # {verification_url}
    # 
    # Ce lien est valable pendant 24 heures.
    # 
    # Si vous n'avez pas créé de compte, ignorez cet email.
    # 
    # Cordialement,
    # L'équipe Santé
    # """
    # await email_service.send(email, subject, body)
    pass

