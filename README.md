# 🏥 Santé - Medical Appointment Platform

A modern medical web application inspired by Doctolib France, facilitating online medical appointment booking and consultation management between patients and healthcare professionals.

## 🎨 Design System

### Color Palette
- **Primary Colors**: Medical Green (#00B894) and White (#FFFFFF)
- **Secondary Colors**: Light Green (#4CD3A5), Light Gray (#F1F2F6) for backgrounds
- **Accent Colors**: Medical Blue (#3498DB) for important actions, Red (#E74C3C) for alerts
- **Typography**: Montserrat for headings, Open Sans for body text
- **Style**: Clean interface with Material Design/Neumorphism, responsive on all devices

## 🚀 Tech Stack

### Backend
- **Language**: Python 3.11+
- **Framework**: FastAPI 0.104.0+
- **ORM**: SQLAlchemy 2.0+ with Alembic for migrations
- **Validation**: Pydantic V2
- **Authentication**: JWT with OAuth2 + MFA
- **API Documentation**: Swagger UI and ReDoc
- **Task Queue**: Celery with Redis broker
- **Testing**: Pytest with pytest-asyncio and pytest-cov

### Frontend
- **Framework**: Next.js 14+ (React 18+)
- **State Management**: Redux Toolkit / Zustand
- **Styling**: Tailwind CSS 3.0+ with custom components
- **Forms**: React Hook Form with Zod validation
- **API Queries**: React Query (TanStack Query)
- **Visualizations**: D3.js and Chart.js
- **i18n**: i18next
- **Testing**: Vitest, React Testing Library, Cypress

### Infrastructure
- **Containerization**: Docker with Docker Compose
- **CI/CD**: GitHub Actions
- **Monitoring**: Prometheus with Grafana
- **Logging**: ELK Stack (Elasticsearch, Logstash, Kibana)
- **Tracing**: Jaeger / OpenTelemetry
- **Reverse Proxy**: Nginx / Traefik
- **Cache**: Redis
- **Database**: PostgreSQL 16+
- **Analytics DB**: TimescaleDB (PostgreSQL extension)

## 📁 Project Structure

```
sante-application-web/
├── backend/                 # FastAPI backend application
│   ├── app/
│   │   ├── api/            # API routes
│   │   ├── core/           # Core configuration
│   │   ├── models/         # SQLAlchemy models
│   │   ├── schemas/        # Pydantic schemas
│   │   ├── services/       # Business logic
│   │   └── utils/          # Utility functions
│   ├── alembic/            # Database migrations
│   ├── tests/              # Backend tests
│   ├── requirements.txt    # Python dependencies
│   └── Dockerfile
├── frontend/               # Next.js frontend application
│   ├── src/
│   │   ├── app/           # Next.js 14 app directory
│   │   ├── components/    # React components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── lib/           # Utility libraries
│   │   ├── store/         # State management
│   │   └── styles/        # Global styles
│   ├── public/            # Static assets
│   ├── tests/             # Frontend tests
│   ├── package.json
│   └── Dockerfile
├── infrastructure/         # DevOps and infrastructure configs
│   ├── docker/
│   ├── k8s/
│   ├── terraform/
│   └── monitoring/
├── docker-compose.yml      # Local development setup
└── README.md
```

## 🎯 Features by User Role

### Patients
- Account creation with two-step verification
- Personal medical record (history, allergies, current treatments)
- Advanced doctor search with filters and interactive map
- Intelligent appointment booking with time slot suggestions
- Integrated video teleconsultations with virtual waiting room
- Multi-channel customizable reminders (email, SMS, push)
- Complete consultation history and medical documents
- Prescription tracking and automatic renewals
- Secure online payment (Credit Card, PayPal, Apple Pay)
- Practitioner rating system
- Real-time notifications for delays or changes
- Digital vaccination record with reminder alerts
- Synchronization with connected health devices
- Family mode to manage appointments for dependents

### Doctors
- Detailed professional profile with medical CV
- Advanced calendar configuration with customizable rules
- Analytical activity dashboard with forecasts
- Automated cancellation management with replacement suggestions
- Complete electronic patient record with medical history
- Electronic prescription system with drug database
- Integrated billing module (CCAM/NGAP) with teletransmission
- AI-based clinical decision support tools
- Correspondent management and referral network
- Bidirectional synchronization with existing practice software
- Virtual assistant for medical report entry
- Secure collaboration between practitioners
- Clinical and administrative task manager
- Integrated continuing medical education module

### Administrators
- Central multi-indicator real-time dashboard
- Granular permission management by role and service
- Advanced analytics with integrated Business Intelligence
- Customizable and exportable report generator
- System configuration console without service interruption
- Automated marketing tools (email, SMS campaigns)
- Fraud detection and suspicious activity system
- Complete audit trails and secure activity logs
- Multi-facility management with consolidated view
- System performance monitoring with predictive alerts
- GDPR compliance module with automated controls
- Content management for news and medical resources
- Responsive mobile administration interface

## 🚦 Getting Started

### Prerequisites
- Docker 20.10+ and Docker Compose 2.0+
- Git
- (Optional) Make utility for easier commands

### Quick Start with Make

```bash
# Clone the repository
git clone https://github.com/mmahmoud2022/sante-application-web.git
cd sante-application-web

# Initialize the project (copies .env, builds images, starts services, runs migrations)
make init

# Or manually:
cp .env.example .env
docker-compose up -d
docker-compose exec backend alembic upgrade head
```

### Verify Setup

```bash
# Check all services
./scripts/verify-setup.sh

# Or check manually
docker-compose ps
curl http://localhost:8000/health
```

### Access the Applications

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **Alternative API Docs**: http://localhost:8000/redoc
- **Prometheus**: http://localhost:9090
- **Grafana**: http://localhost:3001 (admin/admin)
- **Kibana**: http://localhost:5601
- **Jaeger**: http://localhost:16686

### Common Commands

```bash
# Using Make (recommended)
make help           # Show all available commands
make up             # Start all services
make down           # Stop all services
make logs           # View logs
make migrate        # Run database migrations
make test-backend   # Run backend tests

# Using Docker Compose directly
docker-compose up -d                        # Start services
docker-compose down                         # Stop services
docker-compose logs -f                      # View logs
docker-compose exec backend alembic upgrade head  # Run migrations
```

### Development Workflow

1. **Backend Development**: Edit files in `backend/app/`, changes auto-reload
2. **Frontend Development**: Edit files in `frontend/src/`, hot-reload enabled
3. **Database Changes**: Modify models, run `make migrate-create MSG="description"`, then `make migrate`

For detailed instructions, see the [Quick Start Guide](docs/QUICKSTART.md).

## 🧪 Testing

### Backend Tests
```bash
cd backend
pytest --cov=app tests/
```

### Frontend Tests
```bash
cd frontend
npm run test              # Unit tests
npm run test:e2e          # E2E tests with Cypress
```

## 📊 Monitoring & Observability

- **Prometheus**: Metrics collection (http://localhost:9090)
- **Grafana**: Metrics visualization (http://localhost:3001)
- **Kibana**: Log visualization (http://localhost:5601)
- **Jaeger**: Distributed tracing (http://localhost:16686)

## 🔒 Security

- HDS (Health Data Hosting) compliance
- Data encryption at rest and in transit
- Continuous static and dynamic code analysis
- Contextual multi-factor authentication
- Fine-grained patient consent management
- DDoS protection with intelligent rate limiting
- Intrusion detection and incident response
- Quarterly external security audit

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👥 Contributing

Please read CONTRIBUTING.md for details on our code of conduct and the process for submitting pull requests.

## 📧 Support

For support, email support@sante-app.com or open an issue in this repository.
