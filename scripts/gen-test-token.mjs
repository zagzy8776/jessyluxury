// Reproduces e2e token generation to debug POS page auth (temporary diagnostic)
import fs from 'fs'

const env = fs.readFileSync('e:/jessy-luxury-website/jessy-luxury/.env', 'utf8')
const match = env.match(/ADMIN_SESSION_SECRET=(.+)/)
const secret = match ? match[1].trim().replace(/^['"]|['"]$/g, '') : ''
if (!secret) { console.error('NO_SECRET_FOUND'); process.exit(1) }

const sessionVersion = parseInt(process.argv[2] || '1', 10)
const expiresAt = Date.now() + 1000 * 60 * 60 * 24 * 7
const payload = `${expiresAt}.${sessionVersion}`
const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload))
const signature = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('')
console.log(`${payload}.${signature}`)
