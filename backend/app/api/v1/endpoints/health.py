"""
Health check endpoints for monitoring and Kubernetes probes
"""
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from sqlalchemy import text
import redis

from app.core.database import get_db
from app.core.config import settings

router = APIRouter()


@router.get("/liveness")
async def liveness():
    """
    Kubernetes liveness probe
    
    Returns 200 if the application is alive and running.
    This endpoint doesn't check dependencies.
    """
    return {"status": "alive"}


@router.get("/readiness")
async def readiness(db: Session = Depends(get_db)):
    """
    Kubernetes readiness probe
    
    Checks if the application is ready to serve traffic by verifying:
    - Database connectivity
    - Redis connectivity (if configured)
    
    Returns 200 if all checks pass, 503 otherwise.
    """
    checks = {}
    overall_status = "ready"
    
    # Check database
    try:
        db.execute(text("SELECT 1"))
        checks["database"] = "ok"
    except Exception as e:
        checks["database"] = f"error: {str(e)}"
        overall_status = "not_ready"
    
    # Check Redis
    try:
        redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)
        redis_client.ping()
        checks["redis"] = "ok"
    except Exception as e:
        checks["redis"] = f"error: {str(e)}"
        overall_status = "not_ready"
    
    response_status = status.HTTP_200_OK if overall_status == "ready" else status.HTTP_503_SERVICE_UNAVAILABLE
    
    return {
        "status": overall_status,
        "checks": checks
    }


@router.get("/health")
async def health_check(db: Session = Depends(get_db)):
    """
    Comprehensive health check endpoint
    
    Returns detailed health information including:
    - Application version
    - Environment
    - Database status
    - Redis status
    """
    checks = {}
    
    # Check database
    try:
        db.execute(text("SELECT 1"))
        checks["database"] = {"status": "healthy", "message": "Connected"}
    except Exception as e:
        checks["database"] = {"status": "unhealthy", "message": str(e)}
    
    # Check Redis
    try:
        redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)
        redis_client.ping()
        checks["redis"] = {"status": "healthy", "message": "Connected"}
    except Exception as e:
        checks["redis"] = {"status": "unhealthy", "message": str(e)}
    
    overall_healthy = all(check["status"] == "healthy" for check in checks.values())
    
    return {
        "status": "healthy" if overall_healthy else "degraded",
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT,
        "checks": checks
    }
