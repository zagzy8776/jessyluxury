/**
 * Backup script: dumps all current Neon tables to a JSON file BEFORE applying the baseline migration.
 * Usage: node scripts/backup-neon-data.js
 * Output: prisma/backup-neon-<timestamp>.json
 */
const { Pool } = require('pg')
const fs = require('fs')
const path = require('path')

// Minimal .env loader (no dependency) — matches scripts/prebuild.mjs pattern
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

async function main() {
  const tables = [
    'Product', 'Category', 'Customer', 'Order', 'OrderItem',
    'ShippingZone', 'Coupon', 'Review', 'StoreLocation', 'StaffAccount', 'Expense',
  ]

  const backup = {}
  for (const table of tables) {
    const exists = await pool.query(
      `SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = $1`,
      [table]
    )
    if (exists.rowCount === 0) {
      backup[table] = { error: 'TABLE_DOES_NOT_EXIST' }
      continue
    }
    const res = await pool.query(`SELECT * FROM "${table}" ORDER BY 1`)
    backup[table] = res.rows
    console.log(`  ✓ ${table}: ${res.rowCount} rows`)
  }

  const ts = new Date().toISOString().replace(/[:.]/g, '-')
  const outPath = path.resolve(__dirname, `../prisma/backup-neon-${ts}.json`)
  fs.writeFileSync(outPath, JSON.stringify(backup, null, 2))
  console.log(`\n✅ Backup written to: ${outPath}`)
  await pool.end()
}

main().catch((err) => {
  console.error('Backup failed:', err.message)
  process.exit(1)
})
