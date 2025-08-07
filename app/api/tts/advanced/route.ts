import { NextRequest, NextResponse } from 'next/server'
import { openai } from '@/lib/openai'
import { prisma } from '@/lib/db'
import { convertTo3CXFormat } from '@/lib/audio-converter'
import fs from 'fs/promises'
import path from 'path'

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

    // For now, we'll use the standard TTS API with speed control
    // The instructions can be used to determine speed settings
    let speed = 1.0
    
    // Parse instructions for speed hints
    if (instructions.toLowerCase().includes('fast') || instructions.toLowerCase().includes('quick')) {
      speed = 1.5
    } else if (instructions.toLowerCase().includes('slow') || instructions.toLowerCase().includes('clear')) {
      speed = 0.8
    } else if (instructions.toLowerCase().includes('very slow')) {
      speed = 0.6
    } else if (instructions.toLowerCase().includes('very fast')) {
      speed = 2.0
    }

    // Generate audio using standard TTS (GPT-4o audio preview requires special API access)
    const mp3 = await openai.audio.speech.create({
      model: 'tts-1-hd',
      voice: voice as any,
      input: text,
      speed: speed,
    })

    // Convert to buffer
    const buffer = Buffer.from(await mp3.arrayBuffer())

    // Generate unique filename for temporary MP3
    const timestamp = Date.now()
    const tempMp3FileName = `temp_advanced_${timestamp}.mp3`
    const audioDir = path.join(process.cwd(), 'public', 'audio')
    
    // Ensure directory exists
    await fs.mkdir(audioDir, { recursive: true })
    
    const tempMp3Path = path.join(audioDir, tempMp3FileName)
    await fs.writeFile(tempMp3Path, buffer)

    // Convert MP3 to 3CX WAV format
    const finalWavFileName = fileName ? fileName.replace('.mp3', '.wav') : `prompt_advanced_${timestamp}.wav`
    const wavUrl = await convertTo3CXFormat(tempMp3Path, finalWavFileName)

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