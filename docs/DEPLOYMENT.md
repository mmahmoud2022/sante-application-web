# Deployment Guide

## Local Development

### Prerequisites
- Docker 20.10+
- Docker Compose 2.0+
- Git

### Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/mmahmoud2022/sante-application-web.git
   cd sante-application-web
   ```

2. **Configure environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start all services**
   ```bash
   docker-compose up -d
   ```

4. **Initialize database**
   ```bash
   docker-compose exec backend alembic upgrade head
   ```

5. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Docs: http://localhost:8000/docs
   - Grafana: http://localhost:3001
   - Prometheus: http://localhost:9090
   - Kibana: http://localhost:5601

### Stopping Services

```bash
docker-compose down
```

To remove volumes (database data):
```bash
docker-compose down -v
```

## Production Deployment

### Using Docker Compose

1. **Configure production environment**
   ```bash
   cp .env.example .env.production
   # Edit .env.production with production values
   ```

2. **Build production images**
   ```bash
   docker-compose -f docker-compose.yml -f docker-compose.prod.yml build
   ```

3. **Deploy**
   ```bash
   docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
   ```

### Using Kubernetes

1. **Configure kubectl**
   ```bash
   kubectl config use-context production
   ```

2. **Create namespace**
   ```bash
   kubectl create namespace sante-app
   ```

3. **Deploy secrets**
   ```bash
   kubectl create secret generic sante-secrets \
     --from-env-file=.env.production \
     -n sante-app
   ```

4. **Apply manifests**
   ```bash
   kubectl apply -f infrastructure/k8s/ -n sante-app
   ```

### Health Checks

Monitor application health:
```bash
curl http://localhost:8000/health
```

Expected response:
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "environment": "production"
}
```

## Database Migrations

### Create a new migration

```bash
docker-compose exec backend alembic revision --autogenerate -m "Description of changes"
```

### Apply migrations

```bash
docker-compose exec backend alembic upgrade head
```

### Rollback migration

```bash
docker-compose exec backend alembic downgrade -1
```

## Backup and Restore

### Database Backup

```bash
docker-compose exec postgres pg_dump -U sante_user sante_db > backup.sql
```

### Database Restore

```bash
docker-compose exec -T postgres psql -U sante_user sante_db < backup.sql
```

## Monitoring

### View logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
```

### Access monitoring tools

- **Grafana**: http://localhost:3001 (admin/admin)
- **Prometheus**: http://localhost:9090
- **Kibana**: http://localhost:5601
- **Jaeger**: http://localhost:16686

## Security

### SSL/TLS Configuration

1. **Generate SSL certificates**
   ```bash
   openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
     -keyout infrastructure/docker/nginx/ssl/key.pem \
     -out infrastructure/docker/nginx/ssl/cert.pem
   ```

2. **Update Nginx configuration** to use SSL

### Environment Variables

Never commit sensitive data to version control. Use:
- `.env` for local development
- Secret management tools (Vault, AWS Secrets Manager) for production
- Kubernetes Secrets for K8s deployments

## Scaling

### Horizontal Scaling

Scale backend workers:
```bash
docker-compose up -d --scale backend=3
```

Scale Celery workers:
```bash
docker-compose up -d --scale celery_worker=5
```

### Vertical Scaling

Update resource limits in `docker-compose.yml`:
```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '1'
          memory: 1G
```

## Troubleshooting

### Backend won't start

1. Check logs: `docker-compose logs backend`
2. Verify database connection: `docker-compose exec backend python -c "from app.core.database import engine; engine.connect()"`
3. Check environment variables: `docker-compose exec backend env`

### Frontend build fails

1. Clear Next.js cache: `docker-compose exec frontend rm -rf .next`
2. Reinstall dependencies: `docker-compose exec frontend npm install`
3. Check Node.js version: `docker-compose exec frontend node --version`

### Database connection issues

1. Verify PostgreSQL is running: `docker-compose ps postgres`
2. Check database health: `docker-compose exec postgres pg_isready`
3. Test connection: `docker-compose exec postgres psql -U sante_user -d sante_db -c "SELECT 1"`

## Performance Optimization

### Database

1. **Add indexes** for frequently queried fields
2. **Enable connection pooling** (already configured in SQLAlchemy)
3. **Regular VACUUM** operations:
   ```bash
   docker-compose exec postgres psql -U sante_user -d sante_db -c "VACUUM ANALYZE;"
   ```

### Caching

Redis is configured for:
- Session storage
- Celery task queue
- API response caching (implement as needed)

### CDN

For production, use a CDN for static assets:
1. Upload frontend build to CDN
2. Update `NEXT_PUBLIC_CDN_URL` in environment
3. Configure CDN cache headers

## Maintenance

### Update Dependencies

Backend:
```bash
cd backend
pip list --outdated
pip install --upgrade <package>
```

Frontend:
```bash
cd frontend
npm outdated
npm update
```

### Security Updates

Regularly update base images and dependencies:
```bash
docker-compose pull
docker-compose build --no-cache
```

## Support

For deployment issues:
- Check documentation: `/docs`
- Open an issue: GitHub Issues
- Contact: support@sante-app.com
