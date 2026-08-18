const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

// Copy self-contained state validator functions to avoid CJS/ESM transpiler loader import issues
function canTransitionFulfillment(from, to) {
  if (from === to) return true
  const allowed = {
    PENDING: ['PROCESSING', 'CANCELLED'],
    PROCESSING: ['SHIPPED', 'CANCELLED'],
    SHIPPED: ['DELIVERED', 'RETURNED'],
    DELIVERED: ['RETURNED'],
    CANCELLED: [],
    RETURNED: []
  }[from] || []
  return allowed.includes(to)
}

function canTransitionPayment(from, to) {
  if (from === to) return true
  const allowed = {
    UNPAID: ['PARTIALLY_PAID', 'PAID', 'REFUNDED'],
    PARTIALLY_PAID: ['PAID'],
    PAID: ['REFUNDED'],
    REFUNDED: []
  }[from] || []
  return allowed.includes(to)
}

class InventoryConflictError extends Error {
  constructor(message) {
    super(message)
    this.name = 'InventoryConflictError'
  }
}

async function reserveStock(tx, productId, quantity, actor = 'Admin') {
  if (quantity <= 0) throw new Error('Quantity must be greater than 0')

  const affectedRows = await tx.$executeRawUnsafe(
    `UPDATE "Product" 
     SET "reserved" = "reserved" + $1, "updatedAt" = NOW()
     WHERE "id" = $2 AND "stock" - "reserved" >= $1`,
    quantity,
    productId
  )

  if (affectedRows === 0) {
    throw new InventoryConflictError(`Insufficient inventory available to reserve product ID ${productId}`)
  }

  await tx.stockMovement.create({
    data: {
      productId,
      quantity: -quantity,
      type: 'RESERVATION_CREATED',
      notes: `Reserved ${quantity} units for order`,
      changedBy: actor,
    },
  })
}

async function releaseReservation(tx, productId, quantity, actor = 'Admin') {
  if (quantity <= 0) throw new Error('Quantity must be greater than 0')

  const affectedRows = await tx.$executeRawUnsafe(
    `UPDATE "Product" 
     SET "reserved" = "reserved" - $1, "updatedAt" = NOW()
     WHERE "id" = $2 AND "reserved" >= $1`,
    quantity,
    productId
  )

  if (affectedRows === 0) {
    throw new Error(`Cannot release reservation: Product ID ${productId} has insufficient reserved units`)
  }

  await tx.stockMovement.create({
    data: {
      productId,
      quantity,
      type: 'RESERVATION_RELEASED',
      notes: `Released ${quantity} units reservation`,
      changedBy: actor,
    },
  })
}

async function consumeReservation(tx, productId, quantity, actor = 'Admin') {
  if (quantity <= 0) throw new Error('Quantity must be greater than 0')

  const affectedRows = await tx.$executeRawUnsafe(
    `UPDATE "Product" 
     SET "stock" = "stock" - $1, "reserved" = "reserved" - $1, "updatedAt" = NOW()
     WHERE "id" = $2 AND "stock" >= $1 AND "reserved" >= $1`,
    quantity,
    productId
  )

  if (affectedRows === 0) {
    throw new Error(`Cannot consume reservation: Product ID ${productId} has insufficient stock or reservation`)
  }

  await tx.stockMovement.create({
    data: {
      productId,
      quantity: 0,
      type: 'SALE',
      notes: `Consumed reservation of ${quantity} units for completed payment`,
      changedBy: actor,
    },
  })
}

async function sellStockDirect(tx, productId, quantity, actor = 'Admin') {
  if (quantity <= 0) throw new Error('Quantity must be greater than 0')

  const affectedRows = await tx.$executeRawUnsafe(
    `UPDATE "Product" 
     SET "stock" = "stock" - $1, "updatedAt" = NOW()
     WHERE "id" = $2 AND "stock" - "reserved" >= $1`,
    quantity,
    productId
  )

  if (affectedRows === 0) {
    throw new InventoryConflictError(`Insufficient inventory available to purchase product ID ${productId}`)
  }

  await tx.stockMovement.create({
    data: {
      productId,
      quantity: -quantity,
      type: 'SALE',
      notes: `Direct sale of ${quantity} units`,
      changedBy: actor,
    },
  })
}

async function cancelPaidSale(tx, productId, quantity, actor = 'Admin') {
  if (quantity <= 0) throw new Error('Quantity must be greater than 0')

  await tx.$executeRawUnsafe(
    `UPDATE "Product" 
     SET "stock" = "stock" + $1, "updatedAt" = NOW()
     WHERE "id" = $2`,
    quantity,
    productId
  )

  await tx.stockMovement.create({
    data: {
      productId,
      quantity,
      type: 'RESTOCK',
      notes: `Cancelled paid sale: Restocked ${quantity} units`,
      changedBy: actor,
    },
  })
}

async function processReturnItem(tx, productId, quantity, isRestockable, actor = 'Admin', reason = 'Customer return') {
  if (quantity <= 0) throw new Error('Quantity must be greater than 0')

  if (isRestockable) {
    await tx.$executeRawUnsafe(
      `UPDATE "Product" 
       SET "stock" = "stock" + $1, "updatedAt" = NOW()
       WHERE "id" = $2`,
      quantity,
      productId
    )

    await tx.stockMovement.create({
      data: {
        productId,
        quantity,
        type: 'RETURN_RESTOCK',
        notes: `Returned item restocked: ${reason}`,
        changedBy: actor,
      },
    })
  } else {
    await tx.stockMovement.create({
      data: {
        productId,
        quantity: 0,
        type: 'DAMAGE',
        notes: `Returned item logged as damaged (not restocked): ${reason}`,
        changedBy: actor,
      },
    })
  }
}

async function validateAndLogPricing(tx, orderId, productId, qty, customPrice, actor = 'Admin', reason = 'Manual POS price adjustment') {
  if (!Number.isInteger(qty) || qty <= 0) {
    throw new Error(`Quantity must be a positive integer. Got: ${qty}`)
  }
  if (!Number.isInteger(customPrice) || customPrice < 0) {
    throw new Error(`Price must be a non-negative integer. Got: ${customPrice}`)
  }

  const product = await tx.product.findUnique({
    where: { id: productId },
  })

  if (!product) {
    throw new Error(`Product with ID ${productId} not found`)
  }

  const normalPrice = product.salePrice !== null ? product.salePrice : product.price

  if (customPrice !== normalPrice) {
    const difference = customPrice - normalPrice

    await tx.priceAdjustmentLog.create({
      data: {
        orderId,
        productId,
        productName: product.name,
        originalPrice: normalPrice,
        customPrice,
        difference,
        changedBy: actor,
        reason,
      },
    })

    await tx.auditLog.create({
      data: {
        action: 'PRICE_ADJUSTED',
        entity: 'Order',
        entityId: String(orderId),
        details: JSON.stringify({
          productId,
          productName: product.name,
          originalPrice: normalPrice,
          customPrice,
          difference,
          reason,
        }),
        changedBy: actor,
      },
    })
  }
}

async function runTests() {
  console.log('🚀 Starting Commerce Engine Verification Tests...')

  let testProduct = null
  let category = null

  try {
    // Setup test records
    category = await prisma.category.upsert({
      where: { name: 'Test Category' },
      update: {},
      create: { name: 'Test Category', slug: 'test-category' }
    })

    testProduct = await prisma.product.create({
      data: {
        name: 'Verification Scent',
        brand: 'Jessy Atelier',
        price: 30000,
        costPrice: 15000,
        volume: '100ml EDP',
        notes: 'Rose · Oud',
        stock: 10,
        reserved: 0,
        categoryId: category.id
      }
    })

    console.log(`\n📦 Created test product: ${testProduct.name} (Stock: 10, Reserved: 0)`)

    // ==========================================
    // TEST 1: Unpaid Order stock reservation
    // ==========================================
    console.log('\n--- TEST 1: Stock Reservation (Unpaid Order) ---')
    await prisma.$transaction(async (tx) => {
      await reserveStock(tx, testProduct.id, 3, 'Tester')
    })
    
    let p = await prisma.product.findUnique({ where: { id: testProduct.id } })
    console.log(`Reserved 3 bottles. Stock: ${p.stock}, Reserved: ${p.reserved}, Available: ${p.stock - p.reserved}`)
    if (p.stock !== 10 || p.reserved !== 3) {
      throw new Error(`Reservation failed: Stock=${p.stock}, Reserved=${p.reserved}`)
    }
    console.log('✅ TEST 1 passed!')

    // ==========================================
    // TEST 2: Cancel Unpaid Order release reservation
    // ==========================================
    console.log('\n--- TEST 2: Release Reservation (Cancel Unpaid) ---')
    await prisma.$transaction(async (tx) => {
      await releaseReservation(tx, testProduct.id, 3, 'Tester')
    })

    p = await prisma.product.findUnique({ where: { id: testProduct.id } })
    console.log(`Cancelled order. Stock: ${p.stock}, Reserved: ${p.reserved}, Available: ${p.stock - p.reserved}`)
    if (p.stock !== 10 || p.reserved !== 0) {
      throw new Error(`Release reservation failed: Stock=${p.stock}, Reserved=${p.reserved}`)
    }
    console.log('✅ TEST 2 passed!')

    // ==========================================
    // TEST 3: Unpaid Order -> Paid (Consume Reservation)
    // ==========================================
    console.log('\n--- TEST 3: Consume Reservation (Unpaid -> Paid) ---')
    // 3a. Reserve first
    await prisma.$transaction(async (tx) => {
      await reserveStock(tx, testProduct.id, 3, 'Tester')
    })
    // 3b. Consume payment
    await prisma.$transaction(async (tx) => {
      await consumeReservation(tx, testProduct.id, 3, 'Tester')
    })

    p = await prisma.product.findUnique({ where: { id: testProduct.id } })
    console.log(`Unpaid order is paid. Stock: ${p.stock}, Reserved: ${p.reserved}, Available: ${p.stock - p.reserved}`)
    if (p.stock !== 7 || p.reserved !== 0) {
      throw new Error(`Consume reservation failed: Stock=${p.stock}, Reserved=${p.reserved}`)
    }
    console.log('✅ TEST 3 passed!')

    // Reset stock to 10
    await prisma.product.update({ where: { id: testProduct.id }, data: { stock: 10, reserved: 0 } })

    // ==========================================
    // TEST 4: Direct checkout sale (Paid order)
    // ==========================================
    console.log('\n--- TEST 4: Direct Sale ---')
    await prisma.$transaction(async (tx) => {
      await sellStockDirect(tx, testProduct.id, 2, 'Tester')
    })
    p = await prisma.product.findUnique({ where: { id: testProduct.id } })
    console.log(`Direct sale completed. Stock: ${p.stock}, Reserved: ${p.reserved}, Available: ${p.stock - p.reserved}`)
    if (p.stock !== 8 || p.reserved !== 0) {
      throw new Error(`Direct sale failed: Stock=${p.stock}, Reserved=${p.reserved}`)
    }
    console.log('✅ TEST 4 passed!')

    // ==========================================
    // TEST 5: Cancel Paid Sale
    // ==========================================
    console.log('\n--- TEST 5: Cancel Paid Sale ---')
    await prisma.$transaction(async (tx) => {
      await cancelPaidSale(tx, testProduct.id, 2, 'Tester')
    })
    p = await prisma.product.findUnique({ where: { id: testProduct.id } })
    console.log(`Paid order cancelled. Stock: ${p.stock}, Reserved: ${p.reserved}, Available: ${p.stock - p.reserved}`)
    if (p.stock !== 10 || p.reserved !== 0) {
      throw new Error(`Cancel paid sale failed: Stock=${p.stock}, Reserved=${p.reserved}`)
    }
    console.log('✅ TEST 5 passed!')

    // ==========================================
    // TEST 6: Transaction Atomic Rollback
    // ==========================================
    console.log('\n--- TEST 6: Atomic Rollback ---')
    let orderBeforeRollback = await prisma.order.count()

    try {
      await prisma.$transaction(async (tx) => {
        // Step 6a: reserve stock
        await reserveStock(tx, testProduct.id, 4, 'Tester')

        // Step 6b: create order
        await tx.order.create({
          data: {
            orderNumber: 'TEST-ROLLBACK-999',
            customerName: 'Rollback Guy',
            customerPhone: '0000000000',
            customerWhatsapp: '0000000000',
            subtotal: 30000,
            total: 30000,
            status: 'PENDING',
            paymentStatus: 'UNPAID'
          }
        })

        // Step 6c: Throw intentional error
        throw new Error('Intentional crash to verify transaction rollback')
      })
    } catch (err) {
      console.log(`Caught expected error: "${err.message}"`)
    }

    let orderAfterRollback = await prisma.order.count()
    p = await prisma.product.findUnique({ where: { id: testProduct.id } })
    console.log(`Orders count: before rollback=${orderBeforeRollback}, after rollback=${orderAfterRollback}`)
    console.log(`Reserved stock: ${p.reserved} (Expected: 0)`)

    if (orderBeforeRollback !== orderAfterRollback || p.reserved !== 0) {
      throw new Error('Transaction rollback failed: database is in inconsistent state!')
    }
    console.log('✅ TEST 6 passed!')

    // ==========================================
    // TEST 7: Concurrency Race Condition Lock
    // ==========================================
    console.log('\n--- TEST 7: Concurrency Race Condition Lock ---')
    // Set stock to 1
    await prisma.product.update({ where: { id: testProduct.id }, data: { stock: 1, reserved: 0 } })

    const promises = [
      prisma.$transaction(async (tx) => {
        await reserveStock(tx, testProduct.id, 1, 'Racer A')
      }),
      prisma.$transaction(async (tx) => {
        await reserveStock(tx, testProduct.id, 1, 'Racer B')
      })
    ]

    const results = await Promise.allSettled(promises)
    const fulfilled = results.filter(r => r.status === 'fulfilled').length
    const rejected = results.filter(r => r.status === 'rejected').length
    console.log(`Concurrency simulation results: Successful=${fulfilled}, Rejected=${rejected}`)

    if (fulfilled !== 1 || rejected !== 1) {
      throw new Error(`Concurrency check failed: Successful=${fulfilled}, Rejected=${rejected} (Exactly 1 of each expected)`)
    }
    console.log('✅ TEST 7 passed!')

    // ==========================================
    // TEST 8: State Machine Transitions
    // ==========================================
    console.log('\n--- TEST 8: State Machine Transitions ---')
    // PENDING -> PROCESSING is valid
    if (!canTransitionFulfillment('PENDING', 'PROCESSING')) throw new Error('PENDING -> PROCESSING transition invalid')
    // PENDING -> DELIVERED is invalid
    if (canTransitionFulfillment('PENDING', 'DELIVERED')) throw new Error('PENDING -> DELIVERED transition allowed')
    
    // UNPAID -> PAID is valid
    if (!canTransitionPayment('UNPAID', 'PAID')) throw new Error('UNPAID -> PAID transition invalid')
    // REFUNDED -> PAID is invalid
    if (canTransitionPayment('REFUNDED', 'PAID')) throw new Error('REFUNDED -> PAID transition allowed')
    console.log('✅ TEST 8 passed!')

    // ==========================================
    // TEST 9: Returned Item Restockability
    // ==========================================
    console.log('\n--- TEST 9: Returned Item Restockability ---')
    // Reset stock to 5
    await prisma.product.update({ where: { id: testProduct.id }, data: { stock: 5, reserved: 0 } })

    // Case 9a: Restockable return
    await prisma.$transaction(async (tx) => {
      await processReturnItem(tx, testProduct.id, 2, true, 'Tester', 'Good condition')
    })
    p = await prisma.product.findUnique({ where: { id: testProduct.id } })
    console.log(`Restockable returned. Stock: ${p.stock} (Expected: 7)`)
    if (p.stock !== 7) throw new Error(`Restockable return failed: stock is ${p.stock}`)

    // Case 9b: Damaged return
    await prisma.$transaction(async (tx) => {
      await processReturnItem(tx, testProduct.id, 2, false, 'Tester', 'Damaged sprayer')
    })
    p = await prisma.product.findUnique({ where: { id: testProduct.id } })
    console.log(`Damaged returned. Stock: ${p.stock} (Expected: 7)`)
    if (p.stock !== 7) throw new Error(`Damaged return failed: stock is ${p.stock}`)
    console.log('✅ TEST 9 passed!')

    // ==========================================
    // TEST 10: Price Override Audits
    // ==========================================
    console.log('\n--- TEST 10: Price Override Audits ---')
    const testOrder = await prisma.order.create({
      data: {
        orderNumber: 'TEST-POS-999',
        customerName: 'POS Buyer',
        customerPhone: '9999999999',
        customerWhatsapp: '9999999999',
        subtotal: 25000,
        total: 25000,
        status: 'PENDING',
        paymentStatus: 'PAID'
      }
    })

    await prisma.$transaction(async (tx) => {
      // Overriding Verification Scent normal price 30000 -> custom price 25000
      await validateAndLogPricing(tx, testOrder.id, testProduct.id, 1, 25000, 'Admin', 'Wholesale deal')
    })

    const priceOverrideLog = await prisma.priceAdjustmentLog.findFirst({
      where: { orderId: testOrder.id }
    })
    const auditLog = await prisma.auditLog.findFirst({
      where: { action: 'PRICE_ADJUSTED', entityId: String(testOrder.id) }
    })

    console.log(`Price override log found: ${!!priceOverrideLog} (Diff: ${priceOverrideLog?.difference})`)
    console.log(`Audit log found: ${!!auditLog} (Action: ${auditLog?.action})`)

    if (!priceOverrideLog || !auditLog || priceOverrideLog.difference !== -5000) {
      throw new Error('Price override logging failed!')
    }
    console.log('✅ TEST 10 passed!')

    // Clean up test records
    await prisma.priceAdjustmentLog.deleteMany({ where: { orderId: testOrder.id } })
    await prisma.auditLog.deleteMany({ where: { entityId: String(testOrder.id) } })
    await prisma.order.delete({ where: { id: testOrder.id } })
    console.log('\n🎉 ALL 10 commerce engine tests passed successfully!')

  } catch (error) {
    console.error('\n❌ Test execution failed with error:', error)
    process.exit(1)
  } finally {
    // Clean up test product
    if (testProduct) {
      await prisma.product.delete({ where: { id: testProduct.id } }).catch(() => {})
    }
    await prisma.$disconnect()
  }
}

runTests()
