#!/bin/bash

# E2E Test Helper Script
# Usage: ./run-e2e-tests.sh [options]

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Default values
BROWSER="chrome"
HEADLESS=false
SPEC=""
ENV="development"
PARALLEL=false

# Functions
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

show_help() {
    cat << EOF
E2E Test Helper Script

Usage: ./run-e2e-tests.sh [options]

Options:
    -b, --browser <name>     Browser to use (chrome, firefox, edge) [default: chrome]
    -h, --headless          Run tests in headless mode
    -s, --spec <path>       Run specific test file
    -e, --env <name>        Environment (development, staging, production) [default: development]
    -p, --parallel          Run tests in parallel
    --help                  Show this help message

Examples:
    ./run-e2e-tests.sh                                    # Run all tests in chrome
    ./run-e2e-tests.sh -b firefox -h                      # Run in firefox headless
    ./run-e2e-tests.sh -s cypress/e2e/auth.cy.ts          # Run specific test
    ./run-e2e-tests.sh -e staging -p                      # Run in staging with parallel mode

EOF
}

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -b|--browser)
            BROWSER="$2"
            shift 2
            ;;
        -h|--headless)
            HEADLESS=true
            shift
            ;;
        -s|--spec)
            SPEC="$2"
            shift 2
            ;;
        -e|--env)
            ENV="$2"
            shift 2
            ;;
        -p|--parallel)
            PARALLEL=true
            shift
            ;;
        --help)
            show_help
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# Check if we're in the frontend directory
if [ ! -f "package.json" ]; then
    print_error "Please run this script from the frontend directory"
    exit 1
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    print_warning "node_modules not found. Installing dependencies..."
    npm install
fi

# Set environment variables based on ENV
case $ENV in
    development)
        export CYPRESS_baseUrl="http://localhost:3000"
        export CYPRESS_apiUrl="http://localhost:8000/api/v1"
        ;;
    staging)
        export CYPRESS_baseUrl="https://staging.sante-app.com"
        export CYPRESS_apiUrl="https://api.staging.sante-app.com/api/v1"
        ;;
    production)
        export CYPRESS_baseUrl="https://sante-app.com"
        export CYPRESS_apiUrl="https://api.sante-app.com/api/v1"
        ;;
    *)
        print_error "Unknown environment: $ENV"
        exit 1
        ;;
esac

print_info "Running E2E tests with following configuration:"
echo "  Browser: $BROWSER"
echo "  Headless: $HEADLESS"
echo "  Environment: $ENV"
echo "  Base URL: $CYPRESS_baseUrl"
echo "  API URL: $CYPRESS_apiUrl"
if [ -n "$SPEC" ]; then
    echo "  Spec: $SPEC"
fi
echo ""

# Build the Cypress command
CYPRESS_CMD="npx cypress"

if [ "$HEADLESS" = true ]; then
    CYPRESS_CMD="$CYPRESS_CMD run"
else
    CYPRESS_CMD="$CYPRESS_CMD open"
fi

CYPRESS_CMD="$CYPRESS_CMD --browser $BROWSER"

if [ -n "$SPEC" ]; then
    CYPRESS_CMD="$CYPRESS_CMD --spec $SPEC"
fi

if [ "$PARALLEL" = true ] && [ "$HEADLESS" = true ]; then
    CYPRESS_CMD="$CYPRESS_CMD --parallel"
fi

# Check if services are running (for development)
if [ "$ENV" = "development" ]; then
    print_info "Checking if services are running..."
    
    if ! curl -s http://localhost:3000 > /dev/null; then
        print_warning "Frontend is not running on http://localhost:3000"
        print_info "Starting frontend..."
        npm run dev &
        FRONTEND_PID=$!
        sleep 5
    fi
    
    if ! curl -s http://localhost:8000/api/v1/health > /dev/null; then
        print_warning "Backend is not running on http://localhost:8000"
        print_info "Please start the backend server first"
        print_info "cd ../backend && uvicorn app.main:app --reload"
    fi
fi

# Run Cypress
print_info "Running Cypress tests..."
eval $CYPRESS_CMD

EXIT_CODE=$?

# Cleanup
if [ -n "$FRONTEND_PID" ]; then
    print_info "Stopping frontend server..."
    kill $FRONTEND_PID
fi

if [ $EXIT_CODE -eq 0 ]; then
    print_info "✅ All tests passed!"
else
    print_error "❌ Some tests failed"
fi

exit $EXIT_CODE
