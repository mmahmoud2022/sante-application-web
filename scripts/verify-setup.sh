#!/bin/bash

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓${NC} $2"
    else
        echo -e "${RED}✗${NC} $2"
    fi
}

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_header() {
    echo ""
    echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
    echo ""
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

print_header "Santé Medical Application - Setup Verification"

# Check prerequisites
print_info "Checking prerequisites..."
echo ""

command_exists docker
print_status $? "Docker installed"

command_exists docker-compose
print_status $? "Docker Compose installed"

command_exists git
print_status $? "Git installed"

echo ""

# Check if .env file exists
if [ -f ".env" ]; then
    print_status 0 ".env file exists"
else
    print_status 1 ".env file missing"
    print_warning "Run: cp .env.example .env"
fi

echo ""

# Check Docker daemon
print_info "Checking Docker daemon..."
echo ""

if docker info >/dev/null 2>&1; then
    print_status 0 "Docker daemon is running"
else
    print_status 1 "Docker daemon is not running"
    print_warning "Start Docker Desktop or Docker daemon"
    exit 1
fi

echo ""

# Display URLs
print_header "Access URLs"

echo -e "${GREEN}Frontend:${NC}          http://localhost:3000"
echo -e "${GREEN}Backend API:${NC}       http://localhost:8000"
echo -e "${GREEN}API Documentation:${NC} http://localhost:8000/docs"
echo -e "${GREEN}ReDoc:${NC}             http://localhost:8000/redoc"
echo -e "${GREEN}Prometheus:${NC}        http://localhost:9090"
echo -e "${GREEN}Grafana:${NC}           http://localhost:3001 (admin/admin)"
echo -e "${GREEN}Kibana:${NC}            http://localhost:5601"
echo -e "${GREEN}Jaeger:${NC}            http://localhost:16686"

echo ""

# Display quick commands
print_header "Quick Commands"

echo "View logs:              docker-compose logs -f"
echo "Stop services:          docker-compose down"
echo "Restart services:       docker-compose restart"
echo "Run migrations:         docker-compose exec backend alembic upgrade head"
echo "Backend shell:          docker-compose exec backend /bin/bash"
echo "Database shell:         docker-compose exec postgres psql -U sante_user -d sante_db"
echo "Run tests:              docker-compose exec backend pytest"
echo ""
echo "Or use Makefile:        make help"

echo ""
print_header "Setup Verification Complete"
