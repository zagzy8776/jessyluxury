/**
 * Applies the baseline migration SQL directly to Neon (db not yet under Prisma Migrate).
 * Reads prisma/baseline-final.sql and executes statement-by-statement within a transaction.
 * Usage: node scripts/apply-baseline-sql.js
 */
const { Pool } = require('pg')
const fs = require('fs')
const path = require('path')

const envPath = path.resolve(process.cwd(), '.env')
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const eqIdx = t.indexOf('=')
    if (eqIdx < 1) continue
    const k = t.slice(0, eqIdx).trim()
    const v = t.slice(eqIdx + 1).trim().replace(/^['"]|['"]$/g, '')
    if (!process.env[k]) process.env[k] = v
  }
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

function splitStatements(sqlText) {
  // Strip comment-only lines (lines whose first non-space chars are --) so they
  // don't get prepended onto the first real statement.
  const stripped = sqlText
    .split(/\r?\n/)
    .filter((ln) => !ln.trimStart().startsWith('--'))
    .join('\n')
  const statements = []
  let cur = ''
  let inStr = false
  let strCh = ''
  for (let i = 0; i < stripped.length; i++) {
    const ch = stripped[i]
    if (inStr) {
      cur += ch
      if (ch === strCh && stripped[i - 1] !== '\\') {
        inStr = false
        strCh = ''
      }
    } else if (ch === "'" || ch === '"') {
      inStr = true
      strCh = ch
      cur += ch
    } else if (ch === ';') {
      const s = cur.trim()
      if (s) statements.push(s)
      cur = ''
    } else {
      cur += ch
    }
  }
  const s = cur.trim()
  if (s) statements.push(s)
  return statements
}

;(async () => {
  const sqlPath = path.resolve(__dirname, '../prisma/baseline-final.sql')
  const sqlText = fs.readFileSync(sqlPath, 'utf8')
  const statements = splitStatements(sqlText)
  console.log(`Loaded ${statements.length} statements from baseline-final.sql\n`)

  const client = await pool.connect()
  let ok = 0
  try {
    await client.query('BEGIN')
    for (const stmt of statements) {
      const first = stmt.split('\n')[0].slice(0, 80)
      try {
        await client.query(stmt)
        ok++
        console.log(`  ✓ ${first}`)
      } catch (err) {
        console.error(`  ✗ FAILED: ${first}`)
        console.error(`    → ${err.message}`)
        throw err
      }
    }
    await client.query('COMMIT')
    console.log(`\n✅ Committed ${ok} statements to Neon.`)
  } catch (e) {
    await client.query('ROLLBACK')
    console.error('\n⚠️  Rolled back entire migration due to error.')
    process.exit(1)
  } finally {
    client.release()
    await pool.end()
  }
})()
