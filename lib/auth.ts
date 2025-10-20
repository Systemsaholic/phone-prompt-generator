import bcrypt from 'bcrypt'
import { cookies } from 'next/headers'
import crypto from 'crypto'

const SESSION_COOKIE_NAME = 'auth_session'
const SESSION_DURATION = 24 * 60 * 60 * 1000 // 24 hours

interface AuthCredentials {
  username: string
  password: string
}

interface SessionData {
  token: string
  expiresAt: number
  createdAt: number
}

// In-memory session store (for production, consider Redis or database)
const sessionStore = new Map<string, SessionData>()

// Login attempt tracking for rate limiting
const loginAttempts = new Map<string, { count: number; resetAt: number }>()
const MAX_LOGIN_ATTEMPTS = 5
const LOCKOUT_DURATION = 15 * 60 * 1000 // 15 minutes

/**
 * Check if an IP is rate limited
 */
export function isRateLimited(identifier: string): boolean {
  const attempts = loginAttempts.get(identifier)
  if (!attempts) return false

  // Reset if lockout period has passed
  if (Date.now() > attempts.resetAt) {
    loginAttempts.delete(identifier)
    return false
  }

  return attempts.count >= MAX_LOGIN_ATTEMPTS
}

/**
 * Record a failed login attempt
 */
export function recordFailedAttempt(identifier: string): void {
  const attempts = loginAttempts.get(identifier)

  if (!attempts) {
    loginAttempts.set(identifier, {
      count: 1,
      resetAt: Date.now() + LOCKOUT_DURATION
    })
  } else {
    attempts.count++
    if (attempts.count >= MAX_LOGIN_ATTEMPTS) {
      attempts.resetAt = Date.now() + LOCKOUT_DURATION
    }
  }
}

/**
 * Clear login attempts on successful login
 */
export function clearLoginAttempts(identifier: string): void {
  loginAttempts.delete(identifier)
}

/**
 * Validates user credentials against environment variables
 */
export async function validateCredentials(username: string, password: string): Promise<boolean> {
  const validUsername = process.env.AUTH_USERNAME
  const validPassword = process.env.AUTH_PASSWORD

  if (!validUsername || !validPassword) {
    console.error('AUTH_USERNAME or AUTH_PASSWORD not set in environment variables')
    return false
  }

  // Use timing-safe comparison for username
  const usernameMatch = crypto.timingSafeEqual(
    Buffer.from(username.padEnd(100)),
    Buffer.from(validUsername.padEnd(100))
  )

  if (!usernameMatch) {
    return false
  }

  // For plain text password in env (simple mode)
  // In production, you should hash the password in .env
  if (password === validPassword) {
    return true
  }

  // Also support bcrypt hashed passwords in env
  try {
    const isValid = await bcrypt.compare(password, validPassword)
    return isValid
  } catch (error) {
    // If it's not a valid bcrypt hash, fall back to plain text comparison above
    return false
  }
}

/**
 * Creates a session for authenticated user
 */
export async function createSession(): Promise<void> {
  if (!process.env.SESSION_SECRET) {
    throw new Error('SESSION_SECRET must be set in environment variables')
  }

  const cookieStore = await cookies()
  const sessionToken = generateSessionToken()
  const expiresAt = Date.now() + SESSION_DURATION

  // Store session data
  sessionStore.set(sessionToken, {
    token: sessionToken,
    expiresAt,
    createdAt: Date.now()
  })

  // Sign the token with HMAC for integrity
  const signature = signToken(sessionToken)
  const signedToken = `${sessionToken}.${signature}`

  cookieStore.set(SESSION_COOKIE_NAME, signedToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_DURATION / 1000, // maxAge is in seconds
    path: '/'
  })
}

/**
 * Destroys the current session
 */
export async function destroySession(): Promise<void> {
  const cookieStore = await cookies()
  const signedToken = cookieStore.get(SESSION_COOKIE_NAME)?.value

  if (signedToken) {
    const [token] = signedToken.split('.')
    sessionStore.delete(token)
  }

  cookieStore.delete(SESSION_COOKIE_NAME)
}

/**
 * Checks if user is authenticated and validates session
 */
export async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies()
  const signedToken = cookieStore.get(SESSION_COOKIE_NAME)?.value

  if (!signedToken) {
    return false
  }

  // Verify token signature
  const [token, signature] = signedToken.split('.')
  if (!token || !signature) {
    return false
  }

  const expectedSignature = signToken(token)
  if (signature !== expectedSignature) {
    console.warn('Invalid session signature detected')
    return false
  }

  // Check if session exists and is not expired
  const session = sessionStore.get(token)
  if (!session) {
    return false
  }

  if (Date.now() > session.expiresAt) {
    sessionStore.delete(token)
    return false
  }

  return true
}

/**
 * Generates a cryptographically secure random session token
 */
function generateSessionToken(): string {
  // Generate 32 bytes of random data
  const randomBytes = crypto.randomBytes(32)
  return randomBytes.toString('base64url')
}

/**
 * Sign a token with HMAC for integrity verification
 */
function signToken(token: string): string {
  const secret = process.env.SESSION_SECRET!
  const hmac = crypto.createHmac('sha256', secret)
  hmac.update(token)
  return hmac.digest('base64url')
}

/**
 * Hash a password using bcrypt (utility for generating hashed passwords)
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10
  return bcrypt.hash(password, saltRounds)
}

/**
 * Clean up expired sessions (should be run periodically)
 */
export function cleanupExpiredSessions(): void {
  const now = Date.now()
  for (const [token, session] of sessionStore.entries()) {
    if (now > session.expiresAt) {
      sessionStore.delete(token)
    }
  }
}
