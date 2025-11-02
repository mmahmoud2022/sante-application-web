# Upgrade Testing Checklist

This checklist should be completed after the November 2024 component upgrades to ensure system stability and compatibility.

## Pre-Testing Preparation

### 1. Environment Setup
```bash
# Clone or pull latest changes
git pull origin main

# Ensure Docker is running
docker --version
docker-compose --version
```

### 2. Clean Previous State
```bash
# Stop and remove existing containers
make down-v

# Remove old images (optional, for fresh build)
docker image prune -a
```

## Backend Testing

### 1. Dependency Installation Test
```bash
# Create fresh virtual environment
python3.12 -m venv venv-test
source venv-test/bin/activate

# Install dependencies
cd backend
pip install -r requirements.txt

# Expected: All packages install without errors
# Verify key packages
pip list | grep -E "fastapi|uvicorn|celery|sqlalchemy|pydantic"
```

**Expected Output:**
```
fastapi            0.115.6
uvicorn            0.32.1
celery             5.4.0
sqlalchemy         2.0.36
pydantic           2.10.6
```

### 2. Python Version Verification
```bash
python --version
# Expected: Python 3.12.x
```

### 3. Backend Unit Tests
```bash
# From backend directory
pytest tests/ -v --cov=app

# Expected: All tests pass with similar or better coverage than before
# Look for: 
# - No import errors
# - No compatibility warnings
# - Test pass rate: 100%
```

### 4. Linting and Code Quality
```bash
# Run black
black --check app/

# Run flake8
flake8 app/ --max-line-length=120

# Run isort
isort --check-only app/

# Expected: No errors or only pre-existing issues
```

### 5. Type Checking
```bash
mypy app/ --ignore-missing-imports

# Expected: No new type errors
```

## Frontend Testing

### 1. Node Version Verification
```bash
node --version
# Expected: v20.x.x

npm --version
# Expected: 10.x.x
```

### 2. Dependency Installation Test
```bash
cd frontend

# Clean install
rm -rf node_modules package-lock.json
npm install

# Expected: No errors or vulnerabilities
# Note: Some peer dependency warnings are acceptable
```

### 3. Frontend Build Test
```bash
# From frontend directory
npm run build

# Expected: Build completes successfully
# Look for: 
# - No TypeScript errors
# - No Next.js errors
# - Build artifacts in .next directory
```

### 4. Frontend Linting
```bash
npm run lint

# Expected: No linting errors or only pre-existing issues
```

### 5. Type Checking
```bash
npm run type-check

# Expected: No TypeScript errors
```

### 6. Frontend Unit Tests
```bash
npm test

# Expected: All tests pass
```

## Docker and Docker Compose Testing

### 1. Backend Docker Build
```bash
cd backend
docker build -t sante-backend:test .

# Expected: Build completes successfully
# Verify image
docker images | grep sante-backend
```

### 2. Frontend Docker Build
```bash
cd frontend
docker build -t sante-frontend:test .

# Expected: Build completes successfully
# Verify image
docker images | grep sante-frontend
```

### 3. Full Stack with Docker Compose
```bash
# From project root
make build

# Expected: All services build successfully
```

### 4. Start All Services
```bash
make up

# Wait for services to be ready (~30 seconds)
sleep 30

# Check service status
make ps

# Expected: All services running and healthy
```

### 5. Database Migrations
```bash
make migrate

# Expected: Migrations run successfully with new Alembic version
# Look for: "Running upgrade" messages
```

### 6. Service Health Checks
```bash
# Check backend health
curl http://localhost:8000/health
# Expected: {"status":"healthy"} or similar

# Check frontend
curl -I http://localhost:3000
# Expected: HTTP 200 OK

# Check Redis
docker-compose exec redis redis-cli ping
# Expected: PONG

# Check PostgreSQL
docker-compose exec postgres psql -U sante_user -d sante_db -c "SELECT version();"
# Expected: PostgreSQL version string
```

### 7. Celery Worker Check
```bash
# Check Celery worker logs
docker-compose logs celery_worker | tail -20

# Expected: 
# - No errors
# - Worker is ready
# - Connected to Redis
```

## Integration Testing

### 1. API Endpoint Tests
```bash
# Test authentication endpoint
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'

# Expected: JSON response (may be 401 if user doesn't exist, which is fine)
```

### 2. Frontend Loading
```bash
# Open in browser
# Visit: http://localhost:3000

# Expected:
# - Page loads without errors
# - No console errors (F12 Developer Tools)
# - Styles render correctly
# - Dark mode toggle works (if applicable)
```

### 3. Background Task Test
```bash
# Trigger a background task (if you have a test endpoint)
# Check Celery worker logs
docker-compose logs -f celery_worker

# Expected: Task executes successfully
```

## E2E Testing

### 1. Run Cypress Tests
```bash
cd frontend
npm run test:e2e:headless

# Expected: All E2E tests pass
# Note: Backend must be running
```

## CI/CD Testing

### 1. GitHub Actions Validation
```bash
# Install act (GitHub Actions local runner) if available
# Or push to a test branch and monitor GitHub Actions

# Check workflow syntax
cd .github/workflows
python3 -c "import yaml; yaml.safe_load(open('ci.yml'))"
python3 -c "import yaml; yaml.safe_load(open('e2e-tests.yml'))"

# Expected: No syntax errors
```

## Performance Testing

### 1. Backend Response Time
```bash
# Simple benchmark
for i in {1..10}; do
  curl -w "@-" -o /dev/null -s http://localhost:8000/health <<'EOF'
   time_total: %{time_total}s\n
EOF
done

# Expected: Similar or better response times than before upgrade
# Baseline: < 100ms for health endpoint
```

### 2. Frontend Load Time
```bash
# Use browser DevTools Network tab
# Load http://localhost:3000

# Expected: 
# - Initial load: < 2s
# - Time to Interactive: < 3s
# - No performance regressions
```

## Rollback Test (Optional)

### 1. Test Rollback Procedure
```bash
# Stop services
make down

# Checkout previous version
git checkout HEAD~2

# Rebuild and start
make build
make up

# Expected: System works with old versions

# Return to new version
git checkout -
```

## Documentation Review

### 1. Verify Documentation Updates
- [ ] README.md reflects Python 3.12+
- [ ] UPGRADE_2024_11.md is complete and accurate
- [ ] No references to old versions in critical docs
- [ ] API documentation still generates correctly

## Sign-off Checklist

- [ ] All backend tests pass
- [ ] All frontend tests pass
- [ ] Docker builds complete successfully
- [ ] All services start and run healthy
- [ ] Database migrations work
- [ ] API endpoints respond correctly
- [ ] Frontend UI loads and functions
- [ ] Celery workers process tasks
- [ ] E2E tests pass
- [ ] CI/CD workflows are valid
- [ ] No new security vulnerabilities
- [ ] Performance is acceptable
- [ ] Documentation is updated

## Issues Encountered

Document any issues here:

| Component | Issue | Severity | Resolution | Status |
|-----------|-------|----------|------------|--------|
| Example   | ...   | High/Med/Low | ...    | Open/Resolved |

## Performance Metrics

Record baseline metrics for comparison:

| Metric | Before | After | Change |
|--------|--------|-------|--------|
| Backend test duration | ? | ? | ? |
| Frontend build time | ? | ? | ? |
| API response time (avg) | ? | ? | ? |
| Docker build time | ? | ? | ? |
| Memory usage (backend) | ? | ? | ? |
| Memory usage (frontend) | ? | ? | ? |

## Notes

Add any additional observations or notes here.

---

**Test Date**: _____________
**Tester**: _____________
**Environment**: Development / Staging / Production
**Overall Status**: ⬜ Pass ⬜ Fail ⬜ Partial
