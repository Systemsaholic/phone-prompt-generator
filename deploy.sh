#!/bin/bash

# Phone Prompt Generator - Docker Deployment Script
# This script automates the deployment process on a Docker server

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print functions
print_header() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}\n"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

# Check prerequisites
check_prerequisites() {
    print_header "Checking Prerequisites"

    local missing=0

    # Check Docker
    if command -v docker &> /dev/null; then
        print_success "Docker is installed ($(docker --version))"
    else
        print_error "Docker is not installed"
        missing=1
    fi

    # Check Docker Compose
    if command -v docker-compose &> /dev/null; then
        print_success "Docker Compose is installed ($(docker-compose --version))"
    else
        print_error "Docker Compose is not installed"
        missing=1
    fi

    # Check if Docker daemon is running
    if docker info &> /dev/null; then
        print_success "Docker daemon is running"
    else
        print_error "Docker daemon is not running"
        missing=1
    fi

    if [ $missing -eq 1 ]; then
        print_error "Missing prerequisites. Please install the required software."
        exit 1
    fi
}

# Generate secure random string
generate_secret() {
    openssl rand -base64 32
}

# Prompt for environment variables
setup_environment() {
    print_header "Environment Configuration"

    if [ -f .env ]; then
        print_warning ".env file already exists!"
        read -p "Do you want to overwrite it? (y/N): " overwrite
        if [[ ! $overwrite =~ ^[Yy]$ ]]; then
            print_info "Using existing .env file"
            return
        fi
        mv .env .env.backup.$(date +%Y%m%d_%H%M%S)
        print_info "Backed up existing .env file"
    fi

    print_info "Please provide the following configuration values:"
    echo

    # OpenAI API Key
    read -p "OpenAI API Key (required): " OPENAI_API_KEY
    while [ -z "$OPENAI_API_KEY" ]; do
        print_error "OpenAI API Key is required!"
        read -p "OpenAI API Key: " OPENAI_API_KEY
    done

    # Auth Username
    read -p "Admin Username (default: admin): " AUTH_USERNAME
    AUTH_USERNAME=${AUTH_USERNAME:-admin}

    # Auth Password
    read -sp "Admin Password (required): " AUTH_PASSWORD
    echo
    while [ -z "$AUTH_PASSWORD" ]; do
        print_error "Admin Password is required!"
        read -sp "Admin Password: " AUTH_PASSWORD
        echo
    done

    # Generate secrets
    print_info "Generating secure secrets..."
    SESSION_SECRET=$(generate_secret)
    CLEANUP_SECRET_KEY=$(generate_secret)

    # Get server IP
    print_info "Detecting server IP address..."
    SERVER_IP=$(hostname -I | awk '{print $1}')
    if [ -z "$SERVER_IP" ]; then
        SERVER_IP="localhost"
    fi

    read -p "Application URL (default: http://$SERVER_IP:3040): " APP_URL
    APP_URL=${APP_URL:-http://$SERVER_IP:3040}

    # Create .env file
    cat > .env << EOF
# OpenAI Configuration
OPENAI_API_KEY=$OPENAI_API_KEY

# Authentication
AUTH_USERNAME=$AUTH_USERNAME
AUTH_PASSWORD=$AUTH_PASSWORD
SESSION_SECRET=$SESSION_SECRET
CLEANUP_SECRET_KEY=$CLEANUP_SECRET_KEY

# Application Configuration
NEXT_PUBLIC_APP_URL=$APP_URL
DATABASE_URL=file:/app/data/prompts.db
AUDIO_STORAGE_PATH=/app/public/audio
NODE_ENV=production
EOF

    print_success ".env file created successfully"

    # Save cleanup secret for later
    echo "$CLEANUP_SECRET_KEY" > .cleanup_secret
    chmod 600 .cleanup_secret
}

# Create necessary directories
create_directories() {
    print_header "Creating Directories"

    mkdir -p data
    mkdir -p audio

    print_success "Created data directory"
    print_success "Created audio directory"
}

# Build and start containers
deploy_containers() {
    print_header "Building and Starting Containers"

    print_info "Building Docker image (this may take a few minutes)..."
    docker-compose build

    print_info "Starting containers..."
    docker-compose up -d

    print_success "Containers started successfully"
}

# Wait for application to be ready
wait_for_app() {
    print_header "Waiting for Application"

    print_info "Waiting for application to be ready..."

    local max_attempts=30
    local attempt=0

    while [ $attempt -lt $max_attempts ]; do
        if docker-compose ps | grep -q "Up (healthy)"; then
            print_success "Application is healthy and ready!"
            return 0
        fi

        if docker-compose ps | grep -q "Exit"; then
            print_error "Container exited unexpectedly"
            docker-compose logs --tail=50
            return 1
        fi

        echo -n "."
        sleep 2
        attempt=$((attempt + 1))
    done

    print_warning "Health check timeout, but application may still be starting"
    return 0
}

# Setup cron job for cleanup
setup_cron() {
    print_header "Setting Up Cleanup Job"

    read -p "Do you want to set up automatic session cleanup? (Y/n): " setup_cleanup
    setup_cleanup=${setup_cleanup:-Y}

    if [[ ! $setup_cleanup =~ ^[Yy]$ ]]; then
        print_info "Skipping cron setup"
        return
    fi

    if [ ! -f .cleanup_secret ]; then
        print_error "Cleanup secret not found. Please run deployment again."
        return
    fi

    CLEANUP_SECRET=$(cat .cleanup_secret)

    # Create cleanup script
    cat > cleanup-sessions.sh << EOF
#!/bin/bash
curl -X POST http://localhost:3040/api/sessions/cleanup \\
  -H "x-cleanup-auth: $CLEANUP_SECRET" \\
  -s -o /dev/null -w "%{http_code}"
EOF

    chmod +x cleanup-sessions.sh

    # Check if cron job already exists
    if crontab -l 2>/dev/null | grep -q "cleanup-sessions.sh"; then
        print_info "Cron job already exists"
    else
        # Add to crontab (runs every 6 hours)
        (crontab -l 2>/dev/null; echo "0 */6 * * * $(pwd)/cleanup-sessions.sh > /dev/null 2>&1") | crontab -
        print_success "Cron job added (runs every 6 hours)"
    fi
}

# Display deployment summary
show_summary() {
    print_header "Deployment Summary"

    echo -e "${GREEN}✓ Deployment completed successfully!${NC}\n"

    # Get server info
    SERVER_IP=$(hostname -I | awk '{print $1}')
    APP_URL=$(grep NEXT_PUBLIC_APP_URL .env | cut -d '=' -f2)
    USERNAME=$(grep AUTH_USERNAME .env | cut -d '=' -f2)

    echo -e "${BLUE}Application URL:${NC} $APP_URL"
    echo -e "${BLUE}Login Username:${NC} $USERNAME"
    echo -e "${BLUE}Login Password:${NC} (as configured)"
    echo

    print_info "Useful Commands:"
    echo "  View logs:           docker-compose logs -f"
    echo "  Stop application:    docker-compose stop"
    echo "  Start application:   docker-compose start"
    echo "  Restart application: docker-compose restart"
    echo "  View status:         docker-compose ps"
    echo "  Manual cleanup:      ./cleanup-sessions.sh"
    echo

    if [ -f .cleanup_secret ]; then
        print_warning "Cleanup secret saved in .cleanup_secret (keep this secure!)"
    fi
}

# Main deployment flow
main() {
    clear
    print_header "Phone Prompt Generator - Docker Deployment"

    # Check if we're in the right directory
    if [ ! -f "package.json" ] || [ ! -f "Dockerfile" ]; then
        print_error "Please run this script from the project root directory"
        exit 1
    fi

    # Run deployment steps
    check_prerequisites
    setup_environment
    create_directories
    deploy_containers
    wait_for_app
    setup_cron
    show_summary

    echo
    print_success "Deployment complete! 🚀"
    echo
}

# Run main function
main
