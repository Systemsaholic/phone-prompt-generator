#!/usr/bin/env node
/**
 * Utility script to generate secure credentials for production deployment
 *
 * Usage:
 *   npx tsx scripts/generate-credentials.ts
 *
 * Or add to package.json scripts:
 *   "generate-creds": "tsx scripts/generate-credentials.ts"
 */

import crypto from 'crypto'
import bcrypt from 'bcrypt'
import readline from 'readline'

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

function question(query: string): Promise<string> {
  return new Promise(resolve => {
    rl.question(query, resolve)
  })
}

async function generateCredentials() {
  console.log('\n🔐 Secure Credentials Generator')
  console.log('================================\n')

  // Generate SESSION_SECRET
  const sessionSecret = crypto.randomBytes(32).toString('base64')
  console.log('✅ Generated SESSION_SECRET:')
  console.log(`   ${sessionSecret}\n`)

  // Get username
  const username = await question('Enter username (default: admin): ')
  const finalUsername = username.trim() || 'admin'

  // Get password
  let password = ''
  let confirmPassword = ''

  while (true) {
    password = await question('Enter password (min 8 characters): ')

    if (password.length < 8) {
      console.log('❌ Password must be at least 8 characters long\n')
      continue
    }

    confirmPassword = await question('Confirm password: ')

    if (password !== confirmPassword) {
      console.log('❌ Passwords do not match\n')
      continue
    }

    break
  }

  // Hash password
  console.log('\n⏳ Hashing password...')
  const hashedPassword = await bcrypt.hash(password, 10)

  // Display results
  console.log('\n✅ Credentials generated successfully!\n')
  console.log('Add these to your .env file:\n')
  console.log('─'.repeat(60))
  console.log(`AUTH_USERNAME=${finalUsername}`)
  console.log(`AUTH_PASSWORD=${hashedPassword}`)
  console.log(`SESSION_SECRET=${sessionSecret}`)
  console.log('─'.repeat(60))
  console.log('\n⚠️  IMPORTANT:')
  console.log('   - Keep these credentials secure')
  console.log('   - Never commit them to version control')
  console.log('   - Store them in a secure location (e.g., password manager)')
  console.log('   - For Docker deployments, set these as environment variables\n')

  rl.close()
}

generateCredentials().catch(error => {
  console.error('Error generating credentials:', error)
  process.exit(1)
})
