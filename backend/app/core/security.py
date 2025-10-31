"""
Security utilities for authentication and authorization
"""
from datetime import datetime, timedelta
from typing import Optional, Union
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
import redis
import time

from app.core.config import settings
from app.core.database import get_db
from app.core.errors import APIError, ErrorCode

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# OAuth2 scheme for token authentication
oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/login")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash"""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Hash a password"""
    return pwd_context.hash(password)


def create_access_token(
    data: dict,
    expires_delta: Optional[timedelta] = None
) -> str:
    """
    Create a JWT access token
    
    Args:
        data: Data to encode in the token
        expires_delta: Optional expiration time delta
        
    Returns:
        Encoded JWT token
    """
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(
        to_encode,
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM
    )
    return encoded_jwt


def create_refresh_token(data: dict) -> str:
    """
    Create a JWT refresh token
    
    Args:
        data: Data to encode in the token
        
    Returns:
        Encoded JWT refresh token
    """
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire})
    
    encoded_jwt = jwt.encode(
        to_encode,
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM
    )
    return encoded_jwt


def decode_token(token: str) -> dict:
    """
    Decode and verify a JWT token
    
    Args:
        token: JWT token to decode
        
    Returns:
        Decoded token payload
        
    Raises:
        HTTPException: If token is invalid or expired
    """
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    """
    Get current authenticated user from token
    
    Args:
        token: JWT access token
        db: Database session
        
    Returns:
        Current user object
        
    Raises:
        HTTPException: If token is invalid or user not found
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = decode_token(token)
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    # Import here to avoid circular imports
    from app.services.user_service import get_user_by_id
    
    user = get_user_by_id(db, int(user_id))
    if user is None:
        raise credentials_exception
    
    return user


async def get_current_active_user(
    current_user = Depends(get_current_user)
):
    """
    Get current active user
    
    Args:
        current_user: Current authenticated user
        
    Returns:
        Current active user
        
    Raises:
        HTTPException: If user is inactive
    """
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
    return current_user


def check_user_role(required_role: str):
    """
    Dependency to check if user has required role
    
    Args:
        required_role: Required user role
        
    Returns:
        Dependency function
    """
    async def role_checker(current_user = Depends(get_current_active_user)):
        if current_user.role != required_role and current_user.role != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not enough permissions"
            )
        return current_user
    return role_checker


class RateLimiter:
    """
    Rate limiter using Redis for distributed rate limiting
    """
    
    def __init__(self, redis_client: Optional[redis.Redis] = None):
        """
        Initialize rate limiter
        
        Args:
            redis_client: Redis client instance (optional)
        """
        self.redis_client = redis_client
        self._is_configured = redis_client is not None
    
    async def check_rate_limit(
        self,
        key: str,
        max_requests: int,
        window: int
    ) -> bool:
        """
        Check if rate limit is exceeded
        
        Args:
            key: Unique key for the rate limit (e.g., user_id, ip_address)
            max_requests: Maximum number of requests allowed
            window: Time window in seconds
            
        Returns:
            True if within rate limit, raises HTTPException if exceeded
            
        Raises:
            HTTPException: If rate limit is exceeded
        """
        if not self._is_configured:
            # If Redis is not configured, allow all requests (development mode)
            return True
        
        try:
            # Get current request count
            current = self.redis_client.get(key)
            
            if current and int(current) >= max_requests:
                raise APIError(
                    code=ErrorCode.RATE_LIMIT_EXCEEDED,
                    message="Rate limit exceeded. Please try again later.",
                    status_code=429,
                    details={
                        "max_requests": max_requests,
                        "window_seconds": window
                    }
                )
            
            # Increment counter
            pipe = self.redis_client.pipeline()
            pipe.incr(key)
            pipe.expire(key, window)
            pipe.execute()
            
            return True
            
        except APIError:
            raise
        except Exception as e:
            # Log error but don't block request if Redis fails
            from app.core.logging import get_logger
            logger = get_logger(__name__)
            logger.warning(f"Rate limiter error: {str(e)}", extra={"error": str(e)})
            return True
    
    def get_remaining_requests(self, key: str, max_requests: int) -> int:
        """
        Get remaining requests in the current window
        
        Args:
            key: Rate limit key
            max_requests: Maximum requests allowed
            
        Returns:
            Number of remaining requests
        """
        if not self._is_configured:
            return max_requests
        
        try:
            current = self.redis_client.get(key)
            if current:
                return max(0, max_requests - int(current))
            return max_requests
        except Exception:
            return max_requests


class AccountLockout:
    """
    Account lockout mechanism for failed login attempts
    """
    
    MAX_ATTEMPTS = 5
    LOCKOUT_DURATION = 900  # 15 minutes in seconds
    
    def __init__(self, redis_client: Optional[redis.Redis] = None):
        """
        Initialize account lockout
        
        Args:
            redis_client: Redis client instance (optional)
        """
        self.redis_client = redis_client
        self._is_configured = redis_client is not None
    
    def _get_key(self, identifier: str) -> str:
        """Get Redis key for lockout tracking"""
        return f"lockout:{identifier}"
    
    def record_failed_attempt(self, identifier: str) -> int:
        """
        Record a failed login attempt
        
        Args:
            identifier: User identifier (email or user_id)
            
        Returns:
            Current number of failed attempts
        """
        if not self._is_configured:
            return 0
        
        try:
            key = self._get_key(identifier)
            
            # Increment failed attempts
            pipe = self.redis_client.pipeline()
            pipe.incr(key)
            pipe.expire(key, self.LOCKOUT_DURATION)
            result = pipe.execute()
            
            return result[0]
            
        except Exception as e:
            from app.core.logging import get_logger
            logger = get_logger(__name__)
            logger.warning(f"Failed to record login attempt: {str(e)}", extra={"error": str(e)})
            return 0
    
    def is_locked_out(self, identifier: str) -> bool:
        """
        Check if account is locked out
        
        Args:
            identifier: User identifier (email or user_id)
            
        Returns:
            True if account is locked out
        """
        if not self._is_configured:
            return False
        
        try:
            key = self._get_key(identifier)
            attempts = self.redis_client.get(key)
            
            if attempts and int(attempts) >= self.MAX_ATTEMPTS:
                return True
            
            return False
            
        except Exception as e:
            from app.core.logging import get_logger
            logger = get_logger(__name__)
            logger.warning(f"Failed to check lockout status: {str(e)}", extra={"error": str(e)})
            return False
    
    def get_remaining_attempts(self, identifier: str) -> int:
        """
        Get remaining login attempts before lockout
        
        Args:
            identifier: User identifier
            
        Returns:
            Number of remaining attempts
        """
        if not self._is_configured:
            return self.MAX_ATTEMPTS
        
        try:
            key = self._get_key(identifier)
            attempts = self.redis_client.get(key)
            
            if attempts:
                return max(0, self.MAX_ATTEMPTS - int(attempts))
            
            return self.MAX_ATTEMPTS
            
        except Exception:
            return self.MAX_ATTEMPTS
    
    def get_lockout_time_remaining(self, identifier: str) -> int:
        """
        Get remaining lockout time in seconds
        
        Args:
            identifier: User identifier
            
        Returns:
            Remaining lockout time in seconds
        """
        if not self._is_configured:
            return 0
        
        try:
            key = self._get_key(identifier)
            ttl = self.redis_client.ttl(key)
            
            return max(0, ttl) if ttl > 0 else 0
            
        except Exception:
            return 0
    
    def reset_attempts(self, identifier: str):
        """
        Reset failed login attempts (after successful login)
        
        Args:
            identifier: User identifier
        """
        if not self._is_configured:
            return
        
        try:
            key = self._get_key(identifier)
            self.redis_client.delete(key)
        except Exception as e:
            from app.core.logging import get_logger
            logger = get_logger(__name__)
            logger.warning(f"Failed to reset login attempts: {str(e)}", extra={"error": str(e), "identifier": identifier})


# Global rate limiter instance
_rate_limiter: Optional[RateLimiter] = None
_account_lockout: Optional[AccountLockout] = None


def get_rate_limiter() -> RateLimiter:
    """
    Get global rate limiter instance
    
    Returns:
        RateLimiter instance
    """
    global _rate_limiter
    
    if _rate_limiter is None:
        # Try to connect to Redis
        try:
            redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)
            redis_client.ping()
            _rate_limiter = RateLimiter(redis_client)
        except Exception as e:
            from app.core.logging import get_logger
            logger = get_logger(__name__)
            logger.warning(f"Redis not available: {str(e)}. Rate limiting disabled.", extra={"error": str(e)})
            _rate_limiter = RateLimiter(None)
    
    return _rate_limiter


def get_account_lockout() -> AccountLockout:
    """
    Get global account lockout instance
    
    Returns:
        AccountLockout instance
    """
    global _account_lockout
    
    if _account_lockout is None:
        # Try to connect to Redis
        try:
            redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)
            redis_client.ping()
            _account_lockout = AccountLockout(redis_client)
        except Exception as e:
            from app.core.logging import get_logger
            logger = get_logger(__name__)
            logger.warning(f"Redis not available: {str(e)}. Account lockout disabled.", extra={"error": str(e)})
            _account_lockout = AccountLockout(None)
    
    return _account_lockout
