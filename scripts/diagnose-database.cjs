/**
 * Database Diagnostic Script
 * Checks for mock data, verifies product visibility, and analyzes order/product issues
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
    // 1. Check for mock data in products
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('📦 CHECKING FOR MOCK DATA IN PRODUCTS')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

    const mockBrands = ['Dior', 'Chanel', 'Giorgio Armani', 'Tom Ford', 'Versace', 'Gucci', 'Prada']
    const mockProducts = await client.query(`
      SELECT id, name, brand, price, stock, "createdAt"
      FROM "Product"
      WHERE brand = ANY($1)
      ORDER BY "createdAt" DESC
    `, [mockBrands])

    if (mockProducts.rows.length > 0) {
      console.log(`❌ FOUND ${mockProducts.rows.length} MOCK PRODUCTS:`)
      mockProducts.rows.forEach(p => {
        console.log(`   ID: ${p.id} | ${p.name} by ${p.brand} | ₦${p.price} | Stock: ${p.stock}`)
      })
      console.log('')
    } else {
      console.log('✅ No mock products found (Dior, Chanel, etc.)\n')
    }

    // 2. Check total product count
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('📊 PRODUCT INVENTORY OVERVIEW')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

    const productStats = await client.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE stock > 0) as in_stock,
        COUNT(*) FILTER (WHERE stock = 0) as out_of_stock,
        COUNT(*) FILTER (WHERE "createdAt" > NOW() - INTERVAL '7 days') as added_last_7_days
      FROM "Product"
    `)
    const stats = productStats.rows[0]
    console.log(`Total Products: ${stats.total}`)
    console.log(`In Stock: ${stats.in_stock}`)
    console.log(`Out of Stock: ${stats.out_of_stock}`)
    console.log(`Added Last 7 Days: ${stats.added_last_7_days}`)
    console.log('')

    // 3. Check recent products
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('🆕 RECENTLY ADDED PRODUCTS (Last 10)')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

    const recentProducts = await client.query(`
      SELECT id, name, brand, price, stock, "categoryId", "createdAt"
      FROM "Product"
      ORDER BY "createdAt" DESC
      LIMIT 10
    `)

    if (recentProducts.rows.length > 0) {
      recentProducts.rows.forEach(p => {
        const date = new Date(p.createdAt).toISOString().slice(0, 16).replace('T', ' ')
        console.log(`ID: ${p.id} | ${p.name} by ${p.brand}`)
        console.log(`   Price: ₦${p.price} | Stock: ${p.stock} | Category: ${p.categoryId} | Added: ${date}`)
        console.log('')
      })
    } else {
      console.log('❌ NO PRODUCTS IN DATABASE\n')
    }

    // 4. Check orders with deleted products
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('🛒 ORDERS WITH DELETED PRODUCTS')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

    const orphanedOrderItems = await client.query(`
      SELECT 
        oi.id as order_item_id,
        oi."orderId",
        oi."productId",
        oi.quantity,
        oi.price,
        oi."productNameSnapshot",
        o."orderNumber",
        o.status
      FROM "OrderItem" oi
      LEFT JOIN "Product" p ON p.id = oi."productId"
      LEFT JOIN "Order" o ON o.id = oi."orderId"
      WHERE p.id IS NULL
      LIMIT 20
    `)

    if (orphanedOrderItems.rows.length > 0) {
      console.log(`⚠️ FOUND ${orphanedOrderItems.rows.length} ORDER ITEMS WITH DELETED PRODUCTS:`)
      orphanedOrderItems.rows.forEach(oi => {
        console.log(`   Order: ${oi.orderNumber} | Product ID: ${oi.productId} (DELETED)`)
        console.log(`   Snapshot: ${oi.productNameSnapshot || 'N/A'} | Qty: ${oi.quantity} | Price: ₦${oi.price}`)
        console.log('')
      })
    } else {
      console.log('✅ No order items reference deleted products\n')
    }

    // 5. Check order deletion capability
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('🗑️ ORDER MANAGEMENT')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

    const orderCount = await client.query('SELECT COUNT(*) as total FROM "Order"')
    console.log(`Total Orders: ${orderCount.rows[0].total}`)

    const recentOrders = await client.query(`
      SELECT id, "orderNumber", "customerName", status, "paymentStatus", total, "createdAt"
      FROM "Order"
      ORDER BY "createdAt" DESC
      LIMIT 5
    `)

    if (recentOrders.rows.length > 0) {
      console.log('\nRecent Orders:')
      recentOrders.rows.forEach(o => {
        const date = new Date(o.createdAt).toISOString().slice(0, 16).replace('T', ' ')
        console.log(`   ${o.orderNumber} | ${o.customerName} | ${o.status} | ₦${o.total} | ${date}`)
      })
    }
    console.log('')

    // 6. Check for mock customers
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('👥 CHECKING FOR MOCK CUSTOMERS')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

    const mockCustomers = await client.query(`
      SELECT id, name, phone, "ordersCount", "totalSpent"
      FROM "Customer"
      WHERE name ILIKE '%test%' OR phone LIKE '0000%' OR phone LIKE '1111%'
      LIMIT 10
    `)

    if (mockCustomers.rows.length > 0) {
      console.log(`⚠️ FOUND ${mockCustomers.rows.length} POTENTIAL MOCK CUSTOMERS:`)
      mockCustomers.rows.forEach(c => {
        console.log(`   ID: ${c.id} | ${c.name} | ${c.phone} | Orders: ${c.ordersCount} | Spent: ₦${c.totalSpent}`)
      })
      console.log('')
    } else {
      console.log('✅ No obvious mock customers found\n')
    }

    // 7. Check categories
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('📑 CATEGORIES')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

    const categories = await client.query(`
      SELECT c.id, c.name, COUNT(p.id) as product_count
      FROM "Category" c
      LEFT JOIN "Product" p ON p."categoryId" = c.id
      GROUP BY c.id, c.name
      ORDER BY c.id
    `)

    categories.rows.forEach(cat => {
      console.log(`   ID: ${cat.id} | ${cat.name} | Products: ${cat.product_count}`)
    })
    console.log('')

    // 8. Generate recommendations
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('💡 RECOMMENDATIONS')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

    if (mockProducts.rows.length > 0) {
      console.log('⚠️ ACTION REQUIRED: Delete mock products')
      console.log('   Run: node scripts/delete-mock-data.cjs\n')
    }

    if (orphanedOrderItems.rows.length > 0) {
      console.log('⚠️ WARNING: Some orders reference deleted products')
      console.log('   This is NORMAL if products were deleted after orders were created')
      console.log('   Historical snapshots preserve order data\n')
    }

    console.log('✅ Database diagnostic complete!\n')

  } catch (error) {
    console.error('❌ Error during diagnostic:', error.message)
  } finally {
    await client.end()
  }
}

main()
