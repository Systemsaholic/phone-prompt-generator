import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      text,
      voice,
      speed,
      instructions,
      fileName,
      audioUrl,
      mode
    } = body

    if (!text || !voice || !fileName || !audioUrl) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Save to database
    const generation = await prisma.generation.create({
      data: {
        text,
        mode,
        voice,
        speed: speed || 1.0,
        instructions: instructions || undefined,
        format: 'wav',
        fileName,
        fileUrl: audioUrl,
      },
    })

    return NextResponse.json({
      success: true,
      generation,
    })
  } catch (error) {
    console.error('Save audio error:', error)
    return NextResponse.json(
      { error: 'Failed to save audio version' },
      { status: 500 }
    )
  }
}