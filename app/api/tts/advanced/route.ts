import { NextRequest, NextResponse } from 'next/server'
import { openai } from '@/lib/openai'
import { prisma } from '@/lib/db'
import { convertTo3CXFormat } from '@/lib/audio-converter'
import { getOrCreateSessionFolder, getSessionFilePath } from '@/lib/session'
import fs from 'fs/promises'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { text, voice, instructions, fileName } = body

    if (!text || !voice || !instructions) {
      return NextResponse.json(
        { error: 'Text, voice, and instructions are required' },
        { status: 400 }
      )
    }

    // Parse instructions to determine speed settings
    // OpenAI TTS API only supports voice selection and speed control
    // We'll map certain characteristics to speed adjustments
    let speed = 1.0
    
    const lowerInstructions = instructions.toLowerCase()
    
    // Map voice characteristics to speed values
    if (lowerInstructions.includes('slow and clear') || lowerInstructions.includes('slowly and clearly')) {
      speed = 0.8
    } else if (lowerInstructions.includes('fast paced') || lowerInstructions.includes('quickly')) {
      speed = 1.5
    } else if (lowerInstructions.includes('very slow')) {
      speed = 0.6
    } else if (lowerInstructions.includes('very fast')) {
      speed = 2.0
    } else if (lowerInstructions.includes('urgent')) {
      speed = 1.3
    } else if (lowerInstructions.includes('calm') || lowerInstructions.includes('soothing')) {
      speed = 0.9
    }
    
    // Note: Other characteristics like accents, tone, etc. are stored for reference
    // but cannot be directly applied via the OpenAI TTS API

    // Generate audio using standard TTS (GPT-4o audio preview requires special API access)
    const mp3 = await openai.audio.speech.create({
      model: 'tts-1-hd',
      voice: voice as 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer',
      input: text,
      speed: speed,
    })

    // Convert to buffer
    const buffer = Buffer.from(await mp3.arrayBuffer())

    // Get or create session folder
    const session = await getOrCreateSessionFolder()
    
    // Generate unique filename for temporary MP3
    const timestamp = Date.now()
    const tempMp3FileName = `temp_advanced_${timestamp}.mp3`
    const tempMp3Path = getSessionFilePath(session.id, tempMp3FileName)
    
    await fs.writeFile(tempMp3Path, buffer)

    // Convert MP3 to 3CX WAV format
    const finalWavFileName = fileName ? fileName.replace('.mp3', '.wav') : `prompt_advanced_${timestamp}.wav`
    const wavUrl = await convertTo3CXFormat(tempMp3Path, finalWavFileName, session.id)

    // Clean up temporary MP3 file
    await fs.unlink(tempMp3Path)

    // Save to database
    const generation = await prisma.generation.create({
      data: {
        text,
        mode: 'advanced',
        voice,
        instructions,
        speed,
        format: 'wav',
        fileName: finalWavFileName,
        fileUrl: wavUrl,
      },
    })

    return NextResponse.json({
      success: true,
      generation,
      audioUrl: wavUrl,
      note: 'Generated and converted to 3CX-compatible WAV format (8kHz, mono, 16-bit)'
    })
  } catch (error) {
    console.error('TTS Advanced Error:', error)
    return NextResponse.json(
      { error: 'Failed to generate and convert advanced audio' },
      { status: 500 }
    )
  }
}