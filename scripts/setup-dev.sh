#!/bin/bash

# Development environment setup script
set -e

echo "🔧 Setting up development environment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

log_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    log_step "Checking prerequisites..."
    
    command -v node >/dev/null 2>&1 || { log_error "Node.js is required but not installed. Please install Node.js 18+"; exit 1; }
    command -v npm >/dev/null 2>&1 || { log_error "npm is required but not installed."; exit 1; }
    command -v docker >/dev/null 2>&1 || { log_error "Docker is required but not installed."; exit 1; }
    command -v docker-compose >/dev/null 2>&1 || { log_error "Docker Compose is required but not installed."; exit 1; }
    
    # Check Node.js version
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        log_error "Node.js version 18 or higher is required. Current version: $(node -v)"
        exit 1
    fi
    
    log_info "All prerequisites satisfied ✅"
}

# Setup environment files
setup_env_files() {
    log_step "Setting up environment files..."
    
    # Backend environment
    if [ ! -f "backend/.env" ]; then
        log_info "Creating backend .env file..."
        cat > backend/.env << EOF
NODE_ENV=development
PORT=3001
DB_PATH=./data/expense_tracker.db
JWT_SECRET=your-super-secret-jwt-key-change-in-production
AI_ENABLED=true
GEMINI_API_KEY=your-gemini-api-key-here
CORS_ORIGIN=http://localhost:3000
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760
AI_CACHE_TTL=24
LOG_LEVEL=debug
EOF
        log_warn "Please update backend/.env with your actual API keys and configuration"
    else
        log_info "Backend .env file already exists"
    fi
    
    # Frontend environment
    if [ ! -f "web-frontend/.env" ]; then
        log_info "Creating frontend .env file..."
        cat > web-frontend/.env << EOF
REACT_APP_API_URL=http://localhost:3001
REACT_APP_APP_NAME=Expense Tracker
REACT_APP_VERSION=1.0.0
GENERATE_SOURCEMAP=true
EOF
    else
        log_info "Frontend .env file already exists"
    fi
}

# Install dependencies
install_dependencies() {
    log_step "Installing dependencies..."
    
    # Backend dependencies
    log_info "Installing backend dependencies..."
    cd backend
    npm install
    cd ..
    
    # Frontend dependencies
    log_info "Installing frontend dependencies..."
    cd web-frontend
    npm install
    cd ..
    
    log_info "Dependencies installed ✅"
}

# Setup directories
setup_directories() {
    log_step "Setting up directories..."
    
    mkdir -p backend/data
    mkdir -p backend/uploads
    mkdir -p backend/logs
    mkdir -p backups
    
    log_info "Directories created ✅"
}

# Initialize database
init_database() {
    log_step "Initializing database..."
    
    cd backend
    npm run db:init 2>/dev/null || {
        log_info "Running database initialization manually..."
        node src/database/init.js
    }
    cd ..
    
    log_info "Database initialized ✅"
}

# Setup Git hooks
setup_git_hooks() {
    log_step "Setting up Git hooks..."
    
    if [ -d ".git" ]; then
        # Pre-commit hook
        cat > .git/hooks/pre-commit << 'EOF'
#!/bin/sh
echo "Running pre-commit checks..."

# Run linting
cd backend && npm run lint
backend_lint_exit=$?

cd ../web-frontend && npm run lint
frontend_lint_exit=$?

if [ $backend_lint_exit -ne 0 ] || [ $frontend_lint_exit -ne 0 ]; then
    echo "Linting failed. Please fix the issues before committing."
    exit 1
fi

echo "Pre-commit checks passed!"
EOF
        chmod +x .git/hooks/pre-commit
        
        log_info "Git hooks setup ✅"
    else
        log_warn "Not a Git repository, skipping Git hooks setup"
    fi
}

# Build Docker images for development
build_dev_images() {
    log_step "Building development Docker images..."
    
    docker-compose build
    
    log_info "Development Docker images built ✅"
}

# Setup complete message
setup_complete() {
    echo ""
    echo "🎉 Development environment setup complete!"
    echo ""
    echo "Next steps:"
    echo "1. Update your API keys in backend/.env"
    echo "2. Start development servers:"
    echo "   - Docker: docker-compose up"
    echo "   - Local: npm run dev:backend & npm run dev:frontend"
    echo ""
    echo "Useful commands:"
    echo "  npm run dev:backend    - Start backend development server"
    echo "  npm run dev:frontend   - Start frontend development server"
    echo "  npm run test           - Run all tests"
    echo "  npm run lint           - Run linting"
    echo "  docker-compose up      - Start with Docker"
    echo "  docker-compose down    - Stop Docker containers"
    echo ""
    echo "Access points:"
    echo "  Frontend: http://localhost:3000"
    echo "  Backend:  http://localhost:3001"
    echo "  API Docs: http://localhost:3001/api-docs"
    echo ""
}

# Main setup function
main() {
    log_info "🚀 Starting development environment setup..."
    
    check_prerequisites
    setup_env_files
    setup_directories
    install_dependencies
    init_database
    setup_git_hooks
    build_dev_images
    setup_complete
}

# Run main function
main "$@"
