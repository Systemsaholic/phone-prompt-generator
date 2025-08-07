# Phone Prompt Generator

A professional web application for generating high-quality audio prompts for phone systems using OpenAI's Text-to-Speech API. Perfect for creating IVR messages, voicemail greetings, hold music announcements, and more.

## Features

### 🎯 Dual TTS Modes
- **Basic Mode**: Simple voice and speed controls using OpenAI's standard TTS API
- **Advanced Mode**: Natural language instructions for accent, tone, emotion, and style using GPT-4o

### 🎤 Voice Options
All 10 OpenAI voices available:
- Alloy, Ash, Ballad, Coral, Echo, Fable, Nova, Onyx, Sage, Shimmer

### 📝 Template System
Pre-built templates with variable replacement:
- Voicemail Greetings
- IVR Main Menu
- Hold Messages
- After Hours Messages
- Holiday Greetings
- Custom Templates

### 🔊 Audio Format Support
- **3CX Phone System**: WAV, Mono, 8kHz, 16-bit (optimized preset)
- **Standard VoIP**: WAV, Mono, 16kHz, 16-bit
- **High Quality**: MP3, Stereo, 48kHz
- **Web Streaming**: MP3, Mono, 24kHz
- **Custom Formats**: User-defined settings

### 📊 Additional Features
- Generation history tracking
- Custom filename support
- Audio preview and download
- SQLite database for persistence
- Docker deployment ready

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

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env and add your OPENAI_API_KEY
```

4. Initialize the database:
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

```env
# OpenAI API Configuration
OPENAI_API_KEY=your_openai_api_key_here

# Database Configuration
DATABASE_URL="file:./data/prompts.db"

# Application Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3040

# Audio Storage Path
AUDIO_STORAGE_PATH=./public/audio
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