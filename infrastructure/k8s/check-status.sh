#!/bin/bash

# Santé Application - Health Check Script
# This script checks the status of all components in the k3s cluster

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
NAMESPACE="sante"

# Function to print colored messages
print_header() {
    echo ""
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
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

print_header "Santé Application Status Check"

# Check namespace
print_info "Checking namespace..."
if kubectl get namespace $NAMESPACE &> /dev/null; then
    print_success "Namespace '$NAMESPACE' exists"
else
    print_error "Namespace '$NAMESPACE' not found"
    exit 1
fi

# Check ConfigMap
print_info "Checking ConfigMap..."
if kubectl get configmap sante-config -n $NAMESPACE &> /dev/null; then
    print_success "ConfigMap exists"
else
    print_error "ConfigMap not found"
fi

# Check Secrets
print_info "Checking Secrets..."
if kubectl get secret sante-secrets -n $NAMESPACE &> /dev/null; then
    print_success "Secrets exist"
else
    print_error "Secrets not found"
fi

# Check PVCs
print_header "Persistent Volume Claims"
kubectl get pvc -n $NAMESPACE 2>/dev/null || print_warning "No PVCs found"

# Check Pods
print_header "Pod Status"
PODS=$(kubectl get pods -n $NAMESPACE --no-headers 2>/dev/null || echo "")

if [ -z "$PODS" ]; then
    print_warning "No pods found"
else
    while IFS= read -r line; do
        POD_NAME=$(echo $line | awk '{print $1}')
        POD_STATUS=$(echo $line | awk '{print $3}')
        POD_READY=$(echo $line | awk '{print $2}')
        
        if [ "$POD_STATUS" == "Running" ]; then
            print_success "$POD_NAME: $POD_STATUS ($POD_READY)"
        elif [ "$POD_STATUS" == "Pending" ]; then
            print_warning "$POD_NAME: $POD_STATUS ($POD_READY)"
        else
            print_error "$POD_NAME: $POD_STATUS ($POD_READY)"
        fi
    done <<< "$PODS"
fi

# Check Deployments
print_header "Deployment Status"
DEPLOYMENTS=$(kubectl get deployments -n $NAMESPACE --no-headers 2>/dev/null || echo "")

if [ -z "$DEPLOYMENTS" ]; then
    print_warning "No deployments found"
else
    while IFS= read -r line; do
        DEPLOY_NAME=$(echo $line | awk '{print $1}')
        DEPLOY_READY=$(echo $line | awk '{print $2}')
        DEPLOY_UP_TO_DATE=$(echo $line | awk '{print $3}')
        DEPLOY_AVAILABLE=$(echo $line | awk '{print $4}')
        
        READY_COUNT=$(echo $DEPLOY_READY | cut -d'/' -f1)
        DESIRED_COUNT=$(echo $DEPLOY_READY | cut -d'/' -f2)
        
        if [ "$READY_COUNT" == "$DESIRED_COUNT" ] && [ "$DEPLOY_AVAILABLE" != "0" ]; then
            print_success "$DEPLOY_NAME: $DEPLOY_READY ready"
        else
            print_warning "$DEPLOY_NAME: $DEPLOY_READY ready"
        fi
    done <<< "$DEPLOYMENTS"
fi

# Check Services
print_header "Service Status"
kubectl get svc -n $NAMESPACE 2>/dev/null || print_warning "No services found"

# Check Ingress
print_header "Ingress Status"
INGRESS=$(kubectl get ingress -n $NAMESPACE --no-headers 2>/dev/null || echo "")

if [ -z "$INGRESS" ]; then
    print_warning "No ingress found"
else
    while IFS= read -r line; do
        INGRESS_NAME=$(echo $line | awk '{print $1}')
        INGRESS_HOSTS=$(echo $line | awk '{print $3}')
        
        print_success "$INGRESS_NAME: $INGRESS_HOSTS"
    done <<< "$INGRESS"
fi

# Check connectivity
print_header "Connectivity Tests"

# Get backend pod
BACKEND_POD=$(kubectl get pods -n $NAMESPACE -l app=backend --field-selector=status.phase=Running -o jsonpath='{.items[0].metadata.name}' 2>/dev/null || echo "")

if [ ! -z "$BACKEND_POD" ]; then
    print_info "Testing PostgreSQL connectivity from backend..."
    if kubectl exec -n $NAMESPACE $BACKEND_POD -- nc -zv postgres 5432 &> /dev/null; then
        print_success "Backend can connect to PostgreSQL"
    else
        print_error "Backend cannot connect to PostgreSQL"
    fi
    
    print_info "Testing Redis connectivity from backend..."
    if kubectl exec -n $NAMESPACE $BACKEND_POD -- nc -zv redis 6379 &> /dev/null; then
        print_success "Backend can connect to Redis"
    else
        print_error "Backend cannot connect to Redis"
    fi
else
    print_warning "No backend pod available for connectivity tests"
fi

# Check for recent errors
print_header "Recent Events (Errors/Warnings)"
EVENTS=$(kubectl get events -n $NAMESPACE --sort-by='.lastTimestamp' --field-selector type!=Normal 2>/dev/null | tail -10)

if [ -z "$EVENTS" ] || [ "$(echo "$EVENTS" | wc -l)" -eq 1 ]; then
    print_success "No recent errors or warnings"
else
    echo "$EVENTS"
fi

# Resource usage
print_header "Resource Usage"
print_info "Top Pods by CPU and Memory:"
kubectl top pods -n $NAMESPACE 2>/dev/null || print_warning "Metrics server not available"

# Summary
print_header "Summary"

TOTAL_PODS=$(kubectl get pods -n $NAMESPACE --no-headers 2>/dev/null | wc -l)
RUNNING_PODS=$(kubectl get pods -n $NAMESPACE --no-headers --field-selector=status.phase=Running 2>/dev/null | wc -l)
PENDING_PODS=$(kubectl get pods -n $NAMESPACE --no-headers --field-selector=status.phase=Pending 2>/dev/null | wc -l)
FAILED_PODS=$(kubectl get pods -n $NAMESPACE --no-headers --field-selector=status.phase=Failed 2>/dev/null | wc -l)

echo "Total Pods: $TOTAL_PODS"
echo "  Running: $RUNNING_PODS"
echo "  Pending: $PENDING_PODS"
echo "  Failed: $FAILED_PODS"

if [ $RUNNING_PODS -eq $TOTAL_PODS ] && [ $TOTAL_PODS -gt 0 ]; then
    echo ""
    print_success "All pods are running!"
elif [ $PENDING_PODS -gt 0 ]; then
    echo ""
    print_warning "Some pods are still pending"
elif [ $FAILED_PODS -gt 0 ]; then
    echo ""
    print_error "Some pods have failed"
fi

# Access information
INGRESS_HOST=$(kubectl get ingress -n $NAMESPACE -o jsonpath='{.items[0].spec.rules[0].host}' 2>/dev/null || echo "sante.local")

echo ""
print_header "Access Information"
echo "Frontend: http://$INGRESS_HOST"
echo "Backend API: http://api.$INGRESS_HOST"
echo "API Docs: http://api.$INGRESS_HOST/docs"

echo ""
print_info "Useful commands:"
echo "  View logs: kubectl logs -f deployment/backend -n $NAMESPACE"
echo "  Shell access: kubectl exec -it deployment/backend -n $NAMESPACE -- /bin/bash"
echo "  Port forward: kubectl port-forward svc/backend 8000:8000 -n $NAMESPACE"

echo ""
