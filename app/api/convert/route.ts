import { NextRequest, NextResponse } from 'next/server'
import { convertAudio, PHONE_FORMATS } from '@/lib/audio-converter'
import path from 'path'
import fs from 'fs/promises'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { audioUrl, formatPreset, customFormat } = body

    if (!audioUrl) {
      return NextResponse.json(
        { error: 'Audio URL is required' },
        { status: 400 }
      )
    }

    // Get input file path
    const inputFileName = audioUrl.replace('/audio/', '')
    const inputPath = path.join(process.cwd(), 'public', 'audio', inputFileName)

    // Check if file exists
    try {
      await fs.access(inputPath)
    } catch {
      return NextResponse.json(
        { error: 'Audio file not found' },
        { status: 404 }
      )
    }

    // Determine format settings
    let format
    if (formatPreset && PHONE_FORMATS[formatPreset as keyof typeof PHONE_FORMATS]) {
      format = PHONE_FORMATS[formatPreset as keyof typeof PHONE_FORMATS]
    } else if (customFormat) {
      format = customFormat
    } else {
      format = PHONE_FORMATS['3cx'] // Default to 3CX format
    }

    // Generate output filename
    const timestamp = Date.now()
    const extension = format.format
    const outputFileName = `converted_${timestamp}.${extension}`
    const outputPath = path.join(process.cwd(), 'public', 'audio', outputFileName)

    // Convert audio
    await convertAudio(inputPath, outputPath, format)

    return NextResponse.json({
      success: true,
      convertedUrl: `/audio/${outputFileName}`,
      format,
    })
  } catch (error) {
    console.error('Audio conversion error:', error)
    return NextResponse.json(
      { error: 'Failed to convert audio' },
      { status: 500 }
    )
  }
}