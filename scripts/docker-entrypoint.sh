#!/bin/sh

# Docker entrypoint script for STEP Clone
# This script handles initialization tasks for the containerized application

set -e

echo "🚀 Starting STEP Clone application..."

# Function to wait for a service to be ready
wait_for_service() {
    local host=$1
    local port=$2
    local service_name=$3

    echo "⏳ Waiting for $service_name ($host:$port) to be ready..."

    until nc -z $host $port; do
        echo "   $service_name is not ready yet. Waiting..."
        sleep 2
    done

    echo "✅ $service_name is ready!"
}

# Function to test database connection
test_db_connection() {
    echo "🔍 Testing database connection..."

    # Extract DB details from DATABASE_URL
    # Format: postgresql://user:pass@host:port/dbname
    DB_USER=$(echo $DATABASE_URL | sed -n 's/.*\/\/\([^:]*\):.*/\1/p')
    DB_HOST=$(echo $DATABASE_URL | sed -n 's/.*@\([^:]*\):.*/\1/p')
    DB_PORT=$(echo $DATABASE_URL | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
    DB_NAME=$(echo $DATABASE_URL | sed -n 's/.*\/\([^?]*\).*/\1/p')

    # Use pg_isready if available
    if command -v pg_isready >/dev/null 2>&1; then
        until pg_isready -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME; do
            echo "   Database not ready. Waiting..."
            sleep 2
        done
    else
        # Fallback to simple port check
        wait_for_service $DB_HOST $DB_PORT "PostgreSQL"
    fi

    echo "✅ Database connection successful!"
}

# Function to test Redis connection
test_redis_connection() {
    if [ -n "$REDIS_URL" ]; then
        echo "🔍 Testing Redis connection..."

        # Extract Redis details from REDIS_URL
        REDIS_HOST=$(echo $REDIS_URL | sed -n 's/.*\/\/\([^:]*\):.*/\1/p')
        REDIS_PORT=$(echo $REDIS_URL | sed -n 's/.*:\([0-9]*\).*/\1/p')

        # Default to localhost:6379 if parsing fails
        REDIS_HOST=${REDIS_HOST:-localhost}
        REDIS_PORT=${REDIS_PORT:-6379}

        wait_for_service $REDIS_HOST $REDIS_PORT "Redis"
    fi
}

# Main initialization
main() {
    echo "📋 Environment: $NODE_ENV"
    echo "🌐 Port: $PORT"

    # Wait for dependencies if not in development mode
    if [ "$NODE_ENV" != "development" ] || [ "$WAIT_FOR_DEPS" = "true" ]; then
        test_db_connection
        test_redis_connection
    fi

    # Create logs directory if it doesn't exist
    mkdir -p logs

    echo "🎯 All dependencies ready. Starting application..."

    # Execute the main command
    exec "$@"
}

# Check if netcat is available for port checking
if ! command -v nc >/dev/null 2>&1; then
    echo "⚠️  Warning: netcat (nc) not available. Skipping dependency checks."
fi

# Run main function with all arguments
main "$@"