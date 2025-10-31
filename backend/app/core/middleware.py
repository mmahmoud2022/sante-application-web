"""
Middleware for request/response logging and error handling
"""
import time
from typing import Callable
from fastapi import Request, Response
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp

from app.core.logging import get_logger, set_request_id, clear_request_id
from app.core.errors import APIError, ErrorCode

logger = get_logger(__name__)


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """
    Middleware to log all requests and responses with correlation IDs
    """
    
    def __init__(self, app: ASGIApp):
        super().__init__(app)
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """
        Process each request and response
        
        Args:
            request: The incoming request
            call_next: The next middleware/route handler
            
        Returns:
            Response from the route handler
        """
        # Generate and set request ID
        request_id = request.headers.get("X-Request-ID")
        request_id = set_request_id(request_id)
        
        # Add request ID to request state for access in route handlers
        request.state.request_id = request_id
        
        # Log request
        start_time = time.time()
        logger.info(
            f"Request started",
            extra={
                "method": request.method,
                "url": str(request.url),
                "client": request.client.host if request.client else None,
                "user_agent": request.headers.get("user-agent"),
            }
        )
        
        try:
            # Process request
            response = await call_next(request)
            
            # Calculate processing time
            process_time = time.time() - start_time
            
            # Add request ID to response headers
            response.headers["X-Request-ID"] = request_id
            response.headers["X-Process-Time"] = str(process_time)
            
            # Log response
            logger.info(
                f"Request completed",
                extra={
                    "method": request.method,
                    "url": str(request.url),
                    "status_code": response.status_code,
                    "process_time": process_time,
                }
            )
            
            return response
            
        except APIError as e:
            # Handle custom API errors
            process_time = time.time() - start_time
            
            logger.warning(
                f"API error occurred",
                extra={
                    "method": request.method,
                    "url": str(request.url),
                    "error_code": e.code.value,
                    "error_message": e.message,
                    "status_code": e.status_code,
                    "process_time": process_time,
                }
            )
            
            response = JSONResponse(
                status_code=e.status_code,
                content=e.to_dict(),
                headers={"X-Request-ID": request_id}
            )
            return response
            
        except Exception as e:
            # Handle unexpected errors
            process_time = time.time() - start_time
            
            logger.error(
                f"Unexpected error occurred",
                extra={
                    "method": request.method,
                    "url": str(request.url),
                    "error": str(e),
                    "error_type": type(e).__name__,
                    "process_time": process_time,
                },
                exc_info=True
            )
            
            # Return generic error response
            response = JSONResponse(
                status_code=500,
                content={
                    "error": {
                        "code": ErrorCode.INTERNAL_SERVER_ERROR.value,
                        "message": "An unexpected error occurred",
                    }
                },
                headers={"X-Request-ID": request_id}
            )
            return response
            
        finally:
            # Clear request ID from context
            clear_request_id()


class APIVersionMiddleware(BaseHTTPMiddleware):
    """
    Middleware to validate API version headers
    """
    
    SUPPORTED_VERSIONS = ["v1", "v2"]
    DEFAULT_VERSION = "v1"
    
    def __init__(self, app: ASGIApp):
        super().__init__(app)
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """
        Validate API version
        
        Args:
            request: The incoming request
            call_next: The next middleware/route handler
            
        Returns:
            Response from the route handler or error response
        """
        # Get API version from header
        api_version = request.headers.get("X-API-Version", self.DEFAULT_VERSION)
        
        # Validate version
        if api_version not in self.SUPPORTED_VERSIONS:
            logger.warning(
                f"Unsupported API version requested",
                extra={
                    "requested_version": api_version,
                    "supported_versions": self.SUPPORTED_VERSIONS,
                }
            )
            
            return JSONResponse(
                status_code=400,
                content={
                    "error": {
                        "code": "UNSUPPORTED_API_VERSION",
                        "message": f"Unsupported API version: {api_version}",
                        "details": {
                            "supported_versions": self.SUPPORTED_VERSIONS,
                            "requested_version": api_version,
                        }
                    }
                }
            )
        
        # Add version to request state
        request.state.api_version = api_version
        
        # Process request
        response = await call_next(request)
        
        # Add version to response headers
        response.headers["X-API-Version"] = api_version
        
        return response
