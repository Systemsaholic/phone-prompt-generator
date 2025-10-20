/**
 * Environment variable validation for production readiness (JavaScript version)
 * This module ensures all required environment variables are set
 * and meet minimum security requirements before the app starts
 */

/**
 * Validates all required environment variables
 */
function validateEnvironment() {
  const errors = []
  const warnings = []

  // Required variables
  const required = {
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    AUTH_USERNAME: process.env.AUTH_USERNAME,
    AUTH_PASSWORD: process.env.AUTH_PASSWORD,
    SESSION_SECRET: process.env.SESSION_SECRET,
    DATABASE_URL: process.env.DATABASE_URL,
  }

  // Check for missing required variables
  for (const [key, value] of Object.entries(required)) {
    if (!value || value.trim() === '') {
      errors.push(`${key} is not set`)
    }
  }

  // Production-specific validations
  if (process.env.NODE_ENV === 'production') {
    // Validate SESSION_SECRET strength
    const sessionSecret = process.env.SESSION_SECRET
    if (sessionSecret) {
      if (sessionSecret.length < 32) {
        errors.push('SESSION_SECRET must be at least 32 characters long in production')
      }
      if (sessionSecret.includes('change-this') || sessionSecret.includes('your-secret')) {
        errors.push('SESSION_SECRET appears to be using default/example value. Generate a secure random secret.')
      }
    }

    // Validate AUTH_PASSWORD is not using default
    const authPassword = process.env.AUTH_PASSWORD
    if (authPassword && (authPassword === 'admin123' || authPassword === 'password')) {
      errors.push('AUTH_PASSWORD is using a weak default value. Please use a strong password or bcrypt hash.')
    }

    // Check if AUTH_PASSWORD is hashed (bcrypt hashes start with $2a$, $2b$, or $2y$)
    if (authPassword && !authPassword.match(/^\$2[aby]\$/)) {
      warnings.push('AUTH_PASSWORD is not bcrypt hashed. Consider using hashPassword() utility for better security.')
    }

    // Validate OPENAI_API_KEY format
    const apiKey = process.env.OPENAI_API_KEY
    if (apiKey && !apiKey.startsWith('sk-')) {
      warnings.push('OPENAI_API_KEY does not match expected format (should start with sk-)')
    }

    // Check secure cookies
    if (!process.env.NEXT_PUBLIC_APP_URL?.startsWith('https://')) {
      warnings.push('NEXT_PUBLIC_APP_URL is not using HTTPS. Session cookies will not be fully secure.')
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  }
}

/**
 * Validates environment and logs results
 * Throws error if validation fails in production
 */
function validateAndLog() {
  const result = validateEnvironment()

  if (result.warnings.length > 0) {
    console.warn('⚠️  Environment warnings:')
    result.warnings.forEach(warning => console.warn(`   - ${warning}`))
  }

  if (!result.valid) {
    console.error('❌ Environment validation failed:')
    result.errors.forEach(error => console.error(`   - ${error}`))

    if (process.env.NODE_ENV === 'production') {
      throw new Error('Environment validation failed. Cannot start in production mode.')
    } else {
      console.error('\n⚠️  Starting in development mode with invalid environment.')
      console.error('   Please fix these issues before deploying to production.\n')
    }
  } else {
    console.log('✅ Environment validation passed')
  }
}

module.exports = {
  validateEnvironment,
  validateAndLog,
}
