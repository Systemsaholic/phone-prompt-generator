# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Phone Prompt Generator is a Next.js 14 application for generating professional phone system audio prompts using OpenAI's TTS and GPT-4 APIs. The application features dual TTS modes (basic and advanced), template management, audio format conversion optimized for 3CX phone systems, session-based file storage, and simple authentication.

## Authentication

The application uses a simple yet secure cookie-based authentication system. Credentials are stored in environment variables for easy deployment.

**Key Files:**
- `lib/auth.ts`: Authentication utilities (credential validation, session management, password hashing)
- `middleware.ts`: Route protection middleware
- `app/login/page.tsx`: Login page
- `app/api/auth/login/route.ts`: Login endpoint
- `app/api/auth/logout/route.ts`: Logout endpoint

**Configuration:**
Add these to your `.env` file:
```bash
AUTH_USERNAME=admin
AUTH_PASSWORD=admin123  # Or use a bcrypt hash for better security
SESSION_SECRET=your-secret-key-change-this-to-something-random-and-secure
```

**Security Features:**
- HTTP-only session cookies (24-hour expiration)
- Password hashing support (bcrypt)
- Middleware-based route protection
- Secure cookie settings in production

**Protected Routes:**
All routes except `/login` and `/api/auth/login` require authentication. Unauthenticated users are automatically redirected to the login page.

**Password Hashing (Optional):**
For enhanced security, hash your password using the utility:
```typescript
import { hashPassword } from '@/lib/auth'
const hashed = await hashPassword('yourpassword')
// Use the hashed value in .env
```

## Development Commands

### Setup
```bash
pnpm install                    # Install dependencies
cp .env.example .env            # Create environment file (add OPENAI_API_KEY)
pnpm exec prisma db push        # Initialize SQLite database
```

### Development
```bash
pnpm dev                        # Start dev server on port 3040
pnpm build                      # Build for production
pnpm start                      # Start production server
pnpm lint                       # Run ESLint
```

### Database
```bash
pnpm db:push                    # Push schema changes to database
pnpm db:generate                # Generate Prisma client
pnpm exec prisma db push --force-reset  # Reset database completely
```

### Testing
```bash
pnpm exec playwright test       # Run Playwright tests
pnpm exec playwright test --ui  # Run tests in UI mode
```

### Docker
```bash
docker-compose up -d            # Start in Docker (port 3040)
docker-compose logs -f          # View logs
docker-compose build --no-cache # Rebuild image
```

## Architecture

### Session-Based File Storage

Audio files are stored in session-specific folders to prevent conflicts between users. Each user gets a unique session ID stored in a cookie (24-hour expiration).

**Key Files:**
- `lib/session.ts`: Session management, folder creation, cleanup logic
- `app/api/sessions/cleanup/route.ts`: Background cleanup endpoint for old sessions
- Audio storage path: `public/audio/sessions/{sessionId}/`

**Important:** Always use `getOrCreateSessionFolder()` when generating audio files. The session folder is automatically created and cleaned up after 24 hours.

### Audio Conversion Pipeline

All generated audio goes through automatic format conversion for phone system compatibility.

**Flow:**
1. OpenAI generates MP3 audio (via TTS-1-HD model)
2. Temporary MP3 saved to session folder
3. FFmpeg converts to WAV (mono, 8kHz, 16-bit PCM) for 3CX compatibility
4. Original MP3 deleted, WAV returned to user

**Key Files:**
- `lib/audio-converter.ts`: FFmpeg wrapper with phone format presets
- `PHONE_FORMATS`: Preset configurations for 3CX, VoIP standard, high quality, web streaming

**Note:** FFmpeg is dynamically imported to avoid build-time issues. The converter supports custom formats but defaults to 3CX preset.

### TTS Generation Modes

**Basic Mode** (`app/api/tts/basic/route.ts`):
- Direct OpenAI TTS-1-HD API call
- Voice selection + speed control (0.25-4.0)
- Max 4096 characters

**Advanced Mode** (`app/api/tts/advanced/route.ts`):
- Two-step process: GPT-4o generates optimized prompt → TTS-1-HD generates audio
- Natural language instructions for accent, tone, emotion
- System prompt engineering in GPT-4o to match user's voice preferences
- Same character limit and audio conversion as basic mode

### AI Text Generation

The `/api/ai-text` endpoint provides three operations using GPT-4:
- `generate`: Create phone prompts from descriptions (conversational style, natural phrasing)
- `polish`: Improve existing prompts to sound more natural
- `generateFilename`: Auto-generate descriptive filenames with version numbers

**Style Guidelines:** Prompts are optimized to sound like real business phone systems—conversational, not formal. Examples: "Thanks for calling" not "Thank you for contacting", "Please hold" not "Please remain on the line".

### Database Schema

SQLite with Prisma ORM. Two main models:

**Generation:**
- Tracks all audio generations (text, mode, voice, speed, format, file URL)
- Links to templates if used
- `fileUrl` points to session-specific path

**Template:**
- Pre-built prompts with variable replacement
- Categories: voicemail, IVR, hold messages, after hours, holidays
- Variables stored as JSON string array

### Custom Server

`server.js` provides custom HTTP server (required for Docker):
- Handles audio file serving with proper MIME types and caching
- Serves from `public/audio/` directory
- Port 3000 in production (mapped to 3040 in docker-compose)

### Component Architecture

**Main Page** (`app/page.tsx`):
- Tab-based interface (Generate Audio, Templates, History)
- Uses Radix UI components for tabs and dialogs

**Key Components:**
- `TTSBasic.tsx`: Basic TTS interface with voice/speed controls
- `TTSAdvanced.tsx`: Advanced mode with AI-driven voice instructions
- `AITextGenerator.tsx`: GPT-4 text generation for prompts
- `TemplateManager.tsx`: Template CRUD with variable replacement
- `HistoryPanel.tsx`: Generation history with audio preview
- `VoicePreview.tsx`: Sample audio for each voice
- `AudioVersionCard.tsx`: Display audio file with download/delete

## Environment Variables

Required:
- `OPENAI_API_KEY`: OpenAI API key (required for TTS and GPT-4)
- `DATABASE_URL`: SQLite path (default: `file:./data/prompts.db`)
- `NEXT_PUBLIC_APP_URL`: Application URL (default: `http://localhost:3040`)
- `AUDIO_STORAGE_PATH`: Audio storage location (default: `./public/audio`)
- `AUTH_USERNAME`: Login username (default: `admin`)
- `AUTH_PASSWORD`: Login password (plain text or bcrypt hash)
- `SESSION_SECRET`: Secret key for session token generation

## Docker Considerations

- FFmpeg is installed in the Dockerfile (`apt-get install ffmpeg`)
- Database and audio files are mounted as volumes for persistence
- Build args pass environment variables at build time
- Custom server handles static audio file serving with proper headers
- Port mapping: 3000 (container) → 3040 (host)

## Common Patterns

### Generating Audio with Session Support
```typescript
import { getOrCreateSessionFolder } from '@/lib/session'

const session = await getOrCreateSessionFolder()
const outputPath = path.join(session.folderPath, filename)
// Generate audio to outputPath
const publicUrl = `${session.publicPath}/${filename}`
```

### Using Audio Converter
```typescript
import { convertTo3CXFormat } from '@/lib/audio-converter'

const wavUrl = await convertTo3CXFormat(
  tempMp3Path,
  'output.wav',
  sessionId  // Optional: pass session ID for session-specific storage
)
```

### Working with Templates
Templates use variable replacement with `{{variable}}` syntax. Extract variables with regex, then replace in template content.

## API Endpoints

**Authentication:**
- `POST /api/auth/login`: Authenticate user (username, password)
- `POST /api/auth/logout`: Clear session and logout

**Audio Generation:**
- `POST /api/tts/basic`: Generate basic TTS audio
- `POST /api/tts/advanced`: Generate advanced TTS with AI instructions
- `POST /api/ai-text`: AI text generation (generate/polish/generateFilename)

**Data Management:**
- `GET/POST/PUT/DELETE /api/templates`: Template CRUD operations
- `GET/DELETE /api/history`: Generation history management

**Utilities:**
- `POST /api/convert`: Audio format conversion
- `POST /api/sessions/cleanup`: Clean up old session folders
- `GET /api/audio/[...path]`: Serve audio files with proper headers

## Phone System Optimization

Audio is specifically optimized for 3CX phone systems:
- WAV format (not MP3)
- Mono (single channel, not stereo)
- 8 kHz sample rate (lower than standard 16 kHz)
- 16-bit depth (PCM encoding)

This reduces file size and ensures maximum compatibility with VoIP systems.
