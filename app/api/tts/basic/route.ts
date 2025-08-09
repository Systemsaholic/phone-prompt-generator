import { NextRequest, NextResponse } from 'next/server'
import { openai } from '@/lib/openai'
import { prisma } from '@/lib/db'
import { convertTo3CXFormat } from '@/lib/audio-converter'
import { getOrCreateSessionFolder, getSessionFilePath } from '@/lib/session'
import fs from 'fs/promises'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { text, voice, speed, fileName } = body

    if (!text || !voice) {
      return NextResponse.json(
        { error: 'Text and voice are required' },
        { status: 400 }
      )
    }

    // Generate audio using OpenAI TTS
    const mp3 = await openai.audio.speech.create({
      model: 'tts-1-hd',
      voice: voice as any,
      input: text,
      speed: speed || 1.0,
    })

    // Convert to buffer
    const buffer = Buffer.from(await mp3.arrayBuffer())

    // Get or create session folder
    const session = await getOrCreateSessionFolder()
    
    // Generate unique filename for temporary MP3
    const timestamp = Date.now()
    const tempMp3FileName = `temp_${timestamp}.mp3`
    const tempMp3Path = getSessionFilePath(session.id, tempMp3FileName)
    
    await fs.writeFile(tempMp3Path, buffer)

    // Convert MP3 to 3CX WAV format
    const finalWavFileName = fileName ? fileName.replace('.mp3', '.wav') : `prompt_${timestamp}.wav`
    const wavUrl = await convertTo3CXFormat(tempMp3Path, finalWavFileName, session.id)

    // Clean up temporary MP3 file
    await fs.unlink(tempMp3Path)

    // Save to database
    const generation = await prisma.generation.create({
      data: {
        text,
        mode: 'basic',
        voice,
        speed: speed || 1.0,
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
    console.error('TTS Basic Error:', error)
    return NextResponse.json(
      { error: 'Failed to generate and convert audio' },
      { status: 500 }
    )
  }
}