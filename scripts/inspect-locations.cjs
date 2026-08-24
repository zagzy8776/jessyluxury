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

  const r = await client.query('SELECT id, name, "isDefault" FROM "StoreLocation" ORDER BY id')
  console.log('StoreLocations (' + r.rows.length + ' rows):')
  r.rows.forEach(l => {
    console.log('  id=' + l.id + ' default=' + l.isDefault + ' name=' + l.name)
  })

  const cnt = await client.query('SELECT COUNT(*)::int AS c FROM "StoreLocation" WHERE "isDefault" = true')
  console.log('Default count:', cnt.rows[0].c)

  await client.end()
}

main().catch(e => { console.error('Error:', e.message); process.exit(1) })
