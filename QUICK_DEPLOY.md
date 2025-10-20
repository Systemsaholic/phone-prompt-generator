# Quick Deployment Guide

## One-Command Deployment

Deploy the Phone Prompt Generator to your Docker server in minutes!

### Option 1: Clone and Deploy (If using Git)

**On your Docker server:**

```bash
git clone https://github.com/Systemsaholic/phone-prompt-generator.git
cd phone-prompt-generator
./deploy.sh
```

### Option 2: Copy and Deploy (Without Git)

**From your local machine:**

```bash
# Copy project to server
scp -r phone-prompt-generator user@your-server:/path/to/deploy/

# SSH into server and deploy
ssh user@your-server
cd /path/to/deploy/phone-prompt-generator
./deploy.sh
```

### What the Script Does

The `deploy.sh` script automatically:

1. ✅ Checks Docker and Docker Compose are installed
2. ✅ Prompts for configuration (OpenAI API key, admin credentials)
3. ✅ Generates secure secrets automatically
4. ✅ Creates required directories
5. ✅ Builds and starts Docker containers
6. ✅ Waits for the application to be healthy
7. ✅ Sets up automatic session cleanup (cron job)
8. ✅ Displays access information

### What You'll Need

- **OpenAI API Key**: Get from <https://platform.openai.com/api-keys>
- **Admin Username**: Choose a username (default: admin)
- **Admin Password**: Choose a secure password

Everything else is generated automatically!

### After Deployment

Access your application at the URL shown in the deployment summary (typically `http://your-server-ip:3040`).

**Useful Commands:**

```bash
# View logs
docker-compose logs -f

# Restart application
docker-compose restart

# Stop application
docker-compose stop

# Start application
docker-compose start

# Check status
docker-compose ps

# Manual cleanup of old sessions
./cleanup-sessions.sh
```

### Troubleshooting

If the deployment fails:

```bash
# Check logs
docker-compose logs

# Rebuild from scratch
docker-compose down
docker-compose build --no-cache
./deploy.sh
```

### Security Notes

- The script generates secure random secrets automatically
- `.env` file is created with your credentials (never commit this!)
- Cleanup secret is saved in `.cleanup_secret` (keep secure!)
- For production, consider using bcrypt-hashed passwords (see DEPLOYMENT.md)

### Next Steps

For production deployments, see [DEPLOYMENT.md](./DEPLOYMENT.md) for:

- HTTPS setup with nginx
- Firewall configuration
- Security hardening
- Backup strategies
- Performance optimization
