/**
 * Clean Test Data Script
 * Removes all E2E test data (products, orders, customers, categories)
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
  console.log('✅ Connected to Neon database\n')

  try {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('🧹 CLEANING TEST DATA')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

    // 1. Delete test orders FIRST (before products due to foreign key constraints)
    console.log('1️⃣ Deleting test orders...')
    const testOrders = await client.query(`
      SELECT id, "orderNumber" FROM "Order"
      WHERE "customerName" LIKE '%ANA_%' OR "customerName" LIKE '%SHIP_%' OR "customerName" LIKE '%Test%'
    `)
    
    if (testOrders.rows.length > 0) {
      const orderIds = testOrders.rows.map(o => o.id)
      
      // Delete related records first (foreign key dependencies)
      await client.query(`DELETE FROM "OrderTimeline" WHERE "orderId" = ANY($1)`, [orderIds])
      await client.query(`DELETE FROM "PriceAdjustmentLog" WHERE "orderId" = ANY($1)`, [orderIds])
      await client.query(`DELETE FROM "CouponRedemption" WHERE "orderId" = ANY($1)`, [orderIds])
      await client.query(`DELETE FROM "OrderItem" WHERE "orderId" = ANY($1)`, [orderIds])
      
      const deleteOrders = await client.query(`
        DELETE FROM "Order"
        WHERE id = ANY($1)
        RETURNING "orderNumber"
      `, [orderIds])
      
      console.log(`   ✅ Deleted ${deleteOrders.rowCount} test orders`)
      if (deleteOrders.rows.length > 0) {
        deleteOrders.rows.forEach(o => console.log(`      - ${o.orderNumber}`))
      }
    } else {
      console.log(`   ✅ No test orders found`)
    }
    console.log('')

    // 2. Delete test products
    console.log('2️⃣ Deleting test products...')
    const deleteProducts = await client.query(`
      DELETE FROM "Product"
      WHERE 
        name LIKE '%ANA_%' OR
        name LIKE '%SHIP_%' OR
        name LIKE '%E2E_%' OR
        brand LIKE '%Test%' OR
        brand = 'Modified Brand' OR
        brand = 'Initial Brand'
      RETURNING id, name
    `)
    console.log(`   ✅ Deleted ${deleteProducts.rowCount} test products`)
    if (deleteProducts.rows.length > 0) {
      deleteProducts.rows.forEach(p => console.log(`      - ${p.name} (ID: ${p.id})`))
    }
    console.log('')

    // 3. Delete test customers
    console.log('3️⃣ Deleting test customers...')
    const deleteCustomers = await client.query(`
      DELETE FROM "Customer"
      WHERE 
        name LIKE '%ANA_%' OR
        name LIKE '%SHIP_%' OR
        name LIKE '%Test%' OR
        phone LIKE '%11%11%' OR
        phone LIKE '%00%00%'
      RETURNING id, name
    `)
    console.log(`   ✅ Deleted ${deleteCustomers.rowCount} test customers`)
    if (deleteCustomers.rows.length > 0) {
      deleteCustomers.rows.forEach(c => console.log(`      - ${c.name} (ID: ${c.id})`))
    }
    console.log('')

    // 4. Delete test categories
    console.log('4️⃣ Deleting test categories...')
    const deleteCategories = await client.query(`
      DELETE FROM "Category"
      WHERE 
        name LIKE '%ANA_%' OR
        name LIKE '%SHIP_%' OR
        name LIKE '%Test%' OR
        name = 'Smoke Test Category' OR
        name = 'Marketing Test Category'
      RETURNING id, name
    `)
    console.log(`   ✅ Deleted ${deleteCategories.rowCount} test categories`)
    if (deleteCategories.rows.length > 0) {
      deleteCategories.rows.forEach(c => console.log(`      - ${c.name} (ID: ${c.id})`))
    }
    console.log('')

    // 5. Verify remaining data
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('📊 REMAINING DATA')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

    const stats = await client.query(`
      SELECT
        (SELECT COUNT(*) FROM "Product") as products,
        (SELECT COUNT(*) FROM "Order") as orders,
        (SELECT COUNT(*) FROM "Customer") as customers,
        (SELECT COUNT(*) FROM "Category") as categories
    `)
    
    const s = stats.rows[0]
    console.log(`Products: ${s.products}`)
    console.log(`Orders: ${s.orders}`)
    console.log(`Customers: ${s.customers}`)
    console.log(`Categories: ${s.categories}`)
    console.log('')

    // 6. List real categories
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('📑 PRODUCTION CATEGORIES')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

    const categories = await client.query(`
      SELECT id, name, (SELECT COUNT(*) FROM "Product" WHERE "categoryId" = "Category".id) as product_count
      FROM "Category"
      ORDER BY id
    `)
    
    if (categories.rows.length > 0) {
      categories.rows.forEach(c => {
        console.log(`   ID: ${c.id} | ${c.name} | Products: ${c.product_count}`)
      })
    } else {
      console.log('   ⚠️ NO CATEGORIES - Need to run seed script!')
    }
    console.log('')

    console.log('✅ Test data cleanup complete!\n')
    console.log('📝 Next steps:')
    console.log('   1. If no categories exist, run: npm run seed')
    console.log('   2. Add real products via admin UI')
    console.log('   3. Products will now show on user side\n')

  } catch (error) {
    console.error('❌ Error during cleanup:', error.message)
    console.error(error)
  } finally {
    await client.end()
  }
}

main()
