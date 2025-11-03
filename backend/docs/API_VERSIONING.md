# API Versioning Guide

## Overview

The Santé API uses versioning to ensure backward compatibility and smooth transitions when making breaking changes. This document explains the versioning strategy, how to use different versions, and the migration process.

## Versioning Strategy

### URL-Based Versioning

API versions are specified in the URL path:

```
https://api.sante-app.com/api/v1/appointments
https://api.sante-app.com/api/v2/appointments
```

### Header-Based Versioning

Clients can also specify the version via the `X-API-Version` header:

```http
GET /api/v1/appointments HTTP/1.1
Host: api.sante-app.com
X-API-Version: v1
```

If both URL and header are present, the URL takes precedence.

## Supported Versions

### Version 1 (v1) - Stable

**Status**: Stable
**Release Date**: January 2025
**Sunset Date**: Not scheduled

Features:
- Full appointment booking system
- User management (patients, doctors, admins)
- Medical records and prescriptions
- Notifications and messaging
- Document management
- Reviews and ratings

Base URL: `/api/v1/`

### Version 2 (v2) - Beta

**Status**: Beta
**Release Date**: February 2025 (planned)
**Production Ready**: March 2025 (planned)

New Features:
- Enhanced error handling with structured codes
- Improved pagination with cursor-based approach
- Better rate limiting
- WebSocket support for real-time updates
- GraphQL endpoint

Base URL: `/api/v2/`

## Using Different Versions

### Default Version

If no version is specified, the API defaults to v1:

```bash
# Uses v1 by default
curl https://api.sante-app.com/api/v1/appointments
```

### Specifying Version in URL

```bash
# Version 1
curl https://api.sante-app.com/api/v1/appointments

# Version 2
curl https://api.sante-app.com/api/v2/appointments
```

### Specifying Version in Header

```bash
curl -H "X-API-Version: v1" \
  https://api.sante-app.com/api/v1/appointments
```

### Checking Version Support

Get information about all supported versions:

```bash
curl https://api.sante-app.com/api/versions
```

Response:
```json
{
  "versions": [
    {
      "version": "v1",
      "status": "stable",
      "deprecated": false,
      "sunset_date": null,
      "documentation_url": "/docs"
    },
    {
      "version": "v2",
      "status": "beta",
      "deprecated": false,
      "sunset_date": null,
      "documentation_url": "/docs/v2"
    }
  ],
  "default_version": "v1"
}
```

## Version Headers

### Response Headers

All API responses include version information:

```http
HTTP/1.1 200 OK
X-API-Version: v1
X-Request-ID: 550e8400-e29b-41d4-a716-446655440000
X-Process-Time: 0.123
```

### Deprecation Headers

When using a deprecated version:

```http
HTTP/1.1 200 OK
X-API-Version: v1
Deprecation: true
Sunset: 2026-01-01T00:00:00Z
Link: </docs/migration>; rel="migration-guide"
```

## Breaking vs Non-Breaking Changes

### Non-Breaking Changes (No Version Change)

These changes don't require a new version:
- Adding new endpoints
- Adding optional request parameters
- Adding new fields to responses
- Adding new error codes
- Improving performance
- Bug fixes

### Breaking Changes (Require New Version)

These changes require a new API version:
- Removing endpoints
- Removing request parameters
- Removing response fields
- Changing field types
- Changing error response format
- Changing authentication mechanism
- Changing rate limits (lower)

## Migration Between Versions

### Migration Process

1. **Test New Version**
   - Review documentation
   - Test in staging environment
   - Update client code

2. **Gradual Rollout**
   - Deploy to a subset of users
   - Monitor for issues
   - Roll back if needed

3. **Full Migration**
   - Update all clients
   - Monitor error rates
   - Address any issues

4. **Cleanup**
   - Remove old version dependencies
   - Update documentation

### Migration Timeline

Typical deprecation timeline:

1. **T+0**: New version released (beta)
2. **T+1 month**: New version marked stable
3. **T+6 months**: Old version marked deprecated
4. **T+12 months**: Old version sunset (removed)

## Version-Specific Changes

### v1 to v2 Migration

#### Error Response Format

**v1**:
```json
{
  "detail": "User not found"
}
```

**v2**:
```json
{
  "error": {
    "code": "USER_2001",
    "message": "User not found",
    "details": {
      "user_id": 123
    }
  }
}
```

#### Pagination

**v1**: Offset-based pagination
```
GET /api/v1/appointments?page=1&limit=20
```

**v2**: Cursor-based pagination
```
GET /api/v2/appointments?cursor=abc123&limit=20
```

Response:
```json
{
  "data": [...],
  "pagination": {
    "next_cursor": "def456",
    "has_more": true
  }
}
```

#### Date Format

**v1 & v2**: ISO 8601 with timezone (no change)
```json
{
  "appointment_date": "2025-02-01T14:00:00+00:00"
}
```

## Best Practices

### For API Consumers

1. **Always Specify Version**
   ```javascript
   // Good
   fetch('/api/v1/appointments', {
     headers: { 'X-API-Version': 'v1' }
   })
   
   // Bad (relies on default)
   fetch('/api/appointments')
   ```

2. **Monitor Deprecation Headers**
   ```javascript
   if (response.headers.get('Deprecation') === 'true') {
     console.warn('Using deprecated API version');
     const sunsetDate = response.headers.get('Sunset');
     scheduleVersionUpgrade(sunsetDate);
   }
   ```

3. **Test Against New Versions Early**
   ```bash
   # Test v2 endpoints in staging
   npm run test:api -- --version=v2
   ```

4. **Version Your Client Code**
   ```javascript
   // services/api/v1/appointments.js
   export const getAppointments = () => { ... }
   
   // services/api/v2/appointments.js
   export const getAppointments = () => { ... }
   ```

### For API Developers

1. **Document All Changes**
   - Maintain CHANGELOG.md
   - Update API documentation
   - Provide migration guides

2. **Support Multiple Versions**
   ```python
   # routes/v1/appointments.py
   @router.get("/appointments")
   async def get_appointments_v1():
       return v1_format(appointments)
   
   # routes/v2/appointments.py
   @router.get("/appointments")
   async def get_appointments_v2():
       return v2_format(appointments)
   ```

3. **Test Version Compatibility**
   ```python
   def test_v1_appointment_response():
       response = client.get("/api/v1/appointments")
       assert "appointment_id" in response.json()[0]
   
   def test_v2_appointment_response():
       response = client.get("/api/v2/appointments")
       assert "id" in response.json()["data"][0]
   ```

4. **Communicate Changes**
   - Email notifications to developers
   - Blog posts for major changes
   - In-app notifications
   - Deprecation warnings in responses

## Deprecation Policy

### Timeline

- **6 months notice**: Minimum notice before deprecation
- **12 months support**: Minimum support after deprecation
- **18 months total**: Total time from announcement to sunset

### Communication Channels

1. **API Response Headers**
   - `Deprecation: true`
   - `Sunset: <date>`

2. **Email Notifications**
   - Initial announcement
   - 6-month reminder
   - 3-month reminder
   - 1-month final warning

3. **Documentation**
   - Changelog
   - Migration guide
   - API documentation

4. **Developer Portal**
   - Dashboard notifications
   - Version usage statistics

### Example Deprecation

```http
# v1 endpoint (deprecated)
GET /api/v1/appointments HTTP/1.1

HTTP/1.1 200 OK
X-API-Version: v1
Deprecation: true
Sunset: Wed, 01 Jan 2026 00:00:00 GMT
Link: </docs/migration/v1-to-v2>; rel="deprecation"
Warning: 199 - "API v1 will be sunset on 2026-01-01. Please migrate to v2."
```

## Version Negotiation

### Content Negotiation

Clients can request specific content types:

```http
GET /api/v1/appointments HTTP/1.1
Accept: application/vnd.sante.v1+json
```

### Unsupported Version Handling

When an unsupported version is requested:

```http
GET /api/v99/appointments HTTP/1.1

HTTP/1.1 400 Bad Request
Content-Type: application/json

{
  "error": {
    "code": "UNSUPPORTED_API_VERSION",
    "message": "Unsupported API version: v99",
    "supported_versions": ["v1", "v2"]
  }
}
```

## Testing

### Version Testing

```python
import pytest
from app.api.versioning import validate_api_version

@pytest.mark.asyncio
async def test_valid_version():
    version = await validate_api_version(api_version="v1")
    assert version == "v1"

@pytest.mark.asyncio
async def test_invalid_version():
    with pytest.raises(HTTPException) as exc:
        await validate_api_version(api_version="v99")
    assert exc.value.status_code == 400
```

### Integration Testing

```python
def test_v1_endpoint():
    response = client.get(
        "/api/v1/appointments",
        headers={"X-API-Version": "v1"}
    )
    assert response.status_code == 200
    assert response.headers["X-API-Version"] == "v1"

def test_v2_endpoint():
    response = client.get(
        "/api/v2/appointments",
        headers={"X-API-Version": "v2"}
    )
    assert response.status_code == 200
    assert response.headers["X-API-Version"] == "v2"
```

## Monitoring

### Metrics to Track

1. **Version Usage**
   - Requests per version
   - Active clients per version
   - Version distribution

2. **Migration Progress**
   - Clients still on deprecated version
   - Migration rate over time
   - Blockers for migration

3. **Performance**
   - Response time per version
   - Error rate per version
   - Resource usage per version

### Dashboards

Create dashboards showing:
- Version adoption over time
- Deprecated version usage
- Migration progress
- Version-specific error rates

## Support

### Getting Help

- **Documentation**: https://docs.sante-app.com
- **Migration Guides**: https://docs.sante-app.com/migrations
- **Support Email**: support@sante-app.com
- **Developer Forum**: https://forum.sante-app.com

### Reporting Issues

When reporting version-related issues:
1. Specify API version used
2. Include request ID from response
3. Provide example request/response
4. Describe expected behavior

## Resources

- [API Documentation](/docs)
- [Migration Guide](./MIGRATION_GUIDE.md)
- [Changelog](/CHANGELOG.md)
- [Deprecation Policy](#deprecation-policy)
