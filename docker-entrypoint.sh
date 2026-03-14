#!/bin/bash
set -e

# Karen2 Unified Container Entrypoint
# Starts both backend (Bun) and nginx

echo "=== Starting Karen2 Unified Container ==="

# Function to cleanup processes on exit
cleanup() {
    echo "=== Shutting down... ==="
    if [ -n "$BACKEND_PID" ]; then
        echo "Stopping backend (PID: $BACKEND_PID)..."
        kill -TERM "$BACKEND_PID" 2>/dev/null || true
        wait "$BACKEND_PID" 2>/dev/null || true
    fi
    echo "Stopping nginx..."
    nginx -s quit 2>/dev/null || true
    exit 0
}

# Set up signal handlers
trap cleanup SIGTERM SIGINT

# Start backend in background
echo "=== Starting Backend on port 3000 ==="
cd /app/packages/backend

# Check if we need to wait for database (optional, for migration scenarios)
if [ -n "$DB_HOST" ] && [ "$WAIT_FOR_DB" = "true" ]; then
    echo "Waiting for database at $DB_HOST:$DB_PORT..."
    timeout=60
    while ! bun -e "
        import { Client } from 'pg';
        const client = new Client({
            host: '$DB_HOST',
            port: $DB_PORT,
            user: '$DB_USER',
            password: '$DB_PASSWORD',
            database: '$DB_NAME'
        });
        try {
            await client.connect();
            await client.end();
            process.exit(0);
        } catch (e) {
            process.exit(1);
        }
    " 2>/dev/null; do
        timeout=$((timeout - 1))
        if [ $timeout -le 0 ]; then
            echo "Timeout waiting for database"
            exit 1
        fi
        echo "Database not ready yet, retrying..."
        sleep 1
    done
    echo "Database is ready!"
fi

# Start the backend
bun run src/index.ts &
BACKEND_PID=$!
echo "Backend started with PID: $BACKEND_PID"

# Wait for backend to be healthy
echo "=== Waiting for backend health check ==="
max_attempts=30
attempt=0
while [ $attempt -lt $max_attempts ]; do
    if bun -e "fetch('http://localhost:3000/health').then(r => r.ok ? process.exit(0) : process.exit(1)).catch(() => process.exit(1))" 2>/dev/null; then
        echo "Backend is healthy!"
        break
    fi
    attempt=$((attempt + 1))
    if [ $attempt -eq $max_attempts ]; then
        echo "Backend failed to start after $max_attempts attempts"
        kill "$BACKEND_PID" 2>/dev/null || true
        exit 1
    fi
    echo "Backend not ready yet (attempt $attempt/$max_attempts)..."
    sleep 2
done

# Start nginx in foreground
echo "=== Starting Nginx on port 80 ==="
nginx -g 'daemon off;' &
NGINX_PID=$!
echo "Nginx started with PID: $NGINX_PID"

# Wait for any process to exit
wait -n

# If we get here, one of the processes exited unexpectedly
echo "=== A service exited unexpectedly ==="
cleanup
