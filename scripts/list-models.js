/** Lists schema models vs DB tables to detect mismatches before establishing migration history. */
const fs = require('fs')
const path = require('path')
const { Pool } = require('pg')
const envPath = path.resolve(process.cwd(), '.env')
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const i = t.indexOf('=')
    if (i < 1) continue
    const k = t.slice(0, i).trim()
    const v = t.slice(i + 1).trim().replace(/^['"]|['"]$/g, '')
    if (!process.env[k]) process.env[k] = v
  }
}
const text = fs.readFileSync(path.resolve(process.cwd(), 'prisma/schema.prisma'), 'utf8')
const models = []
const re = /^model\s+(\w+)/gm
let m
while ((m = re.exec(text)) !== null) models.push(m[1])
const pool = new Pool({ connectionString: process.env.DATABASE_URL })
;(async () => {
  const res = await pool.query(
    "SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE' ORDER BY table_name"
  )
  const tables = res.rows.map((r) => r.table_name)
  console.log('SCHEMA MODELS (' + models.length + '): ' + models.join(', '))
  console.log('DB TABLES (' + tables.length + '): ' + tables.join(', '))
  const tset = new Set(tables)
  const noTable = models.filter((x) => !tset.has(x))
  console.log('MODELS WITHOUT A DB TABLE: ' + (noTable.length ? noTable.join(', ') : 'NONE'))
  const mset = new Set(models)
  const orphan = tables.filter((x) => !mset.has(x))
  console.log('TABLES NOT IN SCHEMA: ' + (orphan.length ? orphan.join(', ') : 'NONE'))
  await pool.end()
})().catch((e) => {
  console.error(e.message)
  process.exit(1)
})