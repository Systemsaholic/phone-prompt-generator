import { cookies } from 'next/headers'
import { randomUUID } from 'crypto'
import path from 'path'
import fs from 'fs/promises'

const SESSION_COOKIE_NAME = 'audio_session_id'
const SESSION_DURATION = 24 * 60 * 60 * 1000 // 24 hours in milliseconds
const SESSIONS_BASE_PATH = path.join(process.cwd(), 'public', 'audio', 'sessions')

export interface SessionInfo {
  id: string
  folderPath: string
  publicPath: string
}

/**
 * Gets or creates a session ID for the current user
 */
export async function getOrCreateSessionId(): Promise<string> {
  const cookieStore = await cookies()
  let sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value

  if (!sessionId) {
    // Generate a new session ID
    sessionId = `session_${Date.now()}_${randomUUID().substring(0, 8)}`
    
    // Set the session cookie
    cookieStore.set(SESSION_COOKIE_NAME, sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: SESSION_DURATION / 1000, // maxAge is in seconds
      path: '/'
    })
  }

  return sessionId
}

/**
 * Gets the session folder paths for a given session ID
 */
export async function getSessionPaths(sessionId: string): Promise<SessionInfo> {
  const folderPath = path.join(SESSIONS_BASE_PATH, sessionId)
  const publicPath = `/audio/sessions/${sessionId}`

  // Ensure the session folder exists
  await fs.mkdir(folderPath, { recursive: true })

  return {
    id: sessionId,
    folderPath,
    publicPath
  }
}

/**
 * Gets or creates session folder for the current user
 */
export async function getOrCreateSessionFolder(): Promise<SessionInfo> {
  const sessionId = await getOrCreateSessionId()
  return getSessionPaths(sessionId)
}

/**
 * Cleans up old session folders (older than 24 hours)
 */
export async function cleanupOldSessions(): Promise<number> {
  try {
    // Ensure sessions directory exists
    await fs.mkdir(SESSIONS_BASE_PATH, { recursive: true })
    
    const sessions = await fs.readdir(SESSIONS_BASE_PATH)
    const now = Date.now()
    let cleanedCount = 0

    for (const sessionFolder of sessions) {
      const sessionPath = path.join(SESSIONS_BASE_PATH, sessionFolder)
      
      try {
        const stats = await fs.stat(sessionPath)
        const age = now - stats.mtimeMs
        
        // Remove folders older than 24 hours
        if (age > SESSION_DURATION) {
          await fs.rm(sessionPath, { recursive: true, force: true })
          cleanedCount++
          console.log(`Cleaned up old session: ${sessionFolder}`)
        }
      } catch (error) {
        console.error(`Error checking session folder ${sessionFolder}:`, error)
      }
    }

    return cleanedCount
  } catch (error) {
    console.error('Error during session cleanup:', error)
    return 0
  }
}

/**
 * Removes a specific session folder
 */
export async function removeSession(sessionId: string): Promise<void> {
  const sessionPath = path.join(SESSIONS_BASE_PATH, sessionId)
  
  try {
    await fs.rm(sessionPath, { recursive: true, force: true })
    console.log(`Removed session: ${sessionId}`)
  } catch (error) {
    console.error(`Error removing session ${sessionId}:`, error)
  }
}

/**
 * Gets the full file path for a file in a session
 */
export function getSessionFilePath(sessionId: string, fileName: string): string {
  return path.join(SESSIONS_BASE_PATH, sessionId, fileName)
}

/**
 * Gets the public URL for a file in a session
 */
export function getSessionFileUrl(sessionId: string, fileName: string): string {
  return `/audio/sessions/${sessionId}/${fileName}`
}