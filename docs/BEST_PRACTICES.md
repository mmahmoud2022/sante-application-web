# Development Best Practices

## Code Organization

### Backend Structure
```
app/
├── api/            # API endpoints grouped by version
├── core/           # Core configuration and utilities
├── models/         # Database models
├── schemas/        # Pydantic schemas for validation
├── services/       # Business logic (keep endpoints thin)
└── utils/          # Helper functions
```

**Principles:**
- Keep endpoints thin, move logic to services
- One model per file
- Group related schemas together
- Reusable utilities in utils/

### Frontend Structure
```
src/
├── app/            # Next.js app directory (pages, layouts)
├── components/     # Reusable React components
├── hooks/          # Custom React hooks
├── lib/            # Utility functions and configurations
├── store/          # Global state management
└── styles/         # Global styles
```

**Component Organization:**
```
components/
├── ui/             # Basic UI components (Button, Input, etc.)
├── features/       # Feature-specific components
├── layouts/        # Layout components
└── common/         # Shared components
```

## Python Best Practices

### Type Hints
Always use type hints for better code clarity and IDE support:

```python
from typing import Optional, List
from sqlalchemy.orm import Session
from app.models.user import User

def get_users(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    active_only: bool = True
) -> List[User]:
    """Get list of users with pagination"""
    query = db.query(User)
    if active_only:
        query = query.filter(User.is_active == True)
    return query.offset(skip).limit(limit).all()
```

### Error Handling
Use FastAPI's HTTPException for API errors:

```python
from fastapi import HTTPException, status

def get_user_or_404(db: Session, user_id: int) -> User:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with id {user_id} not found"
        )
    return user
```

### Async When Possible
Use async for I/O-bound operations:

```python
from fastapi import FastAPI
import httpx

@app.get("/external-data")
async def get_external_data():
    async with httpx.AsyncClient() as client:
        response = await client.get("https://api.example.com/data")
        return response.json()
```

### Database Queries
Use efficient queries with proper indexing:

```python
# ❌ Bad: N+1 query problem
users = db.query(User).all()
for user in users:
    print(user.appointments)  # Separate query for each user

# ✅ Good: Eager loading
from sqlalchemy.orm import joinedload

users = db.query(User).options(joinedload(User.appointments)).all()
for user in users:
    print(user.appointments)  # Already loaded
```

### Pydantic Models
Use Pydantic for validation and serialization:

```python
from pydantic import BaseModel, EmailStr, Field

class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8)
    first_name: str = Field(..., min_length=1, max_length=100)
    
    class Config:
        # Provide example for API docs
        schema_extra = {
            "example": {
                "email": "user@example.com",
                "password": "securepass123",
                "first_name": "John"
            }
        }
```

## TypeScript Best Practices

### Type Everything
```typescript
// ❌ Bad
function getUser(id) {
    return fetch(`/api/users/${id}`).then(res => res.json())
}

// ✅ Good
interface User {
    id: number
    email: string
    firstName: string
    lastName: string
}

async function getUser(id: number): Promise<User> {
    const response = await fetch(`/api/users/${id}`)
    return response.json()
}
```

### Use React Hooks Properly
```typescript
// ❌ Bad: Missing dependency
useEffect(() => {
    fetchUser(userId)
}, [])

// ✅ Good: Proper dependencies
useEffect(() => {
    fetchUser(userId)
}, [userId, fetchUser])

// ✅ Better: With cleanup
useEffect(() => {
    let cancelled = false
    
    async function fetch() {
        const user = await fetchUser(userId)
        if (!cancelled) {
            setUser(user)
        }
    }
    
    fetch()
    
    return () => {
        cancelled = true
    }
}, [userId])
```

### Component Structure
```typescript
// ✅ Good component structure
interface UserCardProps {
    user: User
    onEdit?: (user: User) => void
    className?: string
}

export function UserCard({ user, onEdit, className }: UserCardProps) {
    const [isEditing, setIsEditing] = useState(false)
    
    const handleEdit = useCallback(() => {
        setIsEditing(true)
        onEdit?.(user)
    }, [user, onEdit])
    
    return (
        <div className={clsx('user-card', className)}>
            {/* Component content */}
        </div>
    )
}
```

### Custom Hooks
```typescript
// Reusable API hook
function useUser(userId: number) {
    const { data, error, isLoading } = useQuery({
        queryKey: ['user', userId],
        queryFn: () => fetchUser(userId),
        staleTime: 5 * 60 * 1000, // 5 minutes
    })
    
    return { user: data, error, isLoading }
}

// Usage in component
function UserProfile({ userId }: { userId: number }) {
    const { user, error, isLoading } = useUser(userId)
    
    if (isLoading) return <Spinner />
    if (error) return <Error message={error.message} />
    if (!user) return <NotFound />
    
    return <div>{user.firstName}</div>
}
```

## Database Best Practices

### Migrations
Always use Alembic for database changes:

```bash
# Create a new migration
alembic revision --autogenerate -m "Add user role column"

# Review the migration file before applying!
# Then apply it:
alembic upgrade head

# Rollback if needed:
alembic downgrade -1
```

### Indexes
Add indexes for frequently queried columns:

```python
class User(Base):
    __tablename__ = "users"
    
    email = Column(String, unique=True, index=True)  # ✅ Indexed
    created_at = Column(DateTime, index=True)  # ✅ For date filtering
```

### Constraints
Use database constraints for data integrity:

```python
class Appointment(Base):
    __tablename__ = "appointments"
    
    patient_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    doctor_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    appointment_date = Column(DateTime, nullable=False)
    
    __table_args__ = (
        CheckConstraint('patient_id != doctor_id', name='different_patient_doctor'),
        UniqueConstraint('doctor_id', 'appointment_date', name='unique_doctor_time'),
    )
```

## API Design Best Practices

### RESTful Endpoints
Follow REST conventions:

```
GET    /api/v1/users          # List users
GET    /api/v1/users/{id}     # Get user
POST   /api/v1/users          # Create user
PUT    /api/v1/users/{id}     # Update user
DELETE /api/v1/users/{id}     # Delete user

GET    /api/v1/users/{id}/appointments  # User's appointments
```

### Status Codes
Use appropriate HTTP status codes:

```python
@router.post("/users", status_code=status.HTTP_201_CREATED)
async def create_user(user: UserCreate):
    # 201 Created for resource creation
    return created_user

@router.get("/users/{id}")
async def get_user(id: int):
    # 200 OK for successful GET
    # 404 Not Found if user doesn't exist
    return user

@router.delete("/users/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(id: int):
    # 204 No Content for successful deletion
    return None
```

### Pagination
Always paginate list endpoints:

```python
@router.get("/users")
async def list_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    users = db.query(User).offset(skip).limit(limit).all()
    total = db.query(User).count()
    
    return {
        "items": users,
        "total": total,
        "skip": skip,
        "limit": limit
    }
```

### Versioning
Version your API:

```python
# v1 endpoints
@router.get("/api/v1/users")
async def list_users_v1():
    return users

# v2 endpoints (with breaking changes)
@router.get("/api/v2/users")
async def list_users_v2():
    return users_with_new_fields
```

## Security Best Practices

### Authentication
```python
# ✅ Good: Secure password hashing
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

hashed_password = pwd_context.hash(plain_password)
is_valid = pwd_context.verify(plain_password, hashed_password)

# ❌ Bad: Never store plain passwords
user.password = plain_password  # NEVER DO THIS
```

### Authorization
```python
# ✅ Good: Check permissions
@router.get("/admin/users")
async def admin_users(current_user: User = Depends(get_current_active_user)):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=403,
            detail="Admin access required"
        )
    return users
```

### Input Validation
```python
# ✅ Good: Validate all inputs
class AppointmentCreate(BaseModel):
    doctor_id: int = Field(..., gt=0)
    appointment_date: datetime
    reason: str = Field(..., min_length=1, max_length=500)
    
    @validator('appointment_date')
    def date_must_be_future(cls, v):
        if v < datetime.now():
            raise ValueError('Appointment must be in the future')
        return v
```

### SQL Injection Prevention
```python
# ✅ Good: Use ORM (SQLAlchemy)
users = db.query(User).filter(User.email == email).all()

# ❌ Bad: Raw SQL with string formatting
db.execute(f"SELECT * FROM users WHERE email = '{email}'")  # VULNERABLE

# ✅ OK: Parameterized queries if you must use raw SQL
db.execute("SELECT * FROM users WHERE email = :email", {"email": email})
```

## Testing Best Practices

### Backend Tests
```python
import pytest
from fastapi.testclient import TestClient

def test_create_user(client: TestClient):
    """Test user creation with valid data"""
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": "test@example.com",
            "password": "password123",
            "first_name": "Test",
            "last_name": "User"
        }
    )
    
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "test@example.com"
    assert "password" not in data  # Password should not be returned

def test_create_user_duplicate_email(client: TestClient):
    """Test that duplicate email returns 400"""
    # Create first user
    client.post("/api/v1/auth/register", json=user_data)
    
    # Try to create second user with same email
    response = client.post("/api/v1/auth/register", json=user_data)
    
    assert response.status_code == 400
    assert "already registered" in response.json()["detail"]
```

### Frontend Tests
```typescript
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { UserProfile } from './UserProfile'

describe('UserProfile', () => {
    it('renders user information', async () => {
        const user = { id: 1, firstName: 'John', lastName: 'Doe' }
        
        render(<UserProfile user={user} />)
        
        expect(screen.getByText('John Doe')).toBeInTheDocument()
    })
    
    it('handles edit button click', async () => {
        const user = { id: 1, firstName: 'John', lastName: 'Doe' }
        const onEdit = jest.fn()
        
        render(<UserProfile user={user} onEdit={onEdit} />)
        
        await userEvent.click(screen.getByRole('button', { name: /edit/i }))
        
        expect(onEdit).toHaveBeenCalledWith(user)
    })
})
```

## Performance Best Practices

### Backend Performance
```python
# ✅ Use select_related for foreign keys
appointments = (
    db.query(Appointment)
    .join(Appointment.patient)
    .join(Appointment.doctor)
    .filter(Appointment.status == "pending")
    .all()
)

# ✅ Use pagination for large datasets
@router.get("/users")
async def list_users(skip: int = 0, limit: int = 20):
    return db.query(User).offset(skip).limit(limit).all()

# ✅ Cache expensive operations
from functools import lru_cache

@lru_cache(maxsize=128)
def get_settings():
    return Settings()
```

### Frontend Performance
```typescript
// ✅ Memoize expensive computations
const sortedUsers = useMemo(
    () => users.sort((a, b) => a.name.localeCompare(b.name)),
    [users]
)

// ✅ Debounce search inputs
const debouncedSearch = useDebouncedValue(searchTerm, 300)

useEffect(() => {
    if (debouncedSearch) {
        searchUsers(debouncedSearch)
    }
}, [debouncedSearch])

// ✅ Lazy load components
const AdminPanel = lazy(() => import('./AdminPanel'))

function App() {
    return (
        <Suspense fallback={<Loading />}>
            <AdminPanel />
        </Suspense>
    )
}
```

## Git Best Practices

### Commit Messages
Follow conventional commits:

```bash
feat: add user profile editing
fix: resolve login token expiration issue
docs: update API documentation
refactor: simplify appointment booking logic
test: add tests for user registration
chore: update dependencies
```

### Branch Naming
```bash
feature/user-authentication
bugfix/appointment-cancellation
hotfix/security-vulnerability
docs/api-documentation
```

### Pull Requests
- Keep PRs small and focused
- Write descriptive PR descriptions
- Link related issues
- Request reviews from relevant team members
- Ensure CI passes before merging

## Code Review Checklist

### Reviewer Checklist
- [ ] Code follows project conventions
- [ ] Tests are included and passing
- [ ] No security vulnerabilities
- [ ] Performance considerations addressed
- [ ] Documentation is updated
- [ ] Error handling is appropriate
- [ ] Type hints/types are present
- [ ] No hardcoded credentials or secrets
- [ ] Database migrations are safe
- [ ] API changes are backward compatible (or versioned)

## Documentation Best Practices

### Code Comments
```python
# ❌ Bad: Obvious comment
x = x + 1  # Increment x

# ✅ Good: Explains why
x = x + 1  # Account for 1-based indexing in API

# ✅ Good: Complex logic explanation
# We need to check both active status and verified email
# because unverified users should not be able to book appointments
# even if their account is technically active
if user.is_active and user.is_verified:
    allow_booking()
```

### Docstrings
```python
def create_appointment(
    db: Session,
    patient_id: int,
    doctor_id: int,
    appointment_date: datetime
) -> Appointment:
    """
    Create a new medical appointment.
    
    Args:
        db: Database session
        patient_id: ID of the patient booking the appointment
        doctor_id: ID of the doctor for the appointment
        appointment_date: Date and time of the appointment
        
    Returns:
        Appointment: The created appointment object
        
    Raises:
        ValueError: If appointment_date is in the past
        HTTPException: If doctor or patient not found (404)
        
    Example:
        >>> appointment = create_appointment(
        ...     db, patient_id=1, doctor_id=2,
        ...     appointment_date=datetime(2024, 1, 15, 14, 0)
        ... )
    """
    # Implementation...
```

## Environment Management

### Environment Variables
```bash
# ✅ Good: Use .env for local development
cp .env.example .env

# ✅ Good: Different files for different environments
.env.development
.env.staging
.env.production

# ❌ Bad: Committing .env to git
# Add .env to .gitignore!
```

### Secrets Management
```python
# ✅ Good: Get from environment
import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str
    
    class Config:
        env_file = ".env"

# ❌ Bad: Hardcoded secrets
DATABASE_URL = "postgresql://user:password@localhost/db"  # NEVER DO THIS
```

## Monitoring Best Practices

### Logging
```python
import logging

logger = logging.getLogger(__name__)

# ✅ Good: Structured logging
logger.info(
    "User logged in",
    extra={
        "user_id": user.id,
        "email": user.email,
        "ip_address": request.client.host
    }
)

# ❌ Bad: Sensitive data in logs
logger.info(f"User logged in with password: {password}")  # NEVER DO THIS
```

### Metrics
```python
from prometheus_client import Counter, Histogram

# Track API requests
api_requests = Counter(
    'api_requests_total',
    'Total API requests',
    ['method', 'endpoint', 'status']
)

# Track response times
request_duration = Histogram(
    'request_duration_seconds',
    'Request duration in seconds',
    ['endpoint']
)

@app.middleware("http")
async def track_metrics(request: Request, call_next):
    start = time.time()
    response = await call_next(request)
    duration = time.time() - start
    
    api_requests.labels(
        method=request.method,
        endpoint=request.url.path,
        status=response.status_code
    ).inc()
    
    request_duration.labels(endpoint=request.url.path).observe(duration)
    
    return response
```

## Summary

Following these best practices will help you:
- Write maintainable, scalable code
- Avoid common pitfalls
- Improve code quality
- Enhance security
- Boost performance
- Facilitate team collaboration
- Reduce technical debt

Remember: **Good code is code that's easy to understand, maintain, and extend.**
