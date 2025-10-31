# Database Migration Strategy

## Overview

This document outlines the database migration strategy for the Santé application, including testing procedures, rollback plans, and best practices.

## Migration Tools

We use **Alembic** for database schema migrations, which provides:
- Version control for database schema
- Automatic migration script generation
- Support for upgrade and downgrade operations
- Transaction support for safe migrations

## Migration Workflow

### 1. Development Phase

#### Creating a New Migration

```bash
# Auto-generate migration from model changes
alembic revision --autogenerate -m "description of changes"

# Create empty migration for manual changes
alembic revision -m "description of changes"
```

#### Review Generated Migration

Always review auto-generated migrations:
- Check column types are correct
- Verify indexes are properly named
- Ensure foreign keys have proper constraints
- Add data migrations if needed

#### Test Migration Locally

```bash
# Apply migration
alembic upgrade head

# Test downgrade
alembic downgrade -1

# Re-apply
alembic upgrade head
```

### 2. Testing Phase

#### Migration Testing Checklist

- [ ] Migration runs successfully on clean database
- [ ] Migration runs successfully on database with existing data
- [ ] Downgrade works correctly
- [ ] Re-upgrade works after downgrade
- [ ] Application works with new schema
- [ ] Performance benchmarks meet expectations
- [ ] Data integrity is maintained

#### Automated Testing

Add migration tests to CI/CD pipeline:

```bash
# Run in CI/CD
pytest tests/test_migrations.py
```

### 3. Staging Deployment

#### Pre-Deployment

1. **Backup Database**
   ```bash
   pg_dump -h <host> -U <user> -d <database> -F c -f backup_$(date +%Y%m%d_%H%M%S).dump
   ```

2. **Verify Backup**
   ```bash
   pg_restore --list backup_*.dump | head -20
   ```

3. **Check Migration Status**
   ```bash
   alembic current
   alembic history
   ```

#### Deployment

1. **Apply Migration**
   ```bash
   alembic upgrade head
   ```

2. **Verify Migration**
   ```bash
   alembic current
   # Should show latest revision
   ```

3. **Test Application**
   - Run smoke tests
   - Check critical endpoints
   - Verify data integrity

### 4. Production Deployment

#### Pre-Production Checklist

- [ ] Staging migration completed successfully
- [ ] All tests passing
- [ ] Database backup completed
- [ ] Backup verified
- [ ] Rollback plan documented
- [ ] Team notified of deployment
- [ ] Maintenance window scheduled (if needed)

#### Zero-Downtime Migrations

For large tables, use concurrent index creation:

```python
# In migration file
op.create_index(
    'ix_appointments_doctor_date',
    'appointments',
    ['doctor_id', 'appointment_date'],
    postgresql_concurrently=True  # No table locks
)
```

**Note**: Concurrent index creation cannot run in a transaction block.

#### Production Deployment Steps

1. **Enable Maintenance Mode** (if needed)
   ```bash
   # Set maintenance mode flag
   redis-cli SET maintenance_mode true
   ```

2. **Backup Database**
   ```bash
   # Automated backup script
   ./scripts/backup_database.sh
   ```

3. **Apply Migration**
   ```bash
   # With logging
   alembic upgrade head 2>&1 | tee migration_$(date +%Y%m%d_%H%M%S).log
   ```

4. **Verify Migration**
   ```bash
   alembic current
   psql -c "SELECT COUNT(*) FROM appointments;"
   ```

5. **Deploy Application Code**
   ```bash
   # Deploy new application version
   ./scripts/deploy.sh
   ```

6. **Run Smoke Tests**
   ```bash
   ./scripts/smoke_tests.sh
   ```

7. **Disable Maintenance Mode**
   ```bash
   redis-cli DEL maintenance_mode
   ```

## Rollback Procedures

### When to Rollback

Rollback if:
- Migration fails with errors
- Data corruption detected
- Critical application features broken
- Performance degradation severe

### Rollback Steps

#### 1. Stop Application Traffic

```bash
# Enable maintenance mode
redis-cli SET maintenance_mode true

# Or stop application
systemctl stop sante-api
```

#### 2. Rollback Database

```bash
# Rollback one version
alembic downgrade -1

# Or rollback to specific version
alembic downgrade <revision_id>

# Verify
alembic current
```

#### 3. Restore Application Code

```bash
# Deploy previous version
git checkout <previous_tag>
./scripts/deploy.sh
```

#### 4. Verify System

```bash
# Run verification tests
./scripts/verify_rollback.sh

# Check critical endpoints
curl -f https://api.sante-app.com/health
```

#### 5. Resume Traffic

```bash
# Disable maintenance mode
redis-cli DEL maintenance_mode

# Or start application
systemctl start sante-api
```

### Data Rollback

If downgrade migration is insufficient:

```bash
# Restore from backup
pg_restore -h <host> -U <user> -d <database> -c backup_<timestamp>.dump
```

**Warning**: This will lose any data created after the backup.

## Best Practices

### DO

✅ Always backup before migrations
✅ Test migrations on staging first
✅ Use transactions where possible
✅ Write reversible migrations
✅ Document complex migrations
✅ Monitor migration performance
✅ Use concurrent index creation for large tables
✅ Plan for data migrations separately
✅ Version control migration scripts

### DON'T

❌ Run migrations without backup
❌ Skip testing on staging
❌ Make irreversible changes without plan
❌ Mix schema and data changes in one migration
❌ Ignore migration warnings
❌ Apply migrations during peak hours (if downtime expected)
❌ Delete old migrations from version control

## Useful Commands

```bash
# Show migration history
alembic history --verbose

# Show current migration
alembic current

# Show SQL for migration (don't execute)
alembic upgrade head --sql

# Downgrade all the way
alembic downgrade base
```
