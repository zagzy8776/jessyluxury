/**
 * Ensures exactly one default StoreLocation exists (at-most-one invariant).
 * If zero defaults exist, promotes the most recently updated location.
 * If more than one exist, demotes extras keeping the most recently updated.
 */
const fs = require('fs')
const path = require('path')
const { Client } = require('pg')

function loadEnv(p) {
  const c = fs.readFileSync(p, 'utf8')
  const o = {}
  for (const l of c.split(/\r?\n/)) {
    const i = l.indexOf('=')
    if (i > 0) {
      const k = l.slice(0, i).trim()
      const v = l.slice(i + 1).trim().replace(/^"|"$/g, '')
      if (k && !k.startsWith('#')) o[k] = v
    }
  }
  return o
}

const envVars = loadEnv(path.join(__dirname, '..', '.env'))
const dbUrl = envVars.DATABASE_URL

async function main() {
  const client = new Client({ connectionString: dbUrl, connectionTimeoutMillis: 30000 })
  await client.connect()

  // Count existing defaults
  const cntRes = await client.query('SELECT COUNT(*)::int AS cnt FROM "StoreLocation" WHERE "isDefault" = true')
  const defaultCount = parseInt(cntRes.rows[0].cnt, 10)
  console.log('Default location count before fix:', defaultCount)

  if (defaultCount === 0) {
    // Promote the most recently updated location
    const latest = await client.query('SELECT id, name FROM "StoreLocation" ORDER BY "updatedAt" DESC, id DESC LIMIT 1')
    if (latest.rows.length > 0) {
      await client.query('UPDATE "StoreLocation" SET "isDefault" = true WHERE id = $1', [latest.rows[0].id])
      console.log('Promoted location id=' + latest.rows[0].id + ' name=' + latest.rows[0].name + ' to default')
    } else {
      console.log('No StoreLocation rows exist - nothing to promote')
    }
  } else if (defaultCount > 1) {
    // Demote all but the most recently updated
    await client.query('UPDATE "StoreLocation" SET "isDefault" = false WHERE "isDefault" = true AND id <> (SELECT id FROM "StoreLocation" WHERE "isDefault" = true ORDER BY "updatedAt" DESC, id DESC LIMIT 1)')
    console.log('Demoted extra defaults, keeping only the most recent')
  }

  const afterRes = await client.query('SELECT COUNT(*)::int AS cnt FROM "StoreLocation" WHERE "isDefault" = true')
  const afterCount = parseInt(afterRes.rows[0].cnt, 10)
  console.log('Default location count after fix:', afterCount)

  await client.end()
  console.log('✅ Done')
}

main().catch(e => {
  console.error('❌ Error:', e.message)
  process.exit(1)
})
