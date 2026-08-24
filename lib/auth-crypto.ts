const ENCODER = new TextEncoder()

function getConfiguredCustomerSecret(): string | null {
  return process.env.CUSTOMER_SESSION_SECRET || process.env.ADMIN_SESSION_SECRET || null
}

async function getHmacKey(secret: string): Promise<CryptoKey> {
  return await crypto.subtle.importKey(
    'raw',
    ENCODER.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  )
}

export async function generateAdminToken(sessionVersion: number): Promise<string> {
  const secret = process.env.ADMIN_SESSION_SECRET
  if (!secret) {
    throw new Error('ADMIN_SESSION_SECRET is missing. Authentication configuration is invalid.')
  }
  const expiresAt = Date.now() + 1000 * 60 * 60 * 24 * 7
  const payload = `${expiresAt}.${sessionVersion}`
  const key = await getHmacKey(secret)
  const signatureBuffer = await crypto.subtle.sign('HMAC', key, ENCODER.encode(payload))
  const signature = Array.from(new Uint8Array(signatureBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
  return `${payload}.${signature}`
}

export async function isValidTokenSignature(token: string | undefined | null): Promise<{ isValid: boolean; sessionVersion?: number }> {
  const secret = process.env.ADMIN_SESSION_SECRET
  if (!token || !secret) return { isValid: false }

  const parts = token.split('.')
  if (parts.length !== 3) return { isValid: false }

  const [payloadExpires, payloadVersion, signature] = parts
  const expiresAt = parseInt(payloadExpires, 10)
  const sessionVersion = parseInt(payloadVersion, 10)

  if (isNaN(expiresAt) || expiresAt < Date.now() || isNaN(sessionVersion)) {
    return { isValid: false }
  }

  const payload = `${payloadExpires}.${payloadVersion}`
  const key = await getHmacKey(secret)
  const sigBytes = new Uint8Array(signature.match(/.{1,2}/g)?.map(byte => parseInt(byte, 16)) || [])
  const isValid = await crypto.subtle.verify('HMAC', key, sigBytes, ENCODER.encode(payload))

  if (!isValid) return { isValid: false }
  return { isValid: true, sessionVersion }
}

export async function generateCustomerToken(customerId: number): Promise<string> {
  const secret = getConfiguredCustomerSecret()
  if (!secret) {
    throw new Error('CUSTOMER_SESSION_SECRET or ADMIN_SESSION_SECRET is missing. Customer authentication is unavailable.')
  }
  const expiresAt = Date.now() + 1000 * 60 * 60 * 24 * 30
  const payload = `${expiresAt}.${customerId}`
  const key = await getHmacKey(secret)
  const signatureBuffer = await crypto.subtle.sign('HMAC', key, ENCODER.encode(payload))
  const signature = Array.from(new Uint8Array(signatureBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
  return `${payload}.${signature}`
}

export async function verifyCustomerToken(token: string | undefined | null): Promise<{ isValid: boolean; customerId?: number }> {
  const secret = getConfiguredCustomerSecret()
  if (!token || !secret) return { isValid: false }

  const parts = token.split('.')
  if (parts.length !== 3) return { isValid: false }

  const [payloadExpires, payloadCustomerId, signature] = parts
  const expiresAt = parseInt(payloadExpires, 10)
  const customerId = parseInt(payloadCustomerId, 10)

  if (isNaN(expiresAt) || expiresAt < Date.now() || isNaN(customerId)) {
    return { isValid: false }
  }

  const payload = `${payloadExpires}.${payloadCustomerId}`
  const key = await getHmacKey(secret)
  const sigBytes = new Uint8Array(signature.match(/.{1,2}/g)?.map(byte => parseInt(byte, 16)) || [])
  const isValid = await crypto.subtle.verify('HMAC', key, sigBytes, ENCODER.encode(payload))

  if (!isValid) return { isValid: false }
  return { isValid: true, customerId }
}

export async function generateStaffToken(staffId: number, sessionVersion: number): Promise<string> {
  const secret = process.env.ADMIN_SESSION_SECRET
  if (!secret) {
    throw new Error('ADMIN_SESSION_SECRET is missing. Authentication configuration is invalid.')
  }
  const expiresAt = Date.now() + 1000 * 60 * 60 * 24 * 7
  const payload = `${expiresAt}.${staffId}-${sessionVersion}`
  const key = await getHmacKey(secret)
  const signatureBuffer = await crypto.subtle.sign('HMAC', key, ENCODER.encode(payload))
  const signature = Array.from(new Uint8Array(signatureBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
  return `${payload}.${signature}`
}
