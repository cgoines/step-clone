# Docker Setup for STEP Clone

This document provides instructions for running STEP Clone entirely in Docker containers, including the API, admin dashboard, and user portal.

## Architecture

The Docker setup includes the following services:

- **PostgreSQL Database** (`postgres`) - Port 5432
- **Redis Cache** (`redis`) - Port 6379
- **STEP Clone API** (`app`) - Port 9999
- **Admin Dashboard** (`admin-frontend`) - Port 3001
- **User Portal** (`user-portal`) - Port 3002
- **Database Setup** (`db-setup`) - One-time migration/seeding

## Quick Start

### 1. Stop Standalone Services

First, stop any standalone Node.js services that might be running:

```bash
# Stop any running dev servers
pkill -f "npm run dev"
pkill -f "node server.js"
```

### 2. Start All Services

```bash
# Build and start all containers
docker-compose -f docker-compose-local.yml up -d

# View logs
docker-compose -f docker-compose-local.yml logs -f
```

### 3. Access Applications

- **User Portal**: http://localhost:3002
- **Admin Dashboard**: http://localhost:3001
- **API Health**: http://localhost:9999/health
- **API Documentation**: http://localhost:9999/api

## Service Details

### API Service (`app`)
- **Container**: `step-clone-app`
- **Port**: 9999:3000 (host:container)
- **Health Check**: Built-in health monitoring
- **Features**:
  - Password reset functionality
  - Email change verification
  - Travel alerts and plans
  - User authentication
  - Country risk assessment

### Admin Dashboard (`admin-frontend`)
- **Container**: `step-clone-admin-frontend`
- **Port**: 3001:3001
- **Features**:
  - Travel alerts management with world map
  - User management
  - Country risk level management
  - Notifications system
  - Analytics dashboard
- **Development**: Hot reloading enabled

### User Portal (`user-portal`)
- **Container**: `step-clone-user-portal`
- **Port**: 3002:3002
- **Features**:
  - User dashboard with global travel alerts map
  - Global risk assessment world map
  - Travel plans management
  - Profile management with email change
  - Password reset functionality
  - Travel alerts viewing
- **Development**: Hot reloading enabled

## Development Workflow

### Hot Reloading

Both frontend applications support hot reloading in Docker:

```bash
# Edit files in:
# - frontend/admin-dashboard/src/
# - frontend/user-portal/src/

# Changes automatically reload in containers
```

### View Logs

```bash
# All services
docker-compose -f docker-compose-local.yml logs -f

# Specific service
docker-compose -f docker-compose-local.yml logs -f app
docker-compose -f docker-compose-local.yml logs -f admin-frontend
docker-compose -f docker-compose-local.yml logs -f user-portal
```

### Rebuild Services

```bash
# Rebuild all
docker-compose -f docker-compose-local.yml build

# Rebuild specific service
docker-compose -f docker-compose-local.yml build app
docker-compose -f docker-compose-local.yml build admin-frontend
```

## Database Management

### Initialize Database

```bash
# Run migrations and seeding
docker-compose -f docker-compose-local.yml up db-setup
```

### Access Database

```bash
# Connect to PostgreSQL
docker exec -it step-clone-postgres psql -U stepuser -d step_clone

# Example queries
\dt                                    # List tables
SELECT count(*) FROM users;           # Count users
SELECT count(*) FROM alerts;          # Count alerts
SELECT count(*) FROM countries;       # Count countries
```

## Environment Configuration

### API Environment Variables

Key environment variables for the API service:

```yaml
DATABASE_URL: postgresql://stepuser:steppass123@postgres:5432/step_clone
REDIS_URL: redis://redis:6379
FRONTEND_URL: http://localhost:3001,http://localhost:3002
JWT_SECRET: your-super-secret-jwt-key-here
TWILIO_ACCOUNT_SID: your-twilio-account-sid
TWILIO_AUTH_TOKEN: your-twilio-auth-token
```

### Frontend Environment Variables

Both frontends use:

```yaml
VITE_API_URL: http://localhost:9999/api          # External API access
VITE_API_PROXY_TARGET: http://app:3000           # Internal Docker proxy
```

## Demo Credentials

### User Portal Demo Accounts

- **Primary**: `demo@stepclone.com` / `demo123456`
- **Alternative**: `demo2@stepclone.com` / `demo1234`

### Admin Dashboard

- **Admin**: `admin@stepclone.com` / `admin123456`

## Troubleshooting

### Service Won't Start

```bash
# Check service status
docker-compose -f docker-compose-local.yml ps

# Check specific service logs
docker-compose -f docker-compose-local.yml logs service-name

# Restart specific service
docker-compose -f docker-compose-local.yml restart service-name
```

### Database Connection Issues

```bash
# Check database is running
docker-compose -f docker-compose-local.yml ps postgres

# Check database logs
docker-compose -f docker-compose-local.yml logs postgres

# Verify connection
docker exec step-clone-postgres pg_isready -U stepuser
```

### Frontend Build Issues

```bash
# Clean rebuild frontend
docker-compose -f docker-compose-local.yml build --no-cache admin-frontend
docker-compose -f docker-compose-local.yml build --no-cache user-portal

# Check frontend logs
docker-compose -f docker-compose-local.yml logs -f admin-frontend
docker-compose -f docker-compose-local.yml logs -f user-portal
```

### Port Conflicts

If ports are in use:

```bash
# Find processes using ports
lsof -i :3001
lsof -i :3002
lsof -i :9999

# Kill conflicting processes
kill <PID>
```

## Stopping Services

```bash
# Stop all containers
docker-compose -f docker-compose-local.yml down

# Stop and remove volumes (⚠️ destroys data)
docker-compose -f docker-compose-local.yml down -v

# Stop specific service
docker-compose -f docker-compose-local.yml stop service-name
```

## Production Considerations

For production deployment:

1. Use separate `docker-compose.prod.yml`
2. Enable SSL/TLS termination
3. Use production-optimized images
4. Configure proper secrets management
5. Set up health monitoring
6. Configure backup strategies
7. Use production database with replication

## Network Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   User Portal   │    │ Admin Dashboard  │    │   External      │
│  localhost:3002 │    │  localhost:3001  │    │   Users         │
└─────────┬───────┘    └─────────┬────────┘    └─────────┬───────┘
          │                      │                       │
          │              ┌───────┴───────────────────────┴───────┐
          │              │         Docker Network                │
          │              │      (step-clone-network)             │
          └──────────────┴─────────────┬─────────────────────────┘
                                       │
                         ┌─────────────┴─────────────┐
                         │      STEP Clone API       │
                         │    (app:3000/9999)        │
                         └─────────────┬─────────────┘
                                       │
                         ┌─────────────┴─────────────┐
                         │     PostgreSQL + Redis    │
                         │   (postgres:5432)         │
                         │   (redis:6379)            │
                         └───────────────────────────┘
```

This setup provides a complete development environment with all services running in Docker containers, hot reloading for frontend development, and proper service-to-service communication.