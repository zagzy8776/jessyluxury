/**
 * Database connectivity verification and migration checker
 * Used during P11-T060 database stabilization work
 */
const fs = require('fs')
const path = require('path')
const { Client } = require('pg')

// Manual env loader (same pattern used in probe-pg.cjs)
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
    const client = new Client({
    connectionString: dbUrl,
    connectionTimeoutMillis: 30000,
  })

  try {
    console.log('🔌 Connecting to Neon database...')
    await client.connect()
    console.log('✅ Connected successfully')

    // 1. Verify SELECT 1 succeeds
    const selectResult = await client.query('SELECT 1 as alive')
    console.log('✅ SELECT 1 result:', selectResult.rows[0])

    // 2. Check PaymentSettings columns
    const colResult = await client.query(
      `SELECT column_name, data_type, is_nullable
       FROM information_schema.columns
       WHERE table_name = 'PaymentSettings'
       ORDER BY ordinal_position`
    )
    console.log('\n📋 PaymentSettings columns:')
    colResult.rows.forEach(r => {
      console.log(`  - ${r.column_name} (${r.data_type}, nullable: ${r.is_nullable})`)
    })

    // 3. Check for the three required columns
    const requiredCols = ['bankRoutingNumber', 'paymentProviderApiKey', 'merchantId']
    const existingCols = colResult.rows.map(r => r.column_name)
    const missing = requiredCols.filter(c => !existingCols.includes(c))
    const present = requiredCols.filter(c => existingCols.includes(c))

    console.log('\n📊 Required columns check:')
    console.log('  Present:', present)
    console.log('  Missing:', missing.length === 0 ? 'NONE ✅' : missing)

    // 4. Check StoreLocation unique partial index
    const indexResult = await client.query(
      `SELECT indexname, indexdef
       FROM pg_indexes
       WHERE tablename = 'StoreLocation'
       ORDER BY indexname`
    )
    console.log('\n📋 StoreLocation indexes:')
    indexResult.rows.forEach(r => {
      console.log(`  - ${r.indexname}: ${r.indexdef}`)
    })

    const hasPartialIndex = indexResult.rows.some(
      r => r.indexdef.includes('UNIQUE') && r.indexdef.includes('isDefault') && r.indexdef.includes('true')
    )
    console.log('\n📊 StoreLocation partial unique index for default:', hasPartialIndex ? '✅ PRESENT' : '❌ MISSING')

    // 5. Count default locations
    const defaultCount = await client.query(
      `SELECT COUNT(*) as cnt FROM "StoreLocation" WHERE "isDefault" = true`
    )
    console.log('📊 Default location count:', defaultCount.rows[0].cnt)

    // 6. Apply migration if columns are missing
    if (missing.length > 0) {
      console.log('\n🔧 Applying PaymentSettings migration (add 3 columns)...')
      const alterSQL = `ALTER TABLE "PaymentSettings" ADD COLUMN "bankRoutingNumber" TEXT, ADD COLUMN "paymentProviderApiKey" TEXT, ADD COLUMN "merchantId" TEXT`
      await client.query(alterSQL)
      console.log('✅ Migration applied')

      // Verify again
      const recheck = await client.query(
        `SELECT column_name FROM information_schema.columns WHERE table_name = 'PaymentSettings' ORDER BY ordinal_position`
      )
      const recheckCols = recheck.rows.map(r => r.column_name)
      const stillMissing = requiredCols.filter(c => !recheckCols.includes(c))
      console.log('  After migration - missing:', stillMissing.length === 0 ? 'NONE ✅' : stillMissing)
    }

    await client.end()
    console.log('\n✅ Database verification complete. Connection closed.')
  } catch (err) {
    console.error('❌ Database error:', err.message)
    try { await client.end() } catch (_) {}
    process.exit(1)
  }
}

main()
