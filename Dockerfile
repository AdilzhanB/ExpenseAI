# Multi-stage build for production-ready deployment
# Stage 1: Build the frontend
FROM node:18-alpine AS frontend-builder

WORKDIR /app/frontend

# Copy frontend package files
COPY web-frontend/package*.json ./
RUN npm ci --only=production

# Copy frontend source and build
COPY web-frontend/ ./
RUN npm run build

# Stage 2: Build the backend
FROM node:18-alpine AS backend-builder

WORKDIR /app/backend

# Copy backend package files
COPY backend/package*.json ./
RUN npm ci --only=production

# Copy backend source
COPY backend/ ./

# Stage 3: Production runtime
FROM node:18-alpine AS production

# Install system dependencies for OCR and image processing
RUN apk add --no-cache \
    tesseract-ocr \
    tesseract-ocr-data-eng \
    imagemagick \
    ghostscript \
    && rm -rf /var/cache/apk/*

# Create app directory
WORKDIR /app

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy backend from builder stage
COPY --from=backend-builder --chown=nodejs:nodejs /app/backend ./backend

# Copy built frontend from builder stage
COPY --from=frontend-builder --chown=nodejs:nodejs /app/frontend/build ./frontend/build

# Create necessary directories
RUN mkdir -p /app/data /app/logs /app/uploads && \
    chown -R nodejs:nodejs /app

# Expose port
EXPOSE 3001

# Switch to non-root user
USER nodejs

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node backend/src/healthcheck.js || exit 1

# Start the application
CMD ["node", "backend/src/server.js"]
