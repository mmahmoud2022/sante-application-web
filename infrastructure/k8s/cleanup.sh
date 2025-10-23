#!/bin/bash

# Santé Application - Cleanup Script
# This script removes all Santé application resources from k3s cluster

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
NAMESPACE="sante"

echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}  Santé Application Cleanup${NC}"
echo -e "${YELLOW}========================================${NC}"
echo ""

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if kubectl is installed
if ! command -v kubectl &> /dev/null; then
    print_error "kubectl is not installed"
    exit 1
fi

# Check if cluster is accessible
if ! kubectl cluster-info &> /dev/null; then
    print_error "Cannot connect to Kubernetes cluster"
    exit 1
fi

# Check if namespace exists
if ! kubectl get namespace $NAMESPACE &> /dev/null; then
    print_warning "Namespace '$NAMESPACE' does not exist. Nothing to clean up."
    exit 0
fi

echo -e "${RED}WARNING: This will delete all Santé application resources including:${NC}"
echo "  - All deployments and pods"
echo "  - All services"
echo "  - All ingress rules"
echo "  - ConfigMaps and Secrets"
echo "  - Persistent Volume Claims (DATA WILL BE LOST!)"
echo ""

read -p "Are you sure you want to continue? (yes/no): " -r
echo

if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    print_info "Cleanup cancelled"
    exit 0
fi

echo ""
print_info "Starting cleanup..."
echo ""

# Delete in reverse order of dependencies

print_info "Deleting Ingress..."
kubectl delete ingress --all -n $NAMESPACE 2>/dev/null || print_warning "No ingress found"

print_info "Deleting Frontend..."
kubectl delete deployment frontend -n $NAMESPACE 2>/dev/null || print_warning "Frontend deployment not found"
kubectl delete service frontend -n $NAMESPACE 2>/dev/null || print_warning "Frontend service not found"

print_info "Deleting Celery Beat..."
kubectl delete deployment celery-beat -n $NAMESPACE 2>/dev/null || print_warning "Celery beat deployment not found"

print_info "Deleting Celery Worker..."
kubectl delete deployment celery-worker -n $NAMESPACE 2>/dev/null || print_warning "Celery worker deployment not found"

print_info "Deleting Backend..."
kubectl delete deployment backend -n $NAMESPACE 2>/dev/null || print_warning "Backend deployment not found"
kubectl delete service backend -n $NAMESPACE 2>/dev/null || print_warning "Backend service not found"

print_info "Deleting Redis..."
kubectl delete deployment redis -n $NAMESPACE 2>/dev/null || print_warning "Redis deployment not found"
kubectl delete service redis -n $NAMESPACE 2>/dev/null || print_warning "Redis service not found"

print_info "Deleting PostgreSQL..."
kubectl delete deployment postgres -n $NAMESPACE 2>/dev/null || print_warning "Postgres deployment not found"
kubectl delete service postgres -n $NAMESPACE 2>/dev/null || print_warning "Postgres service not found"

# Wait for pods to terminate
print_info "Waiting for pods to terminate..."
kubectl wait --for=delete pod --all -n $NAMESPACE --timeout=60s 2>/dev/null || print_warning "Some pods may still be terminating"

echo ""
read -p "Delete Persistent Volume Claims? This will DELETE ALL DATA! (yes/no): " -r
echo

if [[ $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    print_info "Deleting Persistent Volume Claims..."
    kubectl delete pvc --all -n $NAMESPACE 2>/dev/null || print_warning "No PVCs found"
else
    print_warning "Keeping Persistent Volume Claims. Data is preserved."
fi

print_info "Deleting ConfigMap and Secrets..."
kubectl delete configmap sante-config -n $NAMESPACE 2>/dev/null || print_warning "ConfigMap not found"
kubectl delete secret sante-secrets -n $NAMESPACE 2>/dev/null || print_warning "Secrets not found"

echo ""
read -p "Delete namespace '$NAMESPACE'? (yes/no): " -r
echo

if [[ $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    print_info "Deleting namespace..."
    kubectl delete namespace $NAMESPACE
    print_info "Namespace deleted"
else
    print_warning "Keeping namespace '$NAMESPACE'"
fi

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Cleanup Complete${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

print_info "Santé application has been removed from the cluster"
echo ""
