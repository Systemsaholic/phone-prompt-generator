# Phone Prompt Generator

<div align="center">

A Next.js 14 application for generating professional phone system audio prompts using OpenAI's TTS and GPT-4 APIs with built-in authentication, session management, and 3CX-optimized audio conversion.

[![Version](https://img.shields.io/badge/version-1.0.0-blue)](https://github.com/Systemsaholic/phone-prompt-generator/releases)
[![License](https://img.shields.io/badge/license-MIT-green)](./LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-14.2-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue)](https://www.typescriptlang.org/)
[![CI/CD](https://github.com/Systemsaholic/phone-prompt-generator/actions/workflows/ci.yml/badge.svg)](https://github.com/Systemsaholic/phone-prompt-generator/actions)
[![Security](https://img.shields.io/badge/security-A+-brightgreen)](./SECURITY.md)

[Features](#features) •
[Quick Start](#quick-start) •
[Documentation](#documentation) •
[Contributing](#contributing) •
[License](#license)

</div>

---

## Table of Contents

- [Features](#features)
- [Quick Start](#quick-start)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Docker Installation](#docker-installation)
- [Production Deployment](#production-deployment)
- [Usage](#usage)
- [API Reference](#api-reference)
- [Documentation](#documentation)
- [Development](#development)
- [Contributing](#contributing)
- [Security](#security)
- [License](#license)
- [Support](#support)

---

## Features

### 🎯 Dual TTS Modes
- **Basic Mode**: Direct TTS generation with voice and speed controls
- **Advanced Mode**: AI-enhanced voice control with natural language instructions

### 🔒 Security & Authentication
- **Secure Authentication**: Cookie-based sessions with rate limiting (5 attempts/15 min lockout)
- **Cryptographic Sessions**: HMAC-signed tokens with crypto.randomBytes
- **Password Security**: Bcrypt hashing support with timing-safe comparison
- **Environment Validation**: Production-ready configuration checks
- **Session Management**: Automatic cleanup after 24 hours

### 🎤 Voice Options
6 OpenAI TTS voices available:
- **alloy** - Neutral and balanced
- **echo** - Warm and expressive
- **fable** - Engaging and friendly
- **onyx** - Deep and authoritative
- **nova** - Clear and professional (recommended)
- **shimmer** - Upbeat and energetic

### 📝 Template System
Pre-built templates with variable replacement:
- Voicemail Greetings
- IVR Main Menu
- Hold Messages
- After Hours Messages
- Holiday Greetings
- Custom Templates

### 🔊 3CX Audio Optimization
Automatic conversion to 3CX-compatible format:
- **Format**: WAV (not MP3)
- **Channels**: Mono (not stereo)
- **Sample Rate**: 8 kHz (VoIP optimized)
- **Bit Depth**: 16-bit PCM

### 📊 Additional Features
- 🤖 AI text generation and polishing with GPT-4
- 📂 Session-based audio storage (prevents user conflicts)
- 📊 Generation history tracking
- 🎵 Audio preview and download
- 🗄️ SQLite database for persistence
- 🐳 Docker deployment ready with health checks
- ⚡ Production-ready error handling
- 📝 Comprehensive input validation

## Quick Start

### Prerequisites
- Node.js 20+ or Docker
- pnpm (install with `npm install -g pnpm`)
- OpenAI API Key

### Local Development

1. Clone the repository:
```bash
git clone <repository-url>
cd phone-prompt-generator
```

2. Install dependencies:
```bash
pnpm install
```

3. Generate secure credentials:
```bash
# Interactive credential generator
pnpm run generate-creds
# Copy the generated credentials to .env
```

4. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with:
# - Your OPENAI_API_KEY
# - Generated AUTH_PASSWORD, SESSION_SECRET, CLEANUP_SECRET_KEY
```

5. Validate configuration:
```bash
pnpm run validate-env
```

6. Initialize the database:
```bash
pnpm exec prisma db push
```

5. Run the development server:
```bash
pnpm dev
```

6. Open [http://localhost:3040](http://localhost:3040) in your browser

### Docker Deployment

1. Clone the repository:
```bash
git clone <repository-url>
cd phone-prompt-generator
```

2. Create `.env` file:
```bash
cp .env.example .env
# Edit .env and add your OPENAI_API_KEY
```

3. Build and run with Docker Compose:
```bash
docker-compose up -d
```

4. Open [http://localhost:3040](http://localhost:3040) in your browser

## Production Deployment

**⚠️ IMPORTANT: Read [DEPLOYMENT.md](./DEPLOYMENT.md) for comprehensive production deployment guide**

### Quick Production Checklist

1. **Generate Secure Credentials**
```bash
pnpm run generate-creds
```

2. **Configure Environment**
```bash
# Set these in your production .env:
AUTH_USERNAME=admin                        # Change this!
AUTH_PASSWORD=$2b$10$...                   # Use bcrypt hash
SESSION_SECRET=<32+ char random string>    # CRITICAL!
CLEANUP_SECRET_KEY=<random string>
NEXT_PUBLIC_APP_URL=https://yourdomain.com # HTTPS required!
```

3. **Validate Configuration**
```bash
pnpm run validate-env
```

4. **Deploy with Docker**
```bash
docker-compose up -d
```

5. **Set Up Session Cleanup Cron Job**
```bash
# Add to crontab (runs every 6 hours)
0 */6 * * * curl -X POST https://yourdomain.com/api/sessions/cleanup \
  -H "x-cleanup-auth: YOUR_CLEANUP_SECRET_KEY"
```

### Production Security Requirements

- ✅ Use HTTPS (secure cookies require it)
- ✅ Generate strong SESSION_SECRET (32+ characters)
- ✅ Use bcrypt-hashed AUTH_PASSWORD
- ✅ Set up periodic session cleanup
- ✅ Configure firewall rules
- ✅ Enable rate limiting in reverse proxy
- ✅ Regular database backups
- ✅ Monitor application logs

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions.

## Usage

### Basic Mode
1. Navigate to the "Generate Audio" tab
2. Select "Basic Mode"
3. Enter your text (up to 4096 characters)
4. Choose a voice and adjust speed
5. Click "Generate Audio"
6. Preview and download your audio file

### Advanced Mode
1. Navigate to the "Generate Audio" tab
2. Select "Advanced Mode"
3. Enter your text
4. Select voice characteristics (accent, tone, emotion)
5. Add custom instructions if needed
6. Click "Generate Advanced Audio"
7. Preview and download your audio file

### Using Templates
1. Go to the "Templates" tab
2. Select a template category
3. Choose a specific template
4. Fill in the variables (company name, departments, etc.)
5. Click "Apply Template"
6. The text will be loaded into the generator

### Audio Formats for Phone Systems

#### 3CX Phone System
The application automatically optimizes audio for 3CX:
- Format: WAV
- Channels: Mono
- Sample Rate: 8 kHz
- Bit Depth: 16-bit

This ensures maximum compatibility with 3CX phone systems and minimizes file size.

## API Endpoints

- `POST /api/tts/basic` - Generate audio using basic TTS
- `POST /api/tts/advanced` - Generate audio with advanced voice control
- `GET/POST/PUT/DELETE /api/templates` - Template management
- `GET/DELETE /api/history` - Generation history
- `POST /api/convert` - Audio format conversion

## Technology Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: SQLite with Prisma ORM
- **Audio Processing**: FFmpeg
- **AI/TTS**: OpenAI API (GPT-4o, TTS-1-HD)
- **Deployment**: Docker

## Environment Variables

### Required Variables

```env
# OpenAI API Configuration
OPENAI_API_KEY=your_openai_api_key_here

# Authentication (REQUIRED)
AUTH_USERNAME=admin                      # Change in production!
AUTH_PASSWORD=$2b$10$...                 # Use bcrypt hash
SESSION_SECRET=<32+ char random>         # CRITICAL - generate with openssl
CLEANUP_SECRET_KEY=<random string>       # For session cleanup endpoint

# Database Configuration
DATABASE_URL="file:./data/prompts.db"

# Application Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3040  # Use HTTPS in production!

# Audio Storage Path
AUDIO_STORAGE_PATH=./public/audio
```

### Generate Secure Values

```bash
# Generate all credentials interactively
pnpm run generate-creds

# Or manually:
openssl rand -base64 32  # For SESSION_SECRET
openssl rand -base64 32  # For CLEANUP_SECRET_KEY
node -e "require('./lib/auth').hashPassword('yourpassword').then(console.log)"
```

## Project Structure

```
phone-prompt-generator/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   │   ├── tts/          # TTS endpoints
│   │   ├── templates/    # Template management
│   │   ├── history/      # Generation history
│   │   └── convert/      # Audio conversion
│   ├── layout.tsx        # Root layout
│   └── page.tsx          # Main page
├── components/            # React components
│   ├── TTSBasic.tsx      # Basic TTS interface
│   ├── TTSAdvanced.tsx   # Advanced TTS interface
│   ├── TemplateManager.tsx # Template management
│   └── HistoryPanel.tsx  # History display
├── lib/                   # Utilities
│   ├── db.ts             # Database client
│   ├── openai.ts         # OpenAI client
│   └── audio-converter.ts # FFmpeg wrapper
├── prisma/               # Database schema
├── public/               # Static files
│   └── audio/           # Generated audio files
├── docker-compose.yml    # Docker configuration
└── Dockerfile           # Container definition
```

## Development

### Available Scripts

```bash
pnpm dev              # Start development server
pnpm build            # Build for production
pnpm start            # Start production server
pnpm lint             # Run ESLint
pnpm validate-env     # Validate environment
pnpm generate-creds   # Generate secure credentials
pnpm db:push          # Push database schema
pnpm db:generate      # Generate Prisma client
pnpm test             # Run tests (when available)
```

### Development Workflow

See [CONTRIBUTING.md](./CONTRIBUTING.md) for detailed development guidelines including:
- Branch strategy
- Commit conventions
- Pull request process
- Code quality standards
- Security best practices

## Documentation

### 📚 Comprehensive Guides

- **[README.md](./README.md)** - Quick start and overview (you are here)
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Production deployment guide
- **[CONTRIBUTING.md](./CONTRIBUTING.md)** - Development and contribution guidelines
- **[CHANGELOG.md](./CHANGELOG.md)** - Version history and changes
- **[SECURITY.md](./SECURITY.md)** - Security policy and reporting
- **[CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md)** - Community guidelines
- **[PRODUCTION_READINESS.md](./PRODUCTION_READINESS.md)** - Security audit summary
- **[CLAUDE.md](./CLAUDE.md)** - Development with Claude Code

### 🔗 Quick Links

- [GitHub Repository](https://github.com/Systemsaholic/phone-prompt-generator)
- [Issue Tracker](https://github.com/Systemsaholic/phone-prompt-generator/issues)
- [Pull Requests](https://github.com/Systemsaholic/phone-prompt-generator/pulls)
- [Releases](https://github.com/Systemsaholic/phone-prompt-generator/releases)

## Contributing

We welcome contributions! Please see our [Contributing Guide](./CONTRIBUTING.md) for details.

### How to Contribute

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Make your changes** following our coding standards
4. **Commit your changes** (`git commit -m 'feat: add amazing feature'`)
5. **Push to the branch** (`git push origin feature/amazing-feature`)
6. **Open a Pull Request**

### Contribution Guidelines

- Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification
- Ensure all tests pass before submitting PR
- Update documentation as needed
- Add tests for new features
- Maintain code coverage

## Troubleshooting

### Audio Generation Fails
- **API Key Invalid**: Verify your OPENAI_API_KEY is correct
- **Insufficient Credits**: Check you have sufficient API credits
- **Text Too Long**: Ensure text is under 4096 characters
- **Rate Limit**: Wait and retry if hitting rate limits

### Authentication Issues
- **Login Fails**: Verify AUTH_USERNAME and AUTH_PASSWORD are correct
- **Session Lost**: Check SESSION_SECRET is set and consistent
- **Rate Limited**: Wait 15 minutes after 5 failed login attempts

### Docker Issues
- **Port Conflict**: Make sure port 3040 is not in use (`lsof -i :3040`)
- **Build Fails**: Check Docker logs (`docker-compose logs -f`)
- **Rebuild**: Force rebuild if needed (`docker-compose build --no-cache`)
- **Volume Issues**: Check volume permissions

### Database Issues
- **Reset Database**: `pnpm exec prisma db push --force-reset`
- **Permissions**: Check permissions on data directory
- **Migrations**: Run `pnpm db:push` after schema changes

### Environment Issues
- **Validation Fails**: Run `pnpm run validate-env` for detailed errors
- **Missing Variables**: Check .env against .env.example
- **Weak Secrets**: Generate new secrets with `pnpm run generate-creds`

## Security

### Reporting Security Issues

**Do not report security vulnerabilities through public GitHub issues.**

Please report security vulnerabilities by:
- Using GitHub's private vulnerability reporting feature
- Following our [Security Policy](./SECURITY.md)

### Security Features

- ✅ Authentication with rate limiting
- ✅ Cryptographically secure session tokens
- ✅ HMAC-SHA256 token signing
- ✅ Bcrypt password hashing
- ✅ Input validation and sanitization
- ✅ Environment validation
- ✅ HTTPOnly secure cookies
- ✅ Production-ready error handling

See [SECURITY.md](./SECURITY.md) for complete security documentation.

## License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## Support

### Getting Help

- 📖 **Documentation**: Check our [comprehensive guides](#documentation)
- 🐛 **Bug Reports**: [Open an issue](https://github.com/Systemsaholic/phone-prompt-generator/issues/new?template=bug_report.yml)
- 💡 **Feature Requests**: [Request a feature](https://github.com/Systemsaholic/phone-prompt-generator/issues/new?template=feature_request.yml)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/Systemsaholic/phone-prompt-generator/discussions)
- 🔒 **Security**: See [SECURITY.md](./SECURITY.md)

### Community

- **GitHub**: [@Systemsaholic](https://github.com/Systemsaholic)
- **Issues**: [Report bugs or request features](https://github.com/Systemsaholic/phone-prompt-generator/issues)
- **Pull Requests**: [Contribute to the project](https://github.com/Systemsaholic/phone-prompt-generator/pulls)

---

<div align="center">

Made with ❤️ by [Systemsaholic](https://github.com/Systemsaholic)

**[⬆ Back to Top](#phone-prompt-generator)**

</div>