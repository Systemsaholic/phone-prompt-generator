import { NextRequest, NextResponse } from 'next/server'
import { openai } from '@/lib/openai'
import { prisma } from '@/lib/db'
import { convertTo3CXFormat } from '@/lib/audio-converter'
import { getOrCreateSessionFolder, getSessionFilePath } from '@/lib/session'
import {
  validateTTSText,
  validateVoice,
  validateSpeed,
  validateFileName,
  parseRequestBody
} from '@/lib/validation'
import {
  AppError,
  handleOpenAIError,
  logError,
  formatErrorResponse
} from '@/lib/errors'
import fs from 'fs/promises'

export async function POST(request: NextRequest) {
  let tempMp3Path: string | null = null

  try {
    // Parse and validate request body
    const body = await parseRequestBody<{
      text: string
      voice: string
      speed?: number
      fileName?: string
    }>(request)

    const validatedText = validateTTSText(body.text)
    const validatedVoice = validateVoice(body.voice)
    const validatedSpeed = validateSpeed(body.speed)
    const validatedFileName = validateFileName(body.fileName)

    // Generate audio using OpenAI TTS
    let mp3
    try {
      mp3 = await openai.audio.speech.create({
        model: 'tts-1-hd',
        voice: validatedVoice,
        input: validatedText,
        speed: validatedSpeed,
      })
    } catch (error) {
      throw handleOpenAIError(error)
    }

    // Convert to buffer
    const buffer = Buffer.from(await mp3.arrayBuffer())

    // Get or create session folder
    const session = await getOrCreateSessionFolder()

    // Generate unique filename for temporary MP3
    const timestamp = Date.now()
    const tempMp3FileName = `temp_${timestamp}.mp3`
    tempMp3Path = getSessionFilePath(session.id, tempMp3FileName)

    await fs.writeFile(tempMp3Path, buffer)

    // Convert MP3 to 3CX WAV format
    const finalWavFileName = validatedFileName
      ? validatedFileName.replace(/\.mp3$/i, '.wav')
      : `prompt_${timestamp}.wav`

    let wavUrl: string
    try {
      wavUrl = await convertTo3CXFormat(tempMp3Path, finalWavFileName, session.id)
    } catch (error) {
      // Clean up temp file on conversion failure
      if (tempMp3Path) {
        await fs.unlink(tempMp3Path).catch(() => {})
      }
      throw new AppError(
        'Failed to convert audio to WAV format',
        500,
        'AUDIO_CONVERSION_ERROR',
        { originalError: error instanceof Error ? error.message : String(error) }
      )
    }

    // Clean up temporary MP3 file
    await fs.unlink(tempMp3Path).catch(err =>
      console.warn('Failed to clean up temp file:', err)
    )
    tempMp3Path = null

    // Save to database
    const generation = await prisma.generation.create({
      data: {
        text: validatedText,
        mode: 'basic',
        voice: validatedVoice,
        speed: validatedSpeed,
        format: 'wav',
        fileName: finalWavFileName,
        fileUrl: wavUrl,
      },
    })

    return NextResponse.json({
      success: true,
      generation,
      audioUrl: wavUrl,
    })
  } catch (error) {
    // Clean up temp file if it exists
    if (tempMp3Path) {
      await fs.unlink(tempMp3Path).catch(() => {})
    }

    logError(error as Error, 'TTS-Basic')

    const errorResponse = formatErrorResponse(error as Error)
    return NextResponse.json(errorResponse, {
      status: errorResponse.statusCode
    })
  }
}