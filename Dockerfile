# Unified Dockerfile for Karen2 (Backend + Frontend)
# Multi-stage build for optimized production image

# Stage 1: Build frontend
FROM oven/bun:1.3-slim AS frontend-builder
WORKDIR /app

# Explicitly unset VITE_API_URL to prevent host env var leakage during build
# This ensures the frontend uses the default /api path
ENV VITE_API_URL=""

# Copy root package files
COPY package.json bun.lock ./
COPY tsconfig.json ./
COPY packages/frontend/package.json ./packages/frontend/

# Install dependencies
RUN bun install

# Copy frontend source code
COPY packages/frontend ./packages/frontend

# Build the frontend application
RUN cd packages/frontend && bun run build

# Stage 2: Backend dependencies (used by migrations service)
FROM oven/bun:1.3-slim AS backend-deps
WORKDIR /app

# Copy root package files and install all deps
COPY package.json bun.lock ./
COPY packages/backend/package.json ./packages/backend/
RUN bun install

# Copy backend source code (needed for drizzle-kit config and migrations)
COPY packages/backend ./packages/backend

# Set working directory to backend package
WORKDIR /app/packages/backend

# Stage 3: Production image
FROM oven/bun:1.3-slim AS production

# Install nginx
RUN apt-get update && apt-get install -y nginx && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy dependencies from backend-deps stage
COPY --from=backend-deps /app/node_modules ./node_modules
RUN mkdir -p ./packages/backend/node_modules

# Copy backend source code
COPY packages/backend ./packages/backend

# Copy built frontend from frontend-builder stage
COPY --from=frontend-builder /app/packages/frontend/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy entrypoint script
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Set environment
ENV NODE_ENV=production
ENV PORT=3000

# Expose port 80 (nginx)
EXPOSE 80

# Health check via nginx (which proxies to backend)
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD bun -e "fetch('http://localhost:80/health').then(r => r.ok ? process.exit(0) : process.exit(1)).catch(() => process.exit(1))"

# Start both services via entrypoint script
ENTRYPOINT ["/docker-entrypoint.sh"]
