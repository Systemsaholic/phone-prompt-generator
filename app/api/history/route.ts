import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import fs from 'fs/promises'
import path from 'path'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const generations = await prisma.generation.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    })

    const total = await prisma.generation.count()

    return NextResponse.json({
      generations,
      total,
      limit,
      offset,
    })
  } catch (error) {
    console.error('History fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch history' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json()

    if (!id) {
      return NextResponse.json(
        { error: 'ID is required' },
        { status: 400 }
      )
    }

    // First, get the generation record to find the file path
    const generation = await prisma.generation.findUnique({
      where: { id },
    })

    if (!generation) {
      return NextResponse.json(
        { error: 'Generation not found' },
        { status: 404 }
      )
    }

    // Delete the database record first
    await prisma.generation.delete({
      where: { id },
    })

    // Then try to delete the physical file
    try {
      // Handle both old and new file paths
      const fileUrl = generation.fileUrl
      let filePath: string
      
      if (fileUrl.startsWith('/audio/sessions/')) {
        // New session-based path
        filePath = path.join(process.cwd(), 'public', fileUrl.substring(1))
      } else {
        // Old direct path
        filePath = path.join(process.cwd(), 'public', generation.fileUrl.replace('/', ''))
      }
      
      await fs.unlink(filePath)
      console.log(`Deleted file: ${filePath}`)
    } catch (fileError) {
      // File might not exist or already be deleted - log but don't fail the request
      console.warn(`Could not delete file: ${generation.fileName}`, fileError)
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Generation and file deleted successfully' 
    })
  } catch (error) {
    console.error('History delete error:', error)
    return NextResponse.json(
      { error: 'Failed to delete item' },
      { status: 500 }
    )
  }
}