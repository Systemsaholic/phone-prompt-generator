import { NextRequest, NextResponse } from 'next/server'
import {
  validateCredentials,
  createSession,
  isRateLimited,
  recordFailedAttempt,
  clearLoginAttempts
} from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, password } = body

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      )
    }

    // Get client identifier (IP address or fallback)
    const clientIp = request.headers.get('x-forwarded-for') ||
                     request.headers.get('x-real-ip') ||
                     'unknown'
    const identifier = clientIp.split(',')[0].trim()

    // Check rate limiting
    if (isRateLimited(identifier)) {
      console.warn(`Rate limit exceeded for IP: ${identifier}`)
      return NextResponse.json(
        { error: 'Too many login attempts. Please try again later.' },
        { status: 429 }
      )
    }

    // Validate credentials
    const isValid = await validateCredentials(username, password)

    if (!isValid) {
      recordFailedAttempt(identifier)
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      )
    }

    // Clear failed attempts on successful login
    clearLoginAttempts(identifier)

    // Create session
    await createSession()

    return NextResponse.json({
      success: true,
      message: 'Login successful'
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'An error occurred during login' },
      { status: 500 }
    )
  }
}
