#!/bin/bash

# Phone Prompt Generator - Update Script
# Updates the application to the latest version from GitHub

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

# Backup database
backup_database() {
    print_header "Backing Up Database"

    if [ -f "data/prompts.db" ]; then
        BACKUP_FILE="data/prompts.backup.$(date +%Y%m%d_%H%M%S).db"
        cp data/prompts.db "$BACKUP_FILE"
        print_success "Database backed up to: $BACKUP_FILE"
    else
        print_warning "No database found to backup"
    fi
}

# Backup environment file
backup_env() {
    print_header "Backing Up Configuration"

    if [ -f ".env" ]; then
        cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
        print_success ".env file backed up"
    else
        print_error ".env file not found!"
        exit 1
    fi
}

# Pull latest code
pull_updates() {
    print_header "Pulling Latest Code"

    # Check if it's a git repository
    if [ ! -d ".git" ]; then
        print_error "Not a git repository. Cannot pull updates."
        print_info "Please use 'git clone' to reinstall or manually copy files."
        exit 1
    fi

    # Stash any local changes
    if ! git diff-index --quiet HEAD --; then
        print_warning "Local changes detected, stashing..."
        git stash
        STASHED=1
    fi

    # Pull latest changes
    print_info "Fetching latest changes from GitHub..."
    git fetch origin

    CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
    print_info "Current branch: $CURRENT_BRANCH"

    # Check if there are updates
    LOCAL=$(git rev-parse @)
    REMOTE=$(git rev-parse @{u})

    if [ "$LOCAL" = "$REMOTE" ]; then
        print_success "Already up to date!"

        if [ "$STASHED" = "1" ]; then
            print_info "Restoring stashed changes..."
            git stash pop
        fi

        read -p "No updates available. Do you want to rebuild anyway? (y/N): " rebuild
        if [[ ! $rebuild =~ ^[Yy]$ ]]; then
            print_info "Update cancelled."
            exit 0
        fi
    else
        print_info "Pulling updates..."
        git pull origin "$CURRENT_BRANCH"
        print_success "Code updated successfully"

        if [ "$STASHED" = "1" ]; then
            print_warning "You had local changes that were stashed."
            read -p "Do you want to restore them? (y/N): " restore
            if [[ $restore =~ ^[Yy]$ ]]; then
                git stash pop
            fi
        fi
    fi
}

# Rebuild containers
rebuild_containers() {
    print_header "Rebuilding Containers"

    print_info "Stopping containers..."
    docker-compose down

    print_info "Rebuilding image (this may take a few minutes)..."
    docker-compose build --no-cache

    print_success "Containers rebuilt"
}

# Start containers
start_containers() {
    print_header "Starting Containers"

    print_info "Starting containers..."
    docker-compose up -d

    print_success "Containers started"
}

# Wait for health check
wait_for_health() {
    print_header "Waiting for Application"

    print_info "Waiting for application to be healthy..."

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

# Show update summary
show_summary() {
    print_header "Update Summary"

    echo -e "${GREEN}✓ Update completed successfully!${NC}\n"

    # Get current version info
    COMMIT=$(git rev-parse --short HEAD)
    BRANCH=$(git rev-parse --abbrev-ref HEAD)

    echo -e "${BLUE}Current Version:${NC}"
    echo "  Branch: $BRANCH"
    echo "  Commit: $COMMIT"
    echo

    print_info "Recent changes:"
    git log --oneline -5
    echo

    APP_URL=$(grep NEXT_PUBLIC_APP_URL .env | cut -d '=' -f2)
    echo -e "${BLUE}Application URL:${NC} $APP_URL"
    echo

    print_info "Useful commands:"
    echo "  View logs:   docker-compose logs -f"
    echo "  Restart:     docker-compose restart"
    echo "  Status:      docker-compose ps"
    echo
}

# Rollback function
rollback() {
    print_header "Rollback"

    print_error "Update failed! Rolling back..."

    # Find most recent backup
    LATEST_DB=$(ls -t data/prompts.backup.*.db 2>/dev/null | head -n1)
    LATEST_ENV=$(ls -t .env.backup.* 2>/dev/null | head -n1)

    if [ -n "$LATEST_DB" ]; then
        cp "$LATEST_DB" data/prompts.db
        print_success "Database restored from: $LATEST_DB"
    fi

    if [ -n "$LATEST_ENV" ]; then
        cp "$LATEST_ENV" .env
        print_success ".env restored from: $LATEST_ENV"
    fi

    # Try to restart with old code
    git reset --hard HEAD~1
    docker-compose down
    docker-compose up -d

    print_warning "Rollback complete. Application restored to previous version."
}

# Main update flow
main() {
    clear
    print_header "Phone Prompt Generator - Update"

    # Check if we're in the right directory
    if [ ! -f "package.json" ] || [ ! -f "docker-compose.yml" ]; then
        print_error "Please run this script from the project root directory"
        exit 1
    fi

    # Check if containers are running
    if ! docker-compose ps | grep -q "Up"; then
        print_warning "Containers are not running"
        read -p "Do you want to start them? (Y/n): " start
        start=${start:-Y}
        if [[ $start =~ ^[Yy]$ ]]; then
            docker-compose up -d
            print_success "Containers started"
        fi
    fi

    # Run update steps
    backup_database
    backup_env
    pull_updates

    # Ask before rebuilding
    echo
    read -p "Ready to rebuild and restart containers? (Y/n): " proceed
    proceed=${proceed:-Y}

    if [[ ! $proceed =~ ^[Yy]$ ]]; then
        print_info "Update cancelled."
        exit 0
    fi

    # Rebuild and restart
    if rebuild_containers && start_containers && wait_for_health; then
        show_summary
        echo
        print_success "Update complete! 🚀"
        echo
    else
        rollback
        exit 1
    fi
}

# Handle Ctrl+C
trap 'print_error "Update interrupted by user"; exit 1' INT

# Run main function
main
