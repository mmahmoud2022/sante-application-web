# API Connection Fix Documentation

## Problem Description

The frontend login page was experiencing "connection refused" errors when attempting to authenticate users. This occurred because the frontend was trying to connect to `http://localhost:8000` in all scenarios, which doesn't work in containerized or proxied environments.

## Root Cause

The issue stemmed from a static API URL configuration that didn't account for different deployment scenarios:

1. **Docker Container Environment**: When the frontend runs in a Docker container, `localhost` refers to the container itself, not the host machine where the backend is running
2. **Nginx Proxy Environment**: When users access the application through Nginx (port 80), API requests need to go through the Nginx proxy, not directly to the backend
3. **Development Environment**: When running locally outside Docker, direct connection to `http://localhost:8000` is needed

## Solution Implemented

We implemented an intelligent API URL detection system in `/frontend/src/lib/api.ts` that automatically selects the appropriate backend URL based on the runtime environment:

### How It Works

```typescript
const getApiBaseUrl = () => {
  // Server-side rendering: use the configured URL
  if (typeof window === 'undefined') {
    return process.env.NEXT_PUBLIC_API_URL || 'http://backend:8000';
  }
  
  // Client-side: check if we're accessing via Nginx (port 80 or 443)
  const currentPort = window.location.port;
  const isNginxProxy = currentPort === '80' || currentPort === '443' || currentPort === '';
  
  if (isNginxProxy) {
    // Use relative path to go through Nginx proxy
    return window.location.origin;
  }
  
  // Local development: use configured URL or default to localhost:8000
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
};
```

### Environment-Specific Behavior

#### 1. **Local Development** (Outside Docker)
- **URL Used**: `http://localhost:8000`
- **Configuration**: Set `NEXT_PUBLIC_API_URL=http://localhost:8000` in your `.env` file
- **How to Run**:
  ```bash
  # Terminal 1 - Backend
  cd backend
  uvicorn app.main:app --reload
  
  # Terminal 2 - Frontend
  cd frontend
  npm run dev
  ```
- **Access**: http://localhost:3000

#### 2. **Docker Compose** (Full Stack)
- **URL Used**: `http://backend:8000` (internal Docker network)
- **Configuration**: Docker Compose automatically sets this via environment variables
- **How to Run**:
  ```bash
  make init  # or: docker-compose up -d
  ```
- **Access**: http://localhost:3000 (direct) or http://localhost (via Nginx)

#### 3. **Nginx Proxy** (Production-like)
- **URL Used**: Relative path (goes through Nginx proxy to backend)
- **Configuration**: No special configuration needed - automatically detected
- **How to Run**:
  ```bash
  docker-compose up -d
  ```
- **Access**: http://localhost (port 80 via Nginx)

## Configuration Guide

### .env File Setup

Create a `.env` file in the root directory (copy from `.env.example`):

```bash
cp .env.example .env
```

### For Different Scenarios

#### Local Development
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NODE_ENV=development
```

#### Docker Development
```env
NEXT_PUBLIC_API_URL=http://backend:8000
NODE_ENV=development
```

#### Production (with Nginx)
```env
# Leave empty or use the public domain
NEXT_PUBLIC_API_URL=
NODE_ENV=production
```

## Testing the Fix

### Test Scenario 1: Login via Nginx (Port 80)
1. Start the full stack: `docker-compose up -d`
2. Wait for all services to be ready: `docker-compose ps`
3. Open browser to: http://localhost
4. Navigate to login page
5. Enter credentials and submit
6. ✅ Should successfully authenticate without connection errors

### Test Scenario 2: Login via Direct Frontend (Port 3000)
1. Start the full stack: `docker-compose up -d`
2. Open browser to: http://localhost:3000
3. Navigate to login page
4. Enter credentials and submit
5. ✅ Should successfully authenticate using Docker internal network

### Test Scenario 3: Local Development
1. Start backend: `cd backend && uvicorn app.main:app --reload`
2. Start frontend: `cd frontend && npm run dev`
3. Open browser to: http://localhost:3000
4. Navigate to login page
5. Enter credentials and submit
6. ✅ Should successfully authenticate to localhost:8000

## Troubleshooting

### Issue: Still getting connection refused

**Check 1**: Verify backend is running
```bash
curl http://localhost:8000/health
# Should return: {"status":"healthy"}
```

**Check 2**: Check which port you're accessing
- If using port 80: Check Nginx logs: `docker-compose logs nginx`
- If using port 3000: Check frontend logs: `docker-compose logs frontend`
- Check backend logs: `docker-compose logs backend`

**Check 3**: Verify environment variables
```bash
# Inside frontend container
docker-compose exec frontend env | grep NEXT_PUBLIC_API_URL
```

**Check 4**: Clear browser cache and local storage
```javascript
// In browser console
localStorage.clear();
location.reload();
```

### Issue: CORS errors

If you see CORS errors, verify:
1. Nginx configuration includes CORS headers (already configured)
2. Backend is properly configured for your domain
3. You're accessing via the correct port (80 for Nginx, 3000 for direct)

### Issue: Backend not accessible in Docker

```bash
# Test backend accessibility from frontend container
docker-compose exec frontend wget -O- http://backend:8000/health

# Should return healthy status
```

## Additional Benefits

This fix provides several benefits:

1. **No CORS Issues**: When using Nginx proxy, all requests appear to come from the same origin
2. **Security**: No need to expose backend directly to the internet
3. **Flexibility**: Works in all deployment scenarios without code changes
4. **Scalability**: Easy to add load balancing or additional backend instances
5. **Developer Experience**: Developers can work locally without Docker if preferred

## Related Files Modified

1. `/frontend/src/lib/api.ts` - Smart API URL detection
2. `/docker-compose.yml` - Correct environment variables for Docker
3. `/.env.example` - Better documentation for configuration
4. `/docs/API_CONNECTION_FIX.md` - This documentation

## Migration Guide

If you have an existing installation:

1. **Pull the latest changes**:
   ```bash
   git pull
   ```

2. **Update your .env file**:
   ```bash
   # Compare with .env.example
   diff .env .env.example
   ```

3. **Rebuild containers** (if using Docker):
   ```bash
   docker-compose down
   docker-compose up -d --build
   ```

4. **Clear browser cache** on first login:
   - Hard refresh: Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (Mac)
   - Or clear cache via browser settings

## Future Improvements

Potential enhancements for consideration:

1. Add health check endpoint call on frontend startup
2. Implement automatic retry with exponential backoff for failed API calls
3. Add connection status indicator in UI
4. Implement WebSocket connection for real-time updates
5. Add circuit breaker pattern for API resilience

## Questions?

If you encounter any issues not covered in this documentation, please:
1. Check the troubleshooting section above
2. Review Docker logs: `docker-compose logs`
3. Open an issue in the repository with detailed error messages and steps to reproduce
