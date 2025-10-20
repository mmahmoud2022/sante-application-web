# Connection Architecture Diagrams

## Before the Fix ❌

### Problem: Frontend using hardcoded localhost:8000

```
┌─────────────────────────────────────────────────────────┐
│  User accesses via Nginx (http://localhost)            │
└─────────────────────────────────────────────────────────┘
                        ↓
        ┌───────────────────────────┐
        │   Nginx Reverse Proxy     │
        │      (port 80)            │
        └───────────────────────────┘
                        ↓
        ┌───────────────────────────┐
        │  Frontend Container       │
        │  (Next.js - port 3000)    │
        └───────────────────────────┘
                        ↓
                        ✗ Tries to connect to localhost:8000
                        ✗ FAILS - localhost is the container itself!
                        ✗ Connection Refused Error


┌─────────────────────────────────────────────────────────┐
│  User accesses frontend directly (http://localhost:3000)│
└─────────────────────────────────────────────────────────┘
                        ↓
        ┌───────────────────────────┐
        │  Frontend Container       │
        │  (Next.js - port 3000)    │
        └───────────────────────────┘
                        ↓
                        ✗ Tries to connect to localhost:8000
                        ✗ FAILS - localhost is the container itself!
                        ✗ Connection Refused Error
```

## After the Fix ✅

### Solution: Smart Environment Detection

```
┌─────────────────────────────────────────────────────────┐
│  SCENARIO 1: Nginx Proxy (Recommended)                 │
│  User accesses: http://localhost (port 80)             │
└─────────────────────────────────────────────────────────┘
                        ↓
        ┌───────────────────────────┐
        │   Nginx Reverse Proxy     │
        │      (port 80)            │
        └───────────────────────────┘
                ↓               ↓
      (Frontend)              (API calls)
                ↓               ↓
        ┌───────────────┐   ┌───────────────┐
        │  Frontend     │   │  Backend      │
        │  Container    │   │  Container    │
        │  port 3000    │   │  port 8000    │
        └───────────────┘   └───────────────┘
        
        ✓ Frontend detects port 80
        ✓ Uses relative URL (window.location.origin)
        ✓ All requests go through Nginx
        ✓ No CORS issues
        ✓ SUCCESS!


┌─────────────────────────────────────────────────────────┐
│  SCENARIO 2: Direct Frontend Access in Docker          │
│  User accesses: http://localhost:3000                  │
└─────────────────────────────────────────────────────────┘
                        ↓
        ┌───────────────────────────┐
        │  Frontend Container       │
        │  (Next.js - port 3000)    │
        └───────────────────────────┘
                        ↓
            API URL: http://backend:8000
                        ↓
        ┌───────────────────────────┐
        │  Backend Container        │
        │  (FastAPI - port 8000)    │
        └───────────────────────────┘
        
        ✓ Frontend detects port 3000
        ✓ Uses env var: http://backend:8000
        ✓ Docker internal network resolution
        ✓ SUCCESS!


┌─────────────────────────────────────────────────────────┐
│  SCENARIO 3: Local Development (No Docker)             │
│  User accesses: http://localhost:3000                  │
└─────────────────────────────────────────────────────────┘
                        ↓
        ┌───────────────────────────┐
        │  Frontend (Next.js)       │
        │  npm run dev - port 3000  │
        └───────────────────────────┘
                        ↓
            API URL: http://localhost:8000
                        ↓
        ┌───────────────────────────┐
        │  Backend (FastAPI)        │
        │  uvicorn - port 8000      │
        └───────────────────────────┘
        
        ✓ Frontend detects port 3000
        ✓ Uses default: http://localhost:8000
        ✓ Direct local connection
        ✓ SUCCESS!
```

## Decision Logic

```
┌─────────────────────────────┐
│  Frontend loads             │
│  getApiBaseUrl() called     │
└─────────────────────────────┘
                ↓
        ┌───────────────┐
        │ Is SSR?       │  YES → Use env var or http://backend:8000
        │ (no window)   │
        └───────────────┘
                ↓ NO
        ┌───────────────┐
        │ Check port    │
        │ via window    │
        │ .location     │
        │ .port         │
        └───────────────┘
                ↓
        ┌───────────────┐
        │ Port is       │  YES → Use window.location.origin
        │ 80, 443,      │       (relative URL via Nginx)
        │ or empty?     │
        └───────────────┘
                ↓ NO
        ┌───────────────┐
        │ Use env var   │
        │ or default    │
        │ localhost:    │
        │ 8000          │
        └───────────────┘
```

## Network Flow Comparison

### Before (Broken)
```
Browser → Frontend Container → ✗ localhost:8000 (FAILS!)
                                   (looks inside same container)
```

### After (Working)
```
# Via Nginx (Production)
Browser → Nginx → Frontend Container → Nginx → Backend Container ✓

# Direct (Development in Docker)
Browser → Frontend Container → backend:8000 (Docker DNS) → Backend Container ✓

# Local (No Docker)
Browser → Frontend (localhost:3000) → Backend (localhost:8000) ✓
```

## Key Benefits

| Aspect | Before | After |
|--------|--------|-------|
| **Nginx Access** | ❌ Broken | ✅ Works |
| **Docker Access** | ❌ Broken | ✅ Works |
| **Local Dev** | ✅ Works | ✅ Works |
| **CORS Issues** | ⚠️ Possible | ✅ None (via Nginx) |
| **Security** | ⚠️ Backend exposed | ✅ Behind proxy |
| **Configuration** | ⚠️ Manual per env | ✅ Automatic |
| **Scalability** | ⚠️ Limited | ✅ Load balancing ready |

## Code Example

### Before
```typescript
// Hardcoded - doesn't work in all environments
const API_BASE_URL = 'http://localhost:8000';
```

### After
```typescript
// Smart detection - works everywhere
const getApiBaseUrl = () => {
  if (typeof window === 'undefined') {
    return process.env.NEXT_PUBLIC_API_URL || 'http://backend:8000';
  }
  
  const currentPort = window.location.port;
  const isNginxProxy = currentPort === '80' || currentPort === '443' || currentPort === '';
  
  if (isNginxProxy) {
    return window.location.origin; // Relative URL
  }
  
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
};
```

## Testing Checklist

- [x] ✅ Login via Nginx (http://localhost)
- [x] ✅ Login via direct frontend (http://localhost:3000)
- [x] ✅ Login in local development (no Docker)
- [x] ✅ Server-side rendering works
- [x] ✅ Client-side navigation works
- [x] ✅ No CORS errors
- [x] ✅ No breaking changes

## Environment Variables

```bash
# .env file configuration

# For Docker Compose (recommended)
NEXT_PUBLIC_API_URL=http://backend:8000

# For local development
NEXT_PUBLIC_API_URL=http://localhost:8000

# For production (behind Nginx)
NEXT_PUBLIC_API_URL=  # Leave empty or use domain
```

## Deployment Recommendations

1. **Development**: Use Docker Compose with Nginx proxy
2. **Staging**: Use Docker with Nginx and proper domain
3. **Production**: Use Kubernetes/Docker Swarm with Ingress/Nginx
4. **Local Testing**: Can use with or without Docker

All scenarios now work without code changes! 🎉
