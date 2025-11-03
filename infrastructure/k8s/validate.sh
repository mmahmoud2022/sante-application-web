#!/bin/bash

# Santé Application - Manifest Validation Script
# This script validates all Kubernetes manifests

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Kubernetes Manifest Validation${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

# Check if kubectl is installed
if ! command -v kubectl &> /dev/null; then
    print_error "kubectl is not installed. Please install it first."
    exit 1
fi

# Check if cluster is accessible
if ! kubectl cluster-info &> /dev/null; then
    print_error "Cannot connect to Kubernetes cluster. Skipping cluster validation."
    print_info "Will only perform YAML syntax validation."
    CLUSTER_AVAILABLE=false
else
    print_success "Kubernetes cluster is accessible"
    CLUSTER_AVAILABLE=true
fi

echo ""
print_info "Validating manifest files..."
echo ""

FAILED=0

for file in "$SCRIPT_DIR"/*.yaml; do
    filename=$(basename "$file")
    
    # Skip kustomization.yaml for kubectl validation
    if [ "$filename" == "kustomization.yaml" ]; then
        echo "Skipping $filename (kustomization file)"
        continue
    fi
    
    echo -n "Validating $filename... "
    
    if [ "$CLUSTER_AVAILABLE" = true ]; then
        # Validate with kubectl if cluster is available
        if kubectl apply --dry-run=client -f "$file" > /dev/null 2>&1; then
            print_success "OK"
        else
            print_error "FAILED"
            kubectl apply --dry-run=client -f "$file" 2>&1 | head -5
            FAILED=$((FAILED + 1))
        fi
    else
        # Just check YAML syntax
        if python3 -c "import yaml; list(yaml.safe_load_all(open('$file')))" 2>/dev/null; then
            print_success "OK (syntax only)"
        else
            print_error "FAILED"
            python3 -c "import yaml; list(yaml.safe_load_all(open('$file')))" 2>&1
            FAILED=$((FAILED + 1))
        fi
    fi
done

echo ""

if [ $FAILED -eq 0 ]; then
    print_success "All manifests are valid!"
    exit 0
else
    print_error "$FAILED manifest(s) failed validation"
    exit 1
fi
