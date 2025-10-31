"""
Authentication endpoints
"""
from datetime import timedelta
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.core.database import get_db
from app.core.config import settings
from app.core.security import (
    create_access_token, 
    create_refresh_token, 
    get_current_user,
    get_rate_limiter,
    get_account_lockout
)
from app.core.password_policy import validate_password_strength, get_password_requirements
from app.core.errors import APIError, ErrorCode
from app.core.logging import get_logger
from app.schemas.user import UserCreate, UserResponse, Token
from app.services.user_service import create_user, authenticate_user
from app.services.notification_service import send_password_reset_email
import secrets
import hashlib
from datetime import datetime, timedelta

logger = get_logger(__name__)

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)


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
@limiter.limit("10/hour")
async def register(
    request: Request,
    user: UserCreate,
    db: Session = Depends(get_db)
):
    """
    Register a new user
    
    - **email**: User email (must be unique)
    - **password**: User password (min 12 characters with complexity requirements)
    - **first_name**: User first name
    - **last_name**: User last name
    - **role**: User role (patient, doctor, admin)
    - **admin_secret**: Required only for admin registration
    
    Password Requirements:
    - At least 12 characters long
    - At least one uppercase letter
    - At least one lowercase letter
    - At least one digit
    - At least one special character
    """
    # Rate limiting for registration
    rate_limiter = get_rate_limiter()
    client_ip = request.client.host if request.client else "unknown"
    await rate_limiter.check_rate_limit(
        key=f"register:{client_ip}",
        max_requests=5,
        window=3600  # 5 registrations per hour per IP
    )
    
    # Validate password strength
    is_valid, error_message = validate_password_strength(user.password)
    if not is_valid:
        raise APIError(
            code=ErrorCode.WEAK_PASSWORD,
            message=error_message,
            status_code=422,
            details={"requirements": get_password_requirements()}
        )
    
    # If registering as admin, validate admin secret
    if user.role == "admin":
        admin_secret = getattr(user, 'admin_secret', None)
        if not admin_secret or admin_secret != settings.ADMIN_SECRET:
            raise APIError(
                code=ErrorCode.INVALID_ADMIN_SECRET,
                message="Invalid admin secret",
                status_code=403
            )
    
    logger.info(f"New user registration attempt: {user.email}")
    created_user = create_user(db, user)
    logger.info(f"User registered successfully: {user.email}")
    
    return created_user


@router.post("/login", response_model=Token)
@limiter.limit("5/minute")
async def login(
    request: Request,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """
    Login and get access token
    
    - **username**: User email
    - **password**: User password
    
    Rate Limiting:
    - 10 login attempts per 15 minutes per IP
    
    Account Lockout:
    - Account locked for 15 minutes after 5 failed attempts
    """
    email = form_data.username
    
    # Rate limiting for login attempts
    rate_limiter = get_rate_limiter()
    client_ip = request.client.host if request and request.client else "unknown"
    await rate_limiter.check_rate_limit(
        key=f"login:{client_ip}",
        max_requests=10,
        window=900  # 10 attempts per 15 minutes
    )
    
    # Check account lockout
    account_lockout = get_account_lockout()
    if account_lockout.is_locked_out(email):
        lockout_time = account_lockout.get_lockout_time_remaining(email)
        logger.warning(f"Login attempt on locked account: {email}")
        raise APIError(
            code=ErrorCode.ACCOUNT_LOCKED,
            message="Account temporarily locked due to multiple failed login attempts",
            status_code=429,
            details={
                "lockout_remaining_seconds": lockout_time,
                "lockout_remaining_minutes": lockout_time // 60
            }
        )
    
    # Authenticate user
    user = authenticate_user(db, email, form_data.password)
    
    if not user:
        # Record failed attempt
        failed_attempts = account_lockout.record_failed_attempt(email)
        remaining_attempts = account_lockout.get_remaining_attempts(email)
        
        logger.warning(
            f"Failed login attempt for {email}",
            extra={
                "email": email,
                "failed_attempts": failed_attempts,
                "remaining_attempts": remaining_attempts
            }
        )
        
        error_details = {}
        if remaining_attempts <= 2 and remaining_attempts > 0:
            error_details["remaining_attempts"] = remaining_attempts
            error_details["warning"] = f"Account will be locked after {remaining_attempts} more failed attempts"
        
        raise APIError(
            code=ErrorCode.INVALID_CREDENTIALS,
            message="Incorrect email or password",
            status_code=401,
            details=error_details
        )
    
    # Check if user is active
    if not user.is_active:
        logger.warning(f"Login attempt on inactive account: {email}")
        raise APIError(
            code=ErrorCode.ACCOUNT_INACTIVE,
            message="Account is inactive. Please contact support.",
            status_code=403
        )
    
    # Reset failed login attempts on successful login
    account_lockout.reset_attempts(email)
    
    # Create access token
    access_token = create_access_token(
        data={"sub": str(user.id)}
    )
    
    # Create refresh token
    refresh_token = create_refresh_token(
        data={"sub": str(user.id)}
    )
    
    logger.info(
        f"Successful login: {email}",
        extra={"user_id": user.id, "role": user.role}
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


@router.get("/password-requirements")
async def get_password_requirements_endpoint():
    """
    Get password requirements for registration
    
    Returns the password policy requirements that users must meet
    when creating a new password.
    """
    return {
        "requirements": get_password_requirements(),
        "policy": {
            "min_length": 12,
            "require_uppercase": True,
            "require_lowercase": True,
            "require_digit": True,
            "require_special_char": True,
            "special_chars": "!@#$%^&*(),.?\":{}|<>"
        }
    }

