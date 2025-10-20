/**
 * Custom error classes and error handling utilities for production
 */

export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public details?: any
  ) {
    super(message)
    this.name = this.constructor.name
    Error.captureStackTrace(this, this.constructor)
  }
}

export class ValidationError extends AppError {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(message: string, details?: any) {
    super(message, 400, 'VALIDATION_ERROR', details)
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 401, 'AUTHENTICATION_ERROR')
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 403, 'AUTHORIZATION_ERROR')
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, 404, 'NOT_FOUND')
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Too many requests') {
    super(message, 429, 'RATE_LIMIT_ERROR')
  }
}

export class ExternalAPIError extends AppError {
  constructor(
    service: string,
    message: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    originalError?: any
  ) {
    super(
      `External API error from ${service}: ${message}`,
      502,
      'EXTERNAL_API_ERROR',
      { service, originalError: originalError?.message }
    )
  }
}

/**
 * Parses OpenAI API errors and returns appropriate error
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function handleOpenAIError(error: any): AppError {
  // Check for common OpenAI error patterns
  if (error?.status === 401 || error?.message?.includes('API key')) {
    return new ExternalAPIError(
      'OpenAI',
      'Invalid API key. Please check your OPENAI_API_KEY configuration.',
      error
    )
  }

  if (error?.status === 429 || error?.message?.includes('rate limit')) {
    return new RateLimitError('OpenAI rate limit exceeded. Please try again later.')
  }

  if (error?.status === 402 || error?.message?.includes('quota')) {
    return new ExternalAPIError(
      'OpenAI',
      'Insufficient quota. Please check your OpenAI billing settings.',
      error
    )
  }

  if (error?.status === 503 || error?.message?.includes('overloaded')) {
    return new ExternalAPIError(
      'OpenAI',
      'Service temporarily unavailable. Please try again in a moment.',
      error
    )
  }

  // Generic OpenAI error
  return new ExternalAPIError(
    'OpenAI',
    error?.message || 'An error occurred while processing your request',
    error
  )
}

/**
 * Log error with appropriate level based on error type
 */
export function logError(error: Error | AppError, context?: string) {
  const timestamp = new Date().toISOString()
  const prefix = context ? `[${context}] ` : ''

  if (error instanceof AppError) {
    // Log client errors (4xx) as warnings
    if (error.statusCode >= 400 && error.statusCode < 500) {
      console.warn(`${timestamp} ${prefix}${error.code}: ${error.message}`, {
        statusCode: error.statusCode,
        details: error.details
      })
    } else {
      // Log server errors (5xx) as errors
      console.error(`${timestamp} ${prefix}${error.code}: ${error.message}`, {
        statusCode: error.statusCode,
        details: error.details,
        stack: error.stack
      })
    }
  } else {
    // Log unexpected errors
    console.error(`${timestamp} ${prefix}Unexpected error:`, {
      message: error.message,
      stack: error.stack
    })
  }
}

/**
 * Format error response for API
 */
export function formatErrorResponse(error: Error | AppError) {
  if (error instanceof AppError) {
    return {
      error: error.message,
      code: error.code,
      statusCode: error.statusCode,
      ...(process.env.NODE_ENV !== 'production' && {
        details: error.details,
        stack: error.stack
      })
    }
  }

  // Don't expose internal error details in production
  return {
    error: process.env.NODE_ENV === 'production'
      ? 'An unexpected error occurred'
      : error.message,
    code: 'INTERNAL_ERROR',
    statusCode: 500,
    ...(process.env.NODE_ENV !== 'production' && {
      stack: error.stack
    })
  }
}
