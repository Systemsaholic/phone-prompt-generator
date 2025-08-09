import path from 'path'
import fs from 'fs/promises'

// Dynamic import to avoid build-time issues
let ffmpeg: any = null
let ffmpegPath: string | undefined = undefined

// Only import fluent-ffmpeg when actually needed
async function initFFmpeg() {
  if (!ffmpeg) {
    try {
      ffmpeg = (await import('fluent-ffmpeg')).default
      
      // Try to set ffmpeg path if available
      try {
        const ffmpegInstaller = await import('@ffmpeg-installer/ffmpeg')
        ffmpegPath = ffmpegInstaller.path
        if (ffmpegPath) {
          ffmpeg.setFfmpegPath(ffmpegPath)
        }
      } catch (e) {
        console.warn('FFmpeg installer not available, using system ffmpeg')
        // Will use system ffmpeg if available
      }
    } catch (e) {
      console.error('Failed to load ffmpeg:', e)
      throw new Error('FFmpeg is not available')
    }
  }
  return ffmpeg
}

export interface AudioFormat {
  format: string
  channels: number
  sampleRate: number
  bitDepth?: number
  codec?: string
}

// Preset formats for phone systems
export const PHONE_FORMATS = {
  '3cx': {
    format: 'wav',
    channels: 1, // Mono
    sampleRate: 8000, // 8 kHz
    bitDepth: 16,
  },
  'voip_standard': {
    format: 'wav',
    channels: 1,
    sampleRate: 16000,
    bitDepth: 16,
  },
  'high_quality': {
    format: 'mp3',
    channels: 2,
    sampleRate: 48000,
    codec: 'libmp3lame',
  },
  'web_streaming': {
    format: 'mp3',
    channels: 1,
    sampleRate: 24000,
    codec: 'libmp3lame',
  },
}

export async function convertAudio(
  inputPath: string,
  outputPath: string,
  format: AudioFormat
): Promise<void> {
  const ffmpeg = await initFFmpeg()
  
  return new Promise((resolve, reject) => {
    let command = ffmpeg(inputPath)

    // Set audio channels (mono/stereo)
    command = command.audioChannels(format.channels)

    // Set sample rate
    command = command.audioFrequency(format.sampleRate)

    // Set codec if specified
    if (format.codec) {
      command = command.audioCodec(format.codec)
    }

    // Set bit depth for WAV files (use PCM format)
    if (format.format === 'wav' && format.bitDepth) {
      command = command.audioCodec('pcm_s16le') // 16-bit PCM
    }

    // Set output format
    command = command.toFormat(format.format)

    command
      .on('error', (err: any) => {
        console.error('FFmpeg error:', err)
        reject(err)
      })
      .on('end', () => {
        resolve()
      })
      .save(outputPath)
  })
}

export async function convertTo3CXFormat(
  inputPath: string,
  outputFileName: string,
  sessionId?: string
): Promise<string> {
  let outputDir: string
  let publicUrl: string
  
  if (sessionId) {
    // Use session-specific folder
    outputDir = path.join(process.cwd(), 'public', 'audio', 'sessions', sessionId)
    publicUrl = `/audio/sessions/${sessionId}/${outputFileName}`
  } else {
    // Fallback to old behavior for backward compatibility
    outputDir = path.join(process.cwd(), 'public', 'audio')
    publicUrl = `/audio/${outputFileName}`
  }
  
  await fs.mkdir(outputDir, { recursive: true })
  
  const outputPath = path.join(outputDir, outputFileName)
  
  await convertAudio(inputPath, outputPath, PHONE_FORMATS['3cx'])
  
  return publicUrl
}