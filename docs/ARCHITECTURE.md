# Architecture Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Load Balancer / CDN                      │
└─────────────────────────────────────────────────────────────────┘
                                 │
                ┌────────────────┴────────────────┐
                │                                 │
        ┌───────▼────────┐              ┌────────▼────────┐
        │  Nginx Proxy   │              │  Static Assets  │
        └───────┬────────┘              └─────────────────┘
                │
        ┌───────┴────────┐
        │                │
   ┌────▼─────┐    ┌────▼─────┐
   │ Frontend │    │ Backend  │
   │ Next.js  │    │ FastAPI  │
   └──────────┘    └────┬─────┘
                        │
        ┌───────────────┼───────────────┐
        │               │               │
   ┌────▼────┐    ┌────▼────┐    ┌────▼────┐
   │PostgreSQL│    │ Redis   │    │ Celery  │
   │         │    │ Cache   │    │ Workers │
   └─────────┘    └─────────┘    └─────────┘
        │
   ┌────▼────────────────────────────┐
   │     Monitoring & Logging        │
   │  Prometheus | Grafana | ELK     │
   └─────────────────────────────────┘
```

## Component Details

### Frontend Layer (Next.js 14)

**Technology Stack:**
- Next.js 14 (React 18)
- TypeScript
- Tailwind CSS
- Redux Toolkit / Zustand (State Management)
- React Query (Data Fetching)
- React Hook Form + Zod (Form Validation)

**Key Features:**
- Server-Side Rendering (SSR)
- Static Site Generation (SSG)
- Image Optimization
- Code Splitting
- Progressive Web App (PWA) capabilities

**Pages:**
- Landing page with features
- User authentication (login/register)
- Patient dashboard
- Doctor dashboard
- Admin dashboard
- Appointment booking
- Medical records
- Telemedicine interface
- Profile management

### Backend Layer (FastAPI)

**Technology Stack:**
- Python 3.11+
- FastAPI 0.104+
- SQLAlchemy 2.0 (ORM)
- Alembic (Migrations)
- Pydantic V2 (Validation)
- JWT (Authentication)

**API Architecture:**
- RESTful API design
- Versioned endpoints (/api/v1/)
- OpenAPI/Swagger documentation
- Request validation
- Error handling
- Rate limiting
- CORS support

**Core Modules:**
```
app/
├── api/
│   └── v1/
│       ├── endpoints/      # API endpoints
│       └── api.py          # Router aggregation
├── core/
│   ├── config.py          # Configuration
│   ├── database.py        # Database connection
│   ├── security.py        # Auth utilities
│   └── celery_app.py      # Task queue
├── models/                # SQLAlchemy models
├── schemas/               # Pydantic schemas
├── services/              # Business logic
└── utils/                 # Helper functions
```

### Database Layer

**PostgreSQL 16:**
- Primary relational database
- ACID compliant
- JSON support for flexible data
- Full-text search capabilities
- Geospatial support (PostGIS extension)

**Schema Design:**
```
users
├── id (PK)
├── email (unique)
├── hashed_password
├── role (patient/doctor/admin)
├── profile data
└── timestamps

appointments
├── id (PK)
├── patient_id (FK -> users)
├── doctor_id (FK -> users)
├── appointment_date
├── status
└── metadata

medical_records
├── id (PK)
├── patient_id (FK -> users)
├── medical data (JSON)
└── timestamps
```

**Redis:**
- Session storage
- Cache layer
- Celery message broker
- Real-time data
- Rate limiting counters

### Task Queue (Celery)

**Background Tasks:**
- Email notifications
- SMS notifications
- Appointment reminders
- Report generation
- Data synchronization
- Scheduled jobs

**Scheduler (Celery Beat):**
- Hourly appointment reminders
- Daily report generation
- Weekly analytics updates
- Monthly billing

### Reverse Proxy (Nginx)

**Responsibilities:**
- Request routing
- Load balancing
- SSL/TLS termination
- Static file serving
- Rate limiting
- Security headers
- CORS handling
- Gzip compression

### Monitoring & Observability

**Prometheus:**
- Metrics collection
- Time-series data
- Alert rules
- Service health monitoring

**Grafana:**
- Metrics visualization
- Custom dashboards
- Alert management
- Multi-source data

**ELK Stack:**
- **Elasticsearch**: Log storage and search
- **Logstash**: Log processing
- **Kibana**: Log visualization

**Jaeger:**
- Distributed tracing
- Request flow visualization
- Performance monitoring
- Bottleneck identification

## Data Flow

### User Registration Flow

```
User → Frontend → Backend API → Database
                       ↓
                  Hash Password
                       ↓
                  Create User
                       ↓
                  Send Email (Celery)
```

### Appointment Booking Flow

```
Patient → Search Doctors → View Availability
              ↓
         Select Time Slot
              ↓
         Book Appointment → Backend API
              ↓
         Save to Database
              ↓
         Send Notifications (Celery)
              ↓
         Confirmation Email/SMS
```

### Authentication Flow

```
User → Login → Backend
                  ↓
            Verify Credentials
                  ↓
           Generate JWT Token
                  ↓
         Return Token to Frontend
                  ↓
         Store in Local Storage
                  ↓
    Include in Authorization Header
```

## Security Architecture

### Authentication & Authorization

- **JWT Tokens**: Stateless authentication
- **OAuth2**: Third-party login (Google, Facebook)
- **MFA**: Two-factor authentication
- **Role-Based Access Control**: Patient, Doctor, Admin roles
- **Permission System**: Granular access control

### Data Protection

- **Encryption at Rest**: Database encryption
- **Encryption in Transit**: TLS/SSL
- **Password Hashing**: Bcrypt
- **Sensitive Data**: Encrypted fields
- **GDPR Compliance**: Data privacy controls

### API Security

- **Rate Limiting**: Prevent abuse
- **CORS**: Controlled origins
- **Input Validation**: Pydantic schemas
- **SQL Injection Prevention**: SQLAlchemy ORM
- **XSS Protection**: Content Security Policy

## Scalability

### Horizontal Scaling

- **Backend**: Stateless, can run multiple instances
- **Frontend**: SSR with multiple instances
- **Celery Workers**: Easily scalable
- **Database**: Read replicas

### Vertical Scaling

- Increase container resources
- Database optimization
- Caching strategies

### Caching Strategy

**Layers:**
1. **Browser Cache**: Static assets
2. **CDN Cache**: Images, CSS, JS
3. **Redis Cache**: API responses
4. **Database Query Cache**: Frequent queries

## Deployment Architecture

### Development

```
Docker Compose
├── PostgreSQL
├── Redis
├── Backend (Hot reload)
├── Frontend (Hot reload)
├── Celery Worker
├── Celery Beat
└── Monitoring Stack
```

### Production

```
Kubernetes Cluster
├── Load Balancer
├── Frontend Pods (3 replicas)
├── Backend Pods (5 replicas)
├── Celery Worker Pods (3 replicas)
├── PostgreSQL (StatefulSet)
├── Redis (StatefulSet)
└── Monitoring Stack
```

## Disaster Recovery

### Backup Strategy

- **Database**: Daily automated backups
- **Files**: S3 with versioning
- **Configuration**: Infrastructure as Code (Terraform)

### High Availability

- **Multi-AZ Deployment**: Cross-availability zones
- **Database Replication**: Master-slave setup
- **Load Balancing**: Multiple backend instances
- **Health Checks**: Automatic failover

## Performance Optimization

### Backend

- **Connection Pooling**: SQLAlchemy pool
- **Query Optimization**: Indexes, explain analyze
- **Async Operations**: FastAPI async endpoints
- **Caching**: Redis for frequent queries

### Frontend

- **Code Splitting**: Dynamic imports
- **Image Optimization**: Next.js Image component
- **Bundle Size**: Tree shaking, minification
- **Lazy Loading**: Components on demand

### Database

- **Indexes**: On frequently queried columns
- **Partitioning**: For large tables
- **VACUUM**: Regular maintenance
- **Query Planning**: Analyze and optimize

## Technology Choices Rationale

### Why FastAPI?

- Modern Python framework
- Automatic API documentation
- Built-in validation
- High performance
- Async support
- Type hints

### Why Next.js?

- SSR and SSG capabilities
- Great developer experience
- Optimized production builds
- Image optimization
- API routes
- Large ecosystem

### Why PostgreSQL?

- ACID compliance
- JSON support
- Mature and stable
- Great performance
- Excellent documentation
- Wide adoption

### Why Redis?

- Fast in-memory storage
- Pub/Sub capabilities
- Session management
- Caching layer
- Celery broker

## Future Enhancements

- GraphQL API layer
- WebSocket for real-time features
- Microservices architecture
- Event-driven architecture
- Machine Learning integration
- Mobile apps (React Native)
