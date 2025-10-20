# Production Deployment Guide

This guide covers deploying the Phone Prompt Generator to production securely.

## Pre-Deployment Checklist

### 1. Generate Secure Credentials

**Generate all required secrets before deployment:**

```bash
# Option 1: Use the built-in credential generator (interactive)
pnpm install
pnpm run generate-creds

# Option 2: Generate manually
openssl rand -base64 32  # For SESSION_SECRET
openssl rand -base64 32  # For CLEANUP_SECRET_KEY
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and update all values:

```bash
cp .env.example .env
```

**Required Variables:**

- `OPENAI_API_KEY` - Your OpenAI API key (get from https://platform.openai.com/api-keys)
- `AUTH_USERNAME` - Admin username (change from default!)
- `AUTH_PASSWORD` - Use bcrypt hash (see below)
- `SESSION_SECRET` - 32+ character random string (CRITICAL!)
- `CLEANUP_SECRET_KEY` - Secret for cleanup endpoint
- `NEXT_PUBLIC_APP_URL` - Your production URL with HTTPS
- `DATABASE_URL` - Path to SQLite database

**Hash Your Password:**

```bash
# Using Node.js
node -e "require('./lib/auth').hashPassword('your-secure-password').then(console.log)"

# Or use the credential generator
pnpm run generate-creds
```

### 3. Validate Configuration

```bash
# Check environment configuration
pnpm run validate-env

# If validation fails, fix the issues before proceeding
```

## Deployment Options

### Option 1: Docker Deployment (Recommended)

1. **Prepare environment file:**

```bash
# Create .env file with all required variables
cat > .env << EOF
OPENAI_API_KEY=sk-...
AUTH_USERNAME=admin
AUTH_PASSWORD=\$2b\$10\$...
SESSION_SECRET=$(openssl rand -base64 32)
CLEANUP_SECRET_KEY=$(openssl rand -base64 32)
NEXT_PUBLIC_APP_URL=https://yourdomain.com
DATABASE_URL=file:/app/data/prompts.db
AUDIO_STORAGE_PATH=/app/public/audio
EOF
```

2. **Build and start:**

```bash
# Build and start with docker-compose
docker-compose up -d

# View logs
docker-compose logs -f

# Check health
curl http://localhost:3040/api/health
```

3. **Set up periodic cleanup (cron):**

```bash
# Add to crontab (runs every 6 hours)
0 */6 * * * curl -X POST http://localhost:3040/api/sessions/cleanup \
  -H "x-cleanup-auth: YOUR_CLEANUP_SECRET_KEY"
```

### Option 2: Node.js Deployment

1. **Install dependencies:**

```bash
pnpm install --frozen-lockfile
```

2. **Setup database:**

```bash
pnpm exec prisma db push
```

3. **Build application:**

```bash
NODE_ENV=production pnpm build
```

4. **Start with PM2:**

```bash
# Install PM2 globally
npm install -g pm2

# Start application
pm2 start server.js --name phone-prompt-generator

# Configure PM2 startup
pm2 startup
pm2 save
```

5. **Set up periodic cleanup:**

```bash
# Create cleanup script
cat > cleanup-sessions.sh << 'EOF'
#!/bin/bash
curl -X POST http://localhost:3000/api/sessions/cleanup \
  -H "x-cleanup-auth: $CLEANUP_SECRET_KEY"
EOF

chmod +x cleanup-sessions.sh

# Add to crontab
crontab -e
# Add: 0 */6 * * * /path/to/cleanup-sessions.sh
```

## Security Hardening

### 1. HTTPS Configuration

**Always use HTTPS in production:**

- Set `NEXT_PUBLIC_APP_URL` to HTTPS URL
- Configure reverse proxy (nginx/Caddy) with SSL
- Redirect HTTP to HTTPS
- Use secure cookies (automatic in production)

**Example Nginx config:**

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:3040;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 2. Firewall Configuration

```bash
# Allow only necessary ports
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP (redirect to HTTPS)
ufw allow 443/tcp   # HTTPS
ufw enable

# Don't expose port 3040 directly
```

### 3. Rate Limiting

The application has built-in rate limiting for authentication:
- 5 failed login attempts
- 15-minute lockout
- Per-IP tracking

For additional protection, configure rate limiting in your reverse proxy.

### 4. Database Security

```bash
# Restrict database file permissions
chmod 600 data/prompts.db

# Regular backups
# Add to crontab:
0 2 * * * cp data/prompts.db data/backups/prompts-$(date +\%Y\%m\%d).db
```

### 5. File Permissions

```bash
# Set appropriate permissions
chown -R node:node /app
chmod -R 755 /app
chmod -R 700 /app/data
chmod -R 755 /app/public/audio
```

## Monitoring and Maintenance

### Health Checks

The docker-compose includes a health check. For manual monitoring:

```bash
# Check application health
curl http://localhost:3040/

# Check logs
docker-compose logs -f

# Or with PM2
pm2 logs phone-prompt-generator
```

### Log Rotation

With Docker:
```yaml
# In docker-compose.yml
logging:
  driver: "json-file"
  options:
    max-size: "10m"
    max-file: "3"
```

With PM2:
```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

### Database Maintenance

```bash
# Backup database
cp data/prompts.db data/prompts.backup.db

# Optimize database (run monthly)
sqlite3 data/prompts.db "VACUUM;"
```

### Session Cleanup

Sessions are automatically cleaned after 24 hours. Trigger manual cleanup:

```bash
curl -X POST http://localhost:3040/api/sessions/cleanup \
  -H "x-cleanup-auth: YOUR_CLEANUP_SECRET_KEY"
```

## Troubleshooting

### Application Won't Start

1. Check environment validation:
```bash
pnpm run validate-env
```

2. Check logs:
```bash
docker-compose logs
# or
pm2 logs
```

3. Verify all environment variables are set correctly

### Authentication Issues

1. Verify SESSION_SECRET is set and consistent
2. Check AUTH_PASSWORD is properly hashed
3. Clear browser cookies and try again

### Audio Generation Fails

1. Verify OPENAI_API_KEY is valid
2. Check OpenAI account has credits
3. Review logs for specific error codes

### High Memory Usage

1. Clean up old sessions:
```bash
curl -X POST http://localhost:3040/api/sessions/cleanup \
  -H "x-cleanup-auth: YOUR_CLEANUP_SECRET_KEY"
```

2. Check audio file sizes in `public/audio/sessions/`

## Performance Optimization

### 1. Enable Caching

Configure your reverse proxy to cache static assets:

```nginx
location /audio/ {
    proxy_pass http://localhost:3040;
    proxy_cache_valid 200 1h;
    add_header Cache-Control "public, max-age=3600";
}
```

### 2. Database Optimization

```bash
# Add indexes (if needed based on query patterns)
sqlite3 data/prompts.db "CREATE INDEX idx_created_at ON Generation(createdAt);"
```

### 3. Resource Limits

For Docker:
```yaml
services:
  app:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          memory: 512M
```

## Backup Strategy

### Automated Backups

```bash
#!/bin/bash
# backup.sh
BACKUP_DIR="/backups/phone-prompts"
DATE=$(date +%Y%m%d-%H%M%S)

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup database
cp data/prompts.db "$BACKUP_DIR/prompts-$DATE.db"

# Backup audio files (optional - these can be regenerated)
tar -czf "$BACKUP_DIR/audio-$DATE.tar.gz" public/audio/

# Keep only last 7 days
find $BACKUP_DIR -name "*.db" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "Backup completed: $DATE"
```

Add to crontab:
```bash
0 2 * * * /path/to/backup.sh
```

## Security Incident Response

If you suspect a security breach:

1. **Immediately rotate credentials:**
```bash
pnpm run generate-creds
# Update .env with new values
docker-compose restart  # or pm2 restart
```

2. **Review logs for suspicious activity:**
```bash
docker-compose logs | grep "Rate limit exceeded"
docker-compose logs | grep "Invalid"
```

3. **Check database for unauthorized entries:**
```bash
sqlite3 data/prompts.db "SELECT * FROM Generation ORDER BY createdAt DESC LIMIT 50;"
```

4. **Update OpenAI API key** if compromised

## Support

For issues or questions:
- Review logs first
- Check environment configuration
- Verify all security requirements are met
- Ensure all dependencies are installed
