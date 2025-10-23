#!/bin/bash

# Santé Application - K3s Deployment Script
# This script automates the deployment of Santé application to k3s cluster

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
NAMESPACE="sante"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Santé Application K3s Deployment${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Function to print colored messages
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if kubectl is installed
if ! command -v kubectl &> /dev/null; then
    print_error "kubectl is not installed. Please install it first."
    exit 1
fi

# Check if cluster is accessible
if ! kubectl cluster-info &> /dev/null; then
    print_error "Cannot connect to Kubernetes cluster. Please check your configuration."
    exit 1
fi

print_info "Kubernetes cluster is accessible"

# Check if namespace exists
if kubectl get namespace $NAMESPACE &> /dev/null; then
    print_warning "Namespace '$NAMESPACE' already exists"
else
    print_info "Creating namespace '$NAMESPACE'..."
    kubectl apply -f "$SCRIPT_DIR/00-namespace.yaml"
fi

# Apply configurations
print_info "Applying ConfigMap..."
kubectl apply -f "$SCRIPT_DIR/01-configmap.yaml"

print_info "Applying Secrets..."
print_warning "Make sure you've updated secrets in 02-secrets.yaml before production deployment!"
kubectl apply -f "$SCRIPT_DIR/02-secrets.yaml"

print_info "Creating Persistent Volume Claims..."
kubectl apply -f "$SCRIPT_DIR/03-pvc.yaml"

# Deploy databases
print_info "Deploying PostgreSQL..."
kubectl apply -f "$SCRIPT_DIR/04-postgres-deployment.yaml"

print_info "Deploying Redis..."
kubectl apply -f "$SCRIPT_DIR/05-redis-deployment.yaml"

# Wait for databases to be ready
print_info "Waiting for PostgreSQL to be ready..."
kubectl wait --for=condition=ready pod -l app=postgres -n $NAMESPACE --timeout=300s

print_info "Waiting for Redis to be ready..."
kubectl wait --for=condition=ready pod -l app=redis -n $NAMESPACE --timeout=300s

# Run database migrations
print_info "Running database migrations..."
# Give backend a moment to start even if it fails initially
kubectl apply -f "$SCRIPT_DIR/06-backend-deployment.yaml" || true
sleep 10

# Wait for at least one backend pod to be running
print_info "Waiting for backend pod to be available for migrations..."
for i in {1..30}; do
    if kubectl get pods -n $NAMESPACE -l app=backend --field-selector=status.phase=Running 2>/dev/null | grep -q backend; then
        break
    fi
    echo -n "."
    sleep 2
done
echo ""

# Run migrations
BACKEND_POD=$(kubectl get pods -n $NAMESPACE -l app=backend --field-selector=status.phase=Running -o jsonpath='{.items[0].metadata.name}' 2>/dev/null || echo "")
if [ ! -z "$BACKEND_POD" ]; then
    print_info "Running migrations on pod: $BACKEND_POD"
    kubectl exec -n $NAMESPACE $BACKEND_POD -- alembic upgrade head || print_warning "Migration failed, but continuing..."
else
    print_warning "No backend pod available yet. You may need to run migrations manually later."
    print_warning "Run: kubectl exec -it deployment/backend -n $NAMESPACE -- alembic upgrade head"
fi

# Deploy application services
print_info "Deploying Backend API..."
kubectl apply -f "$SCRIPT_DIR/06-backend-deployment.yaml"

print_info "Deploying Celery Worker..."
kubectl apply -f "$SCRIPT_DIR/07-celery-worker-deployment.yaml"

print_info "Deploying Celery Beat..."
kubectl apply -f "$SCRIPT_DIR/08-celery-beat-deployment.yaml"

print_info "Deploying Frontend..."
kubectl apply -f "$SCRIPT_DIR/09-frontend-deployment.yaml"

print_info "Configuring Ingress..."
kubectl apply -f "$SCRIPT_DIR/10-ingress.yaml"

# Wait for deployments
print_info "Waiting for deployments to be ready..."
echo ""

print_info "Waiting for backend deployment..."
kubectl wait --for=condition=available deployment/backend -n $NAMESPACE --timeout=300s || print_warning "Backend deployment timeout"

print_info "Waiting for frontend deployment..."
kubectl wait --for=condition=available deployment/frontend -n $NAMESPACE --timeout=300s || print_warning "Frontend deployment timeout"

print_info "Waiting for celery-worker deployment..."
kubectl wait --for=condition=available deployment/celery-worker -n $NAMESPACE --timeout=300s || print_warning "Celery worker deployment timeout"

# Display deployment status
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Deployment Status${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

print_info "Pods:"
kubectl get pods -n $NAMESPACE

echo ""
print_info "Services:"
kubectl get svc -n $NAMESPACE

echo ""
print_info "Ingress:"
kubectl get ingress -n $NAMESPACE

echo ""
print_info "Persistent Volume Claims:"
kubectl get pvc -n $NAMESPACE

# Display access information
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Access Information${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

INGRESS_HOST=$(kubectl get ingress -n $NAMESPACE -o jsonpath='{.items[0].spec.rules[0].host}' 2>/dev/null || echo "sante.local")
INGRESS_IP=$(kubectl get svc traefik -n kube-system -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>/dev/null || kubectl get nodes -o jsonpath='{.items[0].status.addresses[?(@.type=="InternalIP")].address}')

print_info "Frontend: http://$INGRESS_HOST"
print_info "Backend API: http://api.$INGRESS_HOST"
print_info "API Docs: http://api.$INGRESS_HOST/docs"
echo ""

if [ ! -z "$INGRESS_IP" ]; then
    print_info "Add this to your /etc/hosts file:"
    echo "  $INGRESS_IP $INGRESS_HOST api.$INGRESS_HOST"
fi

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Deployment Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

print_info "To view logs:"
echo "  kubectl logs -f deployment/backend -n $NAMESPACE"
echo "  kubectl logs -f deployment/frontend -n $NAMESPACE"
echo ""

print_info "To run migrations manually (if needed):"
echo "  kubectl exec -it deployment/backend -n $NAMESPACE -- alembic upgrade head"
echo ""

print_info "To delete the deployment:"
echo "  kubectl delete namespace $NAMESPACE"
echo ""
