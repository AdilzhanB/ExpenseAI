#!/bin/bash

# Production deployment script
set -e

echo "🚀 Starting production deployment..."

# Configuration
COMPOSE_FILE="docker-compose.prod.yml"
IMAGE_TAG="${IMAGE_TAG:-latest}"
BACKUP_DIR="/opt/backups"
APP_DIR="/opt/expense-tracker"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   log_error "This script should not be run as root for security reasons"
   exit 1
fi

# Check prerequisites
command -v docker >/dev/null 2>&1 || { log_error "Docker is required but not installed. Aborting."; exit 1; }
command -v docker-compose >/dev/null 2>&1 || { log_error "Docker Compose is required but not installed. Aborting."; exit 1; }

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Function to create database backup
create_backup() {
    log_info "Creating database backup..."
    TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
    BACKUP_FILE="$BACKUP_DIR/expense_tracker_backup_$TIMESTAMP.db"
    
    if docker-compose -f "$COMPOSE_FILE" exec -T app test -f /app/data/expense_tracker.db; then
        docker-compose -f "$COMPOSE_FILE" exec -T app cp /app/data/expense_tracker.db /tmp/backup.db
        docker cp $(docker-compose -f "$COMPOSE_FILE" ps -q app):/tmp/backup.db "$BACKUP_FILE"
        gzip "$BACKUP_FILE"
        log_info "Backup created: ${BACKUP_FILE}.gz"
    else
        log_warn "No existing database found, skipping backup"
    fi
}

# Function to cleanup old backups
cleanup_backups() {
    log_info "Cleaning up old backups (keeping last 30 days)..."
    find "$BACKUP_DIR" -name "*.db.gz" -mtime +30 -delete
}

# Function to health check
health_check() {
    log_info "Performing health check..."
    local retries=0
    local max_retries=30
    
    while [ $retries -lt $max_retries ]; do
        if curl -f http://localhost/health >/dev/null 2>&1; then
            log_info "Health check passed"
            return 0
        fi
        
        retries=$((retries + 1))
        log_info "Health check attempt $retries/$max_retries failed, retrying in 10 seconds..."
        sleep 10
    done
    
    log_error "Health check failed after $max_retries attempts"
    return 1
}

# Function to rollback
rollback() {
    log_error "Deployment failed, rolling back..."
    
    # Try to restore from the most recent backup
    LATEST_BACKUP=$(find "$BACKUP_DIR" -name "expense_tracker_backup_*.db.gz" -type f -printf '%T@ %p\n' | sort -n | tail -1 | cut -d' ' -f2-)
    
    if [ -n "$LATEST_BACKUP" ]; then
        log_info "Restoring from backup: $LATEST_BACKUP"
        gunzip -c "$LATEST_BACKUP" > /tmp/restore.db
        docker cp /tmp/restore.db $(docker-compose -f "$COMPOSE_FILE" ps -q app):/app/data/expense_tracker.db
        rm /tmp/restore.db
    fi
    
    # Restart services
    docker-compose -f "$COMPOSE_FILE" restart app
    
    if health_check; then
        log_info "Rollback successful"
    else
        log_error "Rollback failed, manual intervention required"
        exit 1
    fi
}

# Main deployment process
main() {
    log_info "Starting deployment to production..."
    
    # Navigate to app directory
    cd "$APP_DIR" || { log_error "App directory not found: $APP_DIR"; exit 1; }
    
    # Create backup before deployment
    create_backup
    
    # Pull latest code
    log_info "Pulling latest code..."
    git pull origin main || { log_error "Failed to pull latest code"; exit 1; }
    
    # Pull latest Docker images
    log_info "Pulling latest Docker images..."
    docker-compose -f "$COMPOSE_FILE" pull || { log_error "Failed to pull Docker images"; exit 1; }
    
    # Stop services gracefully
    log_info "Stopping services..."
    docker-compose -f "$COMPOSE_FILE" down --timeout 30
    
    # Start services
    log_info "Starting services..."
    docker-compose -f "$COMPOSE_FILE" up -d --remove-orphans || {
        log_error "Failed to start services"
        rollback
        exit 1
    }
    
    # Wait for services to be ready
    log_info "Waiting for services to be ready..."
    sleep 30
    
    # Perform health check
    if health_check; then
        log_info "✅ Deployment successful!"
        
        # Cleanup old Docker images and containers
        log_info "Cleaning up old Docker resources..."
        docker system prune -f
        
        # Cleanup old backups
        cleanup_backups
        
        # Send notification (if configured)
        if [ -n "$SLACK_WEBHOOK_URL" ]; then
            curl -X POST -H 'Content-type: application/json' \
                --data '{"text":"🚀 Production deployment successful!"}' \
                "$SLACK_WEBHOOK_URL"
        fi
        
        log_info "🎉 Deployment completed successfully!"
    else
        rollback
        exit 1
    fi
}

# Trap to handle script interruption
trap 'log_error "Deployment interrupted"; rollback; exit 1' INT TERM

# Run main function
main "$@"
