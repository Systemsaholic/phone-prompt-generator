import { NextRequest, NextResponse } from 'next/server'
import { cleanupOldSessions } from '@/lib/session'

export async function POST(request: NextRequest) {
  try {
    // Only allow cleanup in production or with a specific header
    const authHeader = request.headers.get('x-cleanup-auth')
    const isAuthorized = process.env.NODE_ENV === 'development' || 
                        authHeader === process.env.CLEANUP_SECRET_KEY
    
    if (!isAuthorized) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    const cleanedCount = await cleanupOldSessions()
    
    return NextResponse.json({
      success: true,
      message: `Cleaned up ${cleanedCount} old session(s)`,
      cleanedCount
    })
  } catch (error) {
    console.error('Session cleanup error:', error)
    return NextResponse.json(
      { error: 'Failed to cleanup sessions' },
      { status: 500 }
    )
  }
}

// Optional: Allow GET for manual cleanup trigger in development
export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'Method not allowed in production' },
      { status: 405 }
    )
  }
  
  return POST(request)
}