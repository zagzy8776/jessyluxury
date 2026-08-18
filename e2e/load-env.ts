import fs from 'fs'
import path from 'path'
import dns from 'dns'

dns.setDefaultResultOrder('ipv4first')

function loadDotEnv() {
  const envPath = path.resolve(process.cwd(), '.env')
  if (!fs.existsSync(envPath)) return
  const lines = fs.readFileSync(envPath, 'utf8').split('\n')
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIdx = trimmed.indexOf('=')
    if (eqIdx < 1) continue
    const key = trimmed.slice(0, eqIdx).trim()
    const raw = trimmed.slice(eqIdx + 1).trim()
    const value = raw.replace(/^['"]|['"]$/g, '')
    process.env[key] = value
  }
}

loadDotEnv()
console.log('[E2E Env Loader] Successfully loaded environment from .env')
