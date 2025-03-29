import { createError } from 'h3'
import { getUserPocketBase, getAdminPocketBase } from '../utils/pocketbase'
import crypto from 'crypto'

// Function to generate a secure random API key
function generateApiKey() {
  // Generate a random buffer of 32 bytes
  const buffer = crypto.randomBytes(32)
  // Convert to base64 and replace non-alphanumeric characters
  const key = buffer.toString('base64').replace(/[^a-zA-Z0-9]/g, '')
  // Format as 'apf_' prefix followed by the key
  return `apf_${key}`
}

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { name, expiresIn } = body

    if (!name || !expiresIn) {
      throw createError({
        statusCode: 400,
        message: 'Missing required fields'
      })
    }

    // Get token from authorization header
    const authHeader = getHeader(event, 'authorization')
    const token = authHeader?.replace('Bearer ', '')

    if (!token) {
      throw createError({
        statusCode: 401,
        message: 'No authorization token provided'
      })
    }

    // Get user pocketbase instance and verify user is authenticated
    const userPb = await getUserPocketBase(token)
    if (!userPb.authStore.isValid || !userPb.authStore.record?.id) {
      throw createError({
        statusCode: 401,
        message: 'Unauthorized'
      })
    }

    const userId = userPb.authStore.record.id
    const adminPb = getAdminPocketBase()

    // Calculate expiration date
    const expiresDate = new Date()
    expiresDate.setDate(expiresDate.getDate() + expiresIn)

    // Generate secure random API key
    const apiKey = generateApiKey()

    // Create API key record
    const apiKeyData = {
      name,
      key: apiKey,
      user_id: userId,
      last_used: new Date().toISOString(),
      expires: expiresDate.toISOString()
    }

    const record = await adminPb.collection('api_keys').create(apiKeyData)

    return {
      key: apiKey,
      expires: expiresDate.toISOString()
    }
  } catch (error: any) {
    throw createError({
      statusCode: error.status || 500,
      message: error.message || 'Internal Server Error'
    })
  }
})