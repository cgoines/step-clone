#!/bin/bash

# Docker Development Script for STEP Clone
# This script helps manage the transition from standalone to containerized development

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}================================${NC}"
}

# Function to stop standalone services
stop_standalone() {
    print_header "Stopping Standalone Services"

    # Stop Node.js development servers
    print_status "Stopping Node.js development servers..."
    pkill -f "npm run dev" 2>/dev/null || true
    pkill -f "node server.js" 2>/dev/null || true
    pkill -f "vite" 2>/dev/null || true

    # Check for specific ports and kill processes
    for port in 3001 3002 3003 9999; do
        if lsof -ti :$port >/dev/null 2>&1; then
            print_warning "Killing process on port $port..."
            lsof -ti :$port | xargs kill -9 2>/dev/null || true
        fi
    done

    print_status "Standalone services stopped"
}

# Function to start Docker services
start_docker() {
    print_header "Starting Docker Services"

    # Check if Docker is running
    if ! docker info >/dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker Desktop first."
        exit 1
    fi

    # Stop any existing containers
    print_status "Stopping existing containers..."
    docker-compose -f docker-compose-local.yml down 2>/dev/null || true

    # Build and start services
    print_status "Building and starting all services..."
    docker-compose -f docker-compose-local.yml up -d --build

    # Wait for services to be ready
    print_status "Waiting for services to be ready..."
    sleep 10

    # Check service health
    check_services
}

# Function to check service health
check_services() {
    print_header "Checking Service Health"

    # Check API health
    for i in {1..30}; do
        if curl -s http://localhost:9999/health >/dev/null 2>&1; then
            print_status "✅ API service is healthy"
            break
        elif [ $i -eq 30 ]; then
            print_warning "⚠️  API service health check timeout"
        else
            echo -n "."
            sleep 2
        fi
    done

    # Check frontend services
    for port in 3001 3002; do
        if curl -s http://localhost:$port >/dev/null 2>&1; then
            print_status "✅ Frontend service on port $port is responding"
        else
            print_warning "⚠️  Frontend service on port $port not responding"
        fi
    done
}

# Function to show service status
show_status() {
    print_header "Service Status"

    echo ""
    docker-compose -f docker-compose-local.yml ps

    print_header "Access URLs"
    echo -e "User Portal:      ${BLUE}http://localhost:3002${NC}"
    echo -e "Admin Dashboard:  ${BLUE}http://localhost:3001${NC}"
    echo -e "API Health:       ${BLUE}http://localhost:9999/health${NC}"
    echo -e "API Docs:         ${BLUE}http://localhost:9999/api${NC}"
    echo ""

    print_header "Demo Credentials"
    echo -e "User Portal:  demo@stepclone.com / demo123456"
    echo -e "Admin Panel:  admin@stepclone.com / admin123456"
    echo ""
}

# Function to show logs
show_logs() {
    print_header "Service Logs"

    if [ -n "$1" ]; then
        print_status "Showing logs for service: $1"
        docker-compose -f docker-compose-local.yml logs -f "$1"
    else
        print_status "Showing logs for all services (Ctrl+C to exit)"
        docker-compose -f docker-compose-local.yml logs -f
    fi
}

# Function to stop Docker services
stop_docker() {
    print_header "Stopping Docker Services"

    docker-compose -f docker-compose-local.yml down
    print_status "All Docker services stopped"
}

# Function to restart specific service
restart_service() {
    if [ -z "$1" ]; then
        print_error "Please specify a service name"
        echo "Available services: app, admin-frontend, user-portal, postgres, redis"
        exit 1
    fi

    print_header "Restarting Service: $1"

    docker-compose -f docker-compose-local.yml restart "$1"
    print_status "Service $1 restarted"
}

# Function to rebuild service
rebuild_service() {
    if [ -z "$1" ]; then
        print_error "Please specify a service name"
        echo "Available services: app, admin-frontend, user-portal"
        exit 1
    fi

    print_header "Rebuilding Service: $1"

    docker-compose -f docker-compose-local.yml build --no-cache "$1"
    docker-compose -f docker-compose-local.yml up -d "$1"
    print_status "Service $1 rebuilt and started"
}

# Main script logic
case "${1:-start}" in
    "start")
        stop_standalone
        start_docker
        show_status
        ;;
    "stop")
        stop_docker
        ;;
    "status")
        show_status
        ;;
    "logs")
        show_logs "$2"
        ;;
    "restart")
        restart_service "$2"
        ;;
    "rebuild")
        rebuild_service "$2"
        ;;
    "clean")
        print_header "Clean Restart"
        stop_standalone
        docker-compose -f docker-compose-local.yml down -v
        start_docker
        show_status
        ;;
    *)
        echo "Usage: $0 {start|stop|status|logs|restart|rebuild|clean} [service-name]"
        echo ""
        echo "Commands:"
        echo "  start           - Stop standalone services and start Docker containers"
        echo "  stop            - Stop all Docker containers"
        echo "  status          - Show service status and access URLs"
        echo "  logs [service]  - Show logs (all services or specific service)"
        echo "  restart <svc>   - Restart specific service"
        echo "  rebuild <svc>   - Rebuild and restart specific service"
        echo "  clean           - Clean restart (removes volumes)"
        echo ""
        echo "Services: app, admin-frontend, user-portal, postgres, redis"
        exit 1
        ;;
esac