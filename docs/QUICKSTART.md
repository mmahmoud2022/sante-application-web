# Quick Start Guide

Get the Santé Medical Application running on your local machine in under 5 minutes!

## Prerequisites

- Docker Desktop (or Docker Engine + Docker Compose)
- Git
- A code editor (VS Code recommended)

## Step 1: Clone and Setup

```bash
# Clone the repository
git clone https://github.com/mmahmoud2022/sante-application-web.git
cd sante-application-web

# Copy environment configuration
cp .env.example .env
```

## Step 2: Start the Application

```bash
# Start all services (first time will take a few minutes to download images)
docker-compose up -d

# Wait for services to be healthy (about 30 seconds)
docker-compose ps
```

Expected output:
```
NAME                  STATUS              PORTS
sante_backend         Up (healthy)        0.0.0.0:8000->8000/tcp
sante_frontend        Up                  0.0.0.0:3000->3000/tcp
sante_postgres        Up (healthy)        0.0.0.0:5432->5432/tcp
sante_redis           Up (healthy)        0.0.0.0:6379->6379/tcp
...
```

## Step 3: Initialize Database

```bash
# Run database migrations
docker-compose exec backend alembic upgrade head
```

## Step 4: Access the Application

Open your browser and navigate to:

- **Frontend**: http://localhost:3000
- **API Documentation**: http://localhost:8000/docs
- **API Alternative Docs**: http://localhost:8000/redoc

## Step 5: Create Your First User

### Using the API Documentation (Swagger UI)

1. Open http://localhost:8000/docs
2. Navigate to **POST /api/v1/auth/register**
3. Click "Try it out"
4. Use this example data:
```json
{
  "email": "patient@example.com",
  "password": "password123",
  "first_name": "John",
  "last_name": "Doe",
  "phone": "+33612345678",
  "role": "patient"
}
```
5. Click "Execute"

### Using curl

```bash
curl -X POST "http://localhost:8000/api/v1/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "patient@example.com",
    "password": "password123",
    "first_name": "John",
    "last_name": "Doe",
    "phone": "+33612345678",
    "role": "patient"
  }'
```

## Step 6: Login and Get a Token

1. Go to **POST /api/v1/auth/login** in Swagger UI
2. Click "Try it out"
3. Enter credentials:
   - **username**: patient@example.com
   - **password**: password123
4. Click "Execute"
5. Copy the `access_token` from the response

## Step 7: Make Authenticated Requests

1. Click the "Authorize" button at the top of Swagger UI
2. Enter: `Bearer <your_access_token>`
3. Click "Authorize"
4. Now you can try protected endpoints like **GET /api/v1/users/me**

## Common Operations

### Create a Doctor Account

```bash
curl -X POST "http://localhost:8000/api/v1/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "doctor@example.com",
    "password": "password123",
    "first_name": "Dr. Jane",
    "last_name": "Smith",
    "phone": "+33612345679",
    "role": "doctor"
  }'
```

### View Logs

```bash
# All services
docker-compose logs -f

# Backend only
docker-compose logs -f backend

# Frontend only
docker-compose logs -f frontend
```

### Stop the Application

```bash
# Stop all services
docker-compose down

# Stop and remove all data (including database)
docker-compose down -v
```

### Restart a Single Service

```bash
# Restart backend
docker-compose restart backend

# Rebuild and restart backend
docker-compose up -d --build backend
```

## Development Workflow

### Backend Development

1. **Make code changes** in `backend/app/`
2. **Auto-reload** is enabled, changes will be reflected automatically
3. **Run tests**:
   ```bash
   docker-compose exec backend pytest
   ```

### Frontend Development

1. **Make code changes** in `frontend/src/`
2. **Hot reload** is enabled, changes appear immediately
3. **Build for production**:
   ```bash
   docker-compose exec frontend npm run build
   ```

### Database Changes

1. **Modify models** in `backend/app/models/`
2. **Generate migration**:
   ```bash
   docker-compose exec backend alembic revision --autogenerate -m "Add new field"
   ```
3. **Apply migration**:
   ```bash
   docker-compose exec backend alembic upgrade head
   ```

## Monitoring & Debugging

### Health Check

```bash
curl http://localhost:8000/health
```

### Access Database

```bash
docker-compose exec postgres psql -U sante_user -d sante_db
```

### Access Redis

```bash
docker-compose exec redis redis-cli
```

### View Metrics

- **Prometheus**: http://localhost:9090
- **Grafana**: http://localhost:3001 (admin/admin)

### View Logs

- **Kibana**: http://localhost:5601

### Distributed Tracing

- **Jaeger**: http://localhost:16686

## Troubleshooting

### Port Already in Use

If you get "port is already allocated" error:

```bash
# Change ports in docker-compose.yml
# For example, change 3000:3000 to 3001:3000
```

### Backend Won't Start

```bash
# Check logs
docker-compose logs backend

# Rebuild
docker-compose up -d --build backend
```

### Database Connection Failed

```bash
# Check if PostgreSQL is healthy
docker-compose ps postgres

# Restart PostgreSQL
docker-compose restart postgres
```

### Clear Everything and Start Fresh

```bash
# Stop and remove all containers and volumes
docker-compose down -v

# Remove images
docker-compose down --rmi all

# Start again
docker-compose up -d
```

## Next Steps

- Read the [API Documentation](API.md)
- Check the [Deployment Guide](DEPLOYMENT.md)
- Review the [Contributing Guidelines](../CONTRIBUTING.md)
- Explore the code structure
- Add your custom features!

## Getting Help

- **Documentation**: Check `/docs` directory
- **Issues**: Open a GitHub issue
- **Discussion**: Start a GitHub discussion
- **Email**: support@sante-app.com

Happy coding! 🎉
