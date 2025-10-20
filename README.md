# Phone Prompt Generator

A Next.js 14 application for generating professional phone system audio prompts using OpenAI's TTS and GPT-4 APIs with built-in authentication, session management, and 3CX-optimized audio conversion.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Next.js](https://img.shields.io/badge/Next.js-14.2-black)
![License](https://img.shields.io/badge/license-MIT-green)

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

## Troubleshooting

### Audio Generation Fails
- Verify your OpenAI API key is correct
- Check you have sufficient API credits
- Ensure text is under 4096 characters

### Docker Issues
- Make sure port 3040 is not in use
- Check Docker logs: `docker-compose logs -f`
- Rebuild if needed: `docker-compose build --no-cache`

### Database Issues
- Reset database: `pnpm exec prisma db push --force-reset`
- Check permissions on data directory

## License

MIT

## Support

For issues or questions, please open a GitHub issue or contact support.