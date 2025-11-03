"""
API Versioning utilities and validation

This module provides utilities for API versioning, including version negotiation
and deprecation handling.

Versioning Strategy:
- Version is specified in URL path: /api/v1/...
- Version can also be specified via X-API-Version header
- Supported versions: v1, v2 (v2 for future expansion)
- Default version: v1
"""
from typing import List, Optional
from fastapi import Header, HTTPException
from enum import Enum

from app.core.logging import get_logger

logger = get_logger(__name__)


class APIVersion(str, Enum):
    """Supported API versions"""
    V1 = "v1"
    V2 = "v2"  # Future version


class VersionInfo:
    """Information about an API version"""
    
    def __init__(
        self,
        version: str,
        status: str,
        deprecated: bool = False,
        sunset_date: Optional[str] = None,
        documentation_url: Optional[str] = None
    ):
        """
        Initialize version info
        
        Args:
            version: Version string (e.g., "v1")
            status: Status of the version (stable, beta, deprecated)
            deprecated: Whether this version is deprecated
            sunset_date: Date when version will be removed (ISO format)
            documentation_url: URL to version documentation
        """
        self.version = version
        self.status = status
        self.deprecated = deprecated
        self.sunset_date = sunset_date
        self.documentation_url = documentation_url
    
    def to_dict(self) -> dict:
        """Convert to dictionary"""
        return {
            "version": self.version,
            "status": self.status,
            "deprecated": self.deprecated,
            "sunset_date": self.sunset_date,
            "documentation_url": self.documentation_url
        }


# Version registry
SUPPORTED_VERSIONS: List[VersionInfo] = [
    VersionInfo(
        version="v1",
        status="stable",
        deprecated=False,
        documentation_url="/docs"
    ),
    VersionInfo(
        version="v2",
        status="beta",
        deprecated=False,
        documentation_url="/docs/v2"
    ),
]


def get_supported_versions() -> List[str]:
    """
    Get list of supported version strings
    
    Returns:
        List of supported version strings
    """
    return [v.version for v in SUPPORTED_VERSIONS]


def get_version_info(version: str) -> Optional[VersionInfo]:
    """
    Get information about a specific version
    
    Args:
        version: Version string
        
    Returns:
        VersionInfo object or None if version not found
    """
    for v in SUPPORTED_VERSIONS:
        if v.version == version:
            return v
    return None


async def validate_api_version(
    api_version: str = Header(default="v1", alias="X-API-Version")
) -> str:
    """
    Validate API version from header
    
    This dependency can be used in route handlers to validate the API version
    specified in the X-API-Version header.
    
    Args:
        api_version: API version from header
        
    Returns:
        Validated API version string
        
    Raises:
        HTTPException: If version is not supported
        
    Example:
        @app.get("/api/endpoint")
        async def endpoint(version: str = Depends(validate_api_version)):
            # Use version if needed
            pass
    """
    supported_versions = get_supported_versions()
    
    if api_version not in supported_versions:
        logger.warning(
            f"Unsupported API version requested: {api_version}",
            extra={"requested_version": api_version}
        )
        
        raise HTTPException(
            status_code=400,
            detail={
                "error": "UNSUPPORTED_API_VERSION",
                "message": f"Unsupported API version: {api_version}",
                "supported_versions": supported_versions
            }
        )
    
    # Check if version is deprecated
    version_info = get_version_info(api_version)
    if version_info and version_info.deprecated:
        logger.warning(
            f"Deprecated API version used: {api_version}",
            extra={
                "version": api_version,
                "sunset_date": version_info.sunset_date
            }
        )
    
    return api_version


def get_api_versions_endpoint() -> dict:
    """
    Get information about all supported API versions
    
    This can be exposed as a public endpoint to inform clients about
    available API versions and their status.
    
    Returns:
        Dictionary with version information
    """
    return {
        "versions": [v.to_dict() for v in SUPPORTED_VERSIONS],
        "default_version": "v1"
    }


class DeprecationPolicy:
    """
    API deprecation policy documentation
    
    This class documents the deprecation policy for the API.
    """
    
    POLICY = {
        "deprecation_notice_period": "6 months",
        "minimum_support_period": "12 months after deprecation",
        "notification_channels": [
            "API response headers (Deprecation, Sunset)",
            "Email notifications to registered developers",
            "Documentation updates",
            "Changelog entries"
        ],
        "migration_support": [
            "Migration guides in documentation",
            "Code examples for common use cases",
            "Support contact for migration questions"
        ]
    }
    
    @staticmethod
    def get_policy() -> dict:
        """Get deprecation policy"""
        return DeprecationPolicy.POLICY


def add_version_headers(response, version: str):
    """
    Add version-related headers to response
    
    Args:
        response: FastAPI response object
        version: API version being used
    """
    version_info = get_version_info(version)
    
    if version_info:
        # Add current version header
        response.headers["X-API-Version"] = version
        
        # Add deprecation headers if version is deprecated
        if version_info.deprecated:
            response.headers["Deprecation"] = "true"
            if version_info.sunset_date:
                response.headers["Sunset"] = version_info.sunset_date
        
        # Add link to documentation
        if version_info.documentation_url:
            response.headers["Link"] = f'<{version_info.documentation_url}>; rel="documentation"'
    
    return response


# Migration guide
MIGRATION_GUIDE = """
# API Migration Guide

## Overview
This guide helps you migrate between different versions of the Santé API.

## Version History

### v1 (Current Stable)
- Initial stable release
- Full feature set for appointments, prescriptions, and medical records
- Status: Stable

### v2 (Beta)
- Enhanced error handling with structured error codes
- Improved rate limiting
- Better pagination support
- Status: Beta (not recommended for production use)

## Breaking Changes

### Migrating from v1 to v2

1. **Error Response Format**
   - v1: `{"detail": "Error message"}`
   - v2: `{"error": {"code": "ERROR_CODE", "message": "Error message"}}`

2. **Pagination**
   - v1: Uses `page` and `limit` query parameters
   - v2: Uses `cursor` and `limit` for better performance

3. **Date Format**
   - v1: ISO 8601 with timezone
   - v2: ISO 8601 with timezone (no change)

## Best Practices

1. Always specify API version in X-API-Version header
2. Monitor deprecation headers in responses
3. Test your integration with new version before switching
4. Update your code within the deprecation period

## Support

For migration assistance, contact: support@sante-app.com
"""


def get_migration_guide() -> str:
    """Get API migration guide"""
    return MIGRATION_GUIDE
