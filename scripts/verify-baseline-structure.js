/**
 * Verifies the post-baseline database structure against the 21-model schema expectations.
 * Checks: 9 new tables exist, 22 new columns present, and key indexes/constraints.
 * Usage: node scripts/verify-baseline-structure.js
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

async function main() {
  let allGood = true

  // 1. Verify the 9 expected NEW tables exist
  const expectedNewTables = [
    'CouponRedemption', 'Campaign', 'SystemConfig', 'AuditLog',
    'StockMovement', 'PriceAdjustmentLog', 'OrderTimeline',
    'Notification', 'NotificationDelivery',
  ]
  const tableRes = await pool.query(
    `SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE' ORDER BY table_name`
  )
  const existingTables = new Set(tableRes.rows.map((r) => r.table_name))

  console.log('=== 1. NEW TABLES (expect 9) ===')
  for (const t of expectedNewTables) {
    const ok = existingTables.has(t)
    if (!ok) allGood = false
    console.log(`  ${ok ? '✅' : '❌'} ${t}`)
  }
  console.log(`  (total base tables in DB: ${existingTables.size})`)

  // 2. Verify the 22 expected NEW columns
  const expectedColumns = {
    'Coupon': ['categoryIds', 'customerLimit', 'endDate', 'maxDiscountAmount', 'productIds', 'startDate'],
    'Customer': ['acquisitionSource', 'marketingEmail', 'marketingPush', 'marketingWhatsapp', 'notes'],
    'Order': ['couponDiscount', 'couponId', 'estimatedDaysSnapshot', 'salesChannel', 'shippingZoneNameSnapshot', 'trackingToken'],
    'OrderItem': ['brandSnapshot', 'productNameSnapshot', 'unitCost'],
    'Product': ['reserved'],
    'ShippingZone': ['isPickup'],
  }
  console.log('\n=== 2. NEW COLUMNS (expect 22) ===')
  let colCount = 0
  for (const [table, cols] of Object.entries(expectedColumns)) {
    for (const col of cols) {
      const res = await pool.query(
        `SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name=$1 AND column_name=$2`,
        [table, col]
      )
      const ok = res.rowCount > 0
      if (!ok) allGood = false
      colCount += ok ? 1 : 0
      console.log(`  ${ok ? '✅' : '❌'} ${table}.${col}`)
    }
  }
  console.log(`  (total new columns verified: ${colCount}/22)`)

  // 3. Verify autoReactivate survived (not dropped)
  const arRes = await pool.query(
    `SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Coupon' AND column_name='autoReactivate'`
  )
  console.log('\n=== 3. DESTRUCTIVE-OP GUARD ===')
  const arOk = arRes.rowCount > 0
  if (!arOk) allGood = false
  console.log(`  ${arOk ? '✅' : '❌'} Coupon.autoReactivate still present (not dropped)`)

  // 4. Verify expected indexes exist
  const expectedIndexes = [
    'CouponRedemption_orderId_key',
    'CouponRedemption_couponId_customerId_idx',
    'CouponRedemption_couponId_customerId_orderId_key',
    'Notification_eventKey_key',
    'NotificationDelivery_notificationId_channel_idx',
    'NotificationDelivery_status_nextAttemptAt_idx',
    'NotificationDelivery_notificationId_channel_key',
    'Order_trackingToken_key',
  ]
  console.log('\n=== 4. INDEXES (expect 8) ===')
  const idxRes = await pool.query(
    `SELECT indexname FROM pg_indexes WHERE schemaname='public' ORDER BY indexname`
  )
  const existingIndexes = new Set(idxRes.rows.map((r) => r.indexname))
  for (const idx of expectedIndexes) {
    const ok = existingIndexes.has(idx)
    if (!ok) allGood = false
    console.log(`  ${ok ? '✅' : '❌'} ${idx}`)
  }

  // 5. Verify trackingToken is nullable (for two-stage backfill)
  const ttRes = await pool.query(
    `SELECT is_nullable FROM information_schema.columns WHERE table_schema='public' AND table_name='Order' AND column_name='trackingToken'`
  )
  console.log('\n=== 5. trackingToken nullability (expect YES for now) ===')
  const ttNullable = ttRes.rows[0]?.is_nullable === 'YES'
  if (!ttNullable) allGood = false
  console.log(`  ${ttNullable ? '✅' : '❌'} is_nullable = ${ttRes.rows[0]?.is_nullable}`)

  console.log(`\n${allGood ? '✅ ALL STRUCTURE CHECKS PASSED — ready for backfills' : '⚠️  SOME CHECKS FAILED — review above'}`)
  await pool.end()
  process.exit(allGood ? 0 : 1)
}

main().catch((err) => {
  console.error('Verification failed:', err.message)
  process.exit(1)
})
