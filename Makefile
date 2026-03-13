# STEP Clone Docker Management
# Use this Makefile for easy Docker operations

.PHONY: help up down build logs restart clean tools status health

# Default target
help:
	@echo "🚀 STEP Clone Docker Management"
	@echo ""
	@echo "Available commands:"
	@echo "  make up      - Start all services (PostgreSQL, Redis, App)"
	@echo "  make down    - Stop all services"
	@echo "  make build   - Rebuild the application container"
	@echo "  make logs    - View application logs (follow mode)"
	@echo "  make restart - Restart the application container"
	@echo "  make clean   - Stop services and remove all data"
	@echo "  make tools   - Start database admin tools (PgAdmin, Redis Commander)"
	@echo "  make status  - Show container status"
	@echo "  make health  - Check application health"
	@echo ""
	@echo "🌐 Service URLs after 'make up':"
	@echo "  API Server:       http://localhost:3000"
	@echo "  Health Check:     http://localhost:3000/health"
	@echo "  API Docs:         http://localhost:3000/api"
	@echo ""
	@echo "🛠  Admin Tools (after 'make tools'):"
	@echo "  PgAdmin:          http://localhost:8080"
	@echo "  Redis Commander:  http://localhost:8081"

up:
	@echo "🚀 Starting STEP Clone services..."
	docker-compose -f docker-compose-local.yml up -d
	@echo "✅ Services started! Check status with 'make status'"
	@echo "🌐 API available at: http://localhost:3000"

down:
	@echo "🛑 Stopping STEP Clone services..."
	docker-compose -f docker-compose-local.yml down

build:
	@echo "🔨 Building STEP Clone application..."
	docker-compose -f docker-compose-local.yml build app
	@echo "✅ Build complete!"

logs:
	@echo "📋 Following application logs (Ctrl+C to exit)..."
	docker-compose -f docker-compose-local.yml logs -f app

restart:
	@echo "🔄 Restarting application container..."
	docker-compose -f docker-compose-local.yml restart app
	@echo "✅ Application restarted!"

clean:
	@echo "🧹 Cleaning up all containers and data..."
	@echo "⚠️  This will delete all database data!"
	@read -p "Continue? (y/N): " confirm && [ "$$confirm" = "y" ]
	docker-compose -f docker-compose-local.yml down -v --remove-orphans
	docker system prune -f
	@echo "✅ Cleanup complete!"

tools:
	@echo "🛠  Starting admin tools..."
	docker-compose -f docker-compose-local.yml --profile tools up -d pgadmin redis-commander
	@echo "✅ Admin tools started!"
	@echo "🔗 PgAdmin:          http://localhost:8080 (admin@stepclone.com / admin123)"
	@echo "🔗 Redis Commander:  http://localhost:8081 (admin / admin123)"

status:
	@echo "📊 Container Status:"
	docker-compose -f docker-compose-local.yml ps

health:
	@echo "🏥 Checking application health..."
	@curl -s http://localhost:3000/health | jq '.' 2>/dev/null || curl -s http://localhost:3000/health || echo "❌ Health check failed - is the app running?"

# Quick setup target
setup: up
	@echo "⏳ Waiting for services to be ready..."
	@sleep 10
	@echo "🏥 Checking health..."
	@make health
	@echo ""
	@echo "🎉 STEP Clone is ready!"
	@echo "📖 Demo users:"
	@echo "   demo@stepclone.com / demo123456"
	@echo "   admin@stepclone.com / admin123456"

# Development workflow
dev: build up logs

# Show database connection info
db-info:
	@echo "📊 Database Connection Info:"
	@echo "  Host:     localhost"
	@echo "  Port:     5432"
	@echo "  Database: step_clone"
	@echo "  Username: stepuser"
	@echo "  Password: steppass123"
	@echo ""
	@echo "🔗 Connection String:"
	@echo "  postgresql://stepuser:steppass123@localhost:5432/step_clone"