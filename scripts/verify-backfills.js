/**
 * Lightweight post-backfill verification (no Prisma client needed).
 * Usage: node scripts/verify-backfills.js
 */
const { Pool } = require('pg')
const fs = require('fs')
const path = require('path')

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

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

;(async () => {
  const nullToken = await pool.query('SELECT COUNT(*)::int AS c FROM "Order" WHERE "trackingToken" IS NULL')
  const dup = await pool.query(
    'SELECT COUNT(*)::int AS c FROM (SELECT "trackingToken" FROM "Order" GROUP BY "trackingToken" HAVING COUNT(*) > 1) d'
  )
  const populatedCost = await pool.query(
    'SELECT COUNT(*)::int AS c FROM "OrderItem" WHERE "unitCost" IS NOT NULL'
  )
  const populatedName = await pool.query(
    'SELECT COUNT(*)::int AS c FROM "OrderItem" WHERE "productNameSnapshot" IS NOT NULL'
  )
  const populatedBrand = await pool.query(
    'SELECT COUNT(*)::int AS c FROM "OrderItem" WHERE "brandSnapshot" IS NOT NULL'
  )
  const sample = await pool.query(
    'SELECT id, "unitCost", "productNameSnapshot", "brandSnapshot" FROM "OrderItem" LIMIT 5'
  )

  console.log('=== POST-BACKFILL VERIFICATION ===')
  console.log(`  Order.trackingToken NULL count:  ${nullToken.rows[0].c}  (expect 0)`)
  console.log(`  Order.trackingToken duplicates:  ${dup.rows[0].c}  (expect 0)`)
  console.log(`  OrderItem.unitCost populated:    ${populatedCost.rows[0].c}`)
  console.log(`  OrderItem.productNameSnapshot:   ${populatedName.rows[0].c}`)
  console.log(`  OrderItem.brandSnapshot:         ${populatedBrand.rows[0].c}`)
  console.log('  Sample rows:', JSON.stringify(sample.rows, null, 2))

  const ok = nullToken.rows[0].c === 0 && dup.rows[0].c === 0
  console.log(`\n${ok ? '✅ Backfill verification PASSED' : '⚠️  Backfill verification FAILED'}`)
  await pool.end()
  process.exit(ok ? 0 : 1)
})().catch((err) => {
  console.error('Verification error:', err.message)
  process.exit(1)
})
