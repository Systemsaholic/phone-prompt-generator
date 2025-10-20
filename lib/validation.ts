/**
 * Input validation utilities for API routes
 */

import { ValidationError } from './errors'

export const VALID_VOICES = [
  'alloy',
  'echo',
  'fable',
  'onyx',
  'nova',
  'shimmer'
] as const

export type ValidVoice = typeof VALID_VOICES[number]

export const TTS_LIMITS = {
  MAX_TEXT_LENGTH: 4096,
  MIN_SPEED: 0.25,
  MAX_SPEED: 4.0,
  DEFAULT_SPEED: 1.0
} as const

/**
 * Validates text input for TTS
 */
export function validateTTSText(text: string): string {
  if (!text || typeof text !== 'string') {
    throw new ValidationError('Text is required and must be a string')
  }

  const trimmedText = text.trim()

  if (trimmedText.length === 0) {
    throw new ValidationError('Text cannot be empty')
  }

  if (trimmedText.length > TTS_LIMITS.MAX_TEXT_LENGTH) {
    throw new ValidationError(
      `Text exceeds maximum length of ${TTS_LIMITS.MAX_TEXT_LENGTH} characters`,
      { length: trimmedText.length, maxLength: TTS_LIMITS.MAX_TEXT_LENGTH }
    )
  }

  return trimmedText
}

/**
 * Validates voice parameter
 */
export function validateVoice(voice: string): ValidVoice {
  if (!voice || typeof voice !== 'string') {
    throw new ValidationError('Voice is required and must be a string')
  }

  if (!VALID_VOICES.includes(voice as ValidVoice)) {
    throw new ValidationError(
      `Invalid voice. Must be one of: ${VALID_VOICES.join(', ')}`,
      { providedVoice: voice, validVoices: VALID_VOICES }
    )
  }

  return voice as ValidVoice
}

/**
 * Validates speed parameter
 */
export function validateSpeed(speed: number | undefined): number {
  if (speed === undefined || speed === null) {
    return TTS_LIMITS.DEFAULT_SPEED
  }

  if (typeof speed !== 'number' || isNaN(speed)) {
    throw new ValidationError('Speed must be a number')
  }

  if (speed < TTS_LIMITS.MIN_SPEED || speed > TTS_LIMITS.MAX_SPEED) {
    throw new ValidationError(
      `Speed must be between ${TTS_LIMITS.MIN_SPEED} and ${TTS_LIMITS.MAX_SPEED}`,
      {
        providedSpeed: speed,
        minSpeed: TTS_LIMITS.MIN_SPEED,
        maxSpeed: TTS_LIMITS.MAX_SPEED
      }
    )
  }

  return speed
}

/**
 * Validates filename
 */
export function validateFileName(fileName: string | undefined): string | undefined {
  if (!fileName) {
    return undefined
  }

  if (typeof fileName !== 'string') {
    throw new ValidationError('Filename must be a string')
  }

  const trimmedName = fileName.trim()

  // Check for invalid characters
  const invalidChars = /[<>:"/\\|?*\x00-\x1f]/g
  if (invalidChars.test(trimmedName)) {
    throw new ValidationError(
      'Filename contains invalid characters',
      { fileName: trimmedName }
    )
  }

  // Check filename length
  if (trimmedName.length > 255) {
    throw new ValidationError('Filename is too long (max 255 characters)')
  }

  return trimmedName
}

/**
 * Validates instructions for advanced TTS
 */
export function validateInstructions(instructions: string): string {
  if (!instructions || typeof instructions !== 'string') {
    throw new ValidationError('Instructions are required and must be a string')
  }

  const trimmedInstructions = instructions.trim()

  if (trimmedInstructions.length === 0) {
    throw new ValidationError('Instructions cannot be empty')
  }

  if (trimmedInstructions.length > 1000) {
    throw new ValidationError(
      'Instructions are too long (max 1000 characters)',
      { length: trimmedInstructions.length }
    )
  }

  return trimmedInstructions
}

/**
 * Safely parse JSON request body
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function parseRequestBody<T = any>(request: Request): Promise<T> {
  try {
    return await request.json()
  } catch {
    throw new ValidationError('Invalid JSON in request body')
  }
}
