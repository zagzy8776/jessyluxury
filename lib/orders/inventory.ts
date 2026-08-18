export class InventoryConflictError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'InventoryConflictError'
  }
}

/**
 * Reserve stock for an unpaid order (increments reserved, decrements available).
 */
export async function reserveStock(
  tx: any,
  productId: number,
  quantity: number,
  actor: string = 'Admin'
) {
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
      quantity: -quantity, // Reduces available inventory
      type: 'RESERVATION_CREATED',
      notes: `Reserved ${quantity} units for order`,
      changedBy: actor,
    },
  })
}

/**
 * Release reserved stock on order cancellation (decrements reserved, increments available).
 */
export async function releaseReservation(
  tx: any,
  productId: number,
  quantity: number,
  actor: string = 'Admin'
) {
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
      quantity, // Restores available inventory
      type: 'RESERVATION_RELEASED',
      notes: `Released ${quantity} units reservation`,
      changedBy: actor,
    },
  })
}

/**
 * Convert reserved stock to a final sale when an unpaid order is paid
 * (decrements physical stock and reserved, available remains unchanged).
 */
export async function consumeReservation(
  tx: any,
  productId: number,
  quantity: number,
  actor: string = 'Admin'
) {
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
      quantity: 0, // Available stock doesn't change since it was already deducted on reservation
      type: 'SALE',
      notes: `Consumed reservation of ${quantity} units for completed payment`,
      changedBy: actor,
    },
  })
}

/**
 * Directly sell stock without a prior reservation (decrements stock, available decreases).
 */
export async function sellStockDirect(
  tx: any,
  productId: number,
  quantity: number,
  actor: string = 'Admin'
) {
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
      quantity: -quantity, // Reduces available inventory
      type: 'SALE',
      notes: `Direct sale of ${quantity} units`,
      changedBy: actor,
    },
  })
}

/**
 * Reverse a completed physical sale on cancellation (increments stock, available increases).
 */
export async function cancelPaidSale(
  tx: any,
  productId: number,
  quantity: number,
  actor: string = 'Admin'
) {
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

/**
 * Process a returned item, restocking it only if restockable is true.
 */
export async function processReturnItem(
  tx: any,
  productId: number,
  quantity: number,
  isRestockable: boolean,
  actor: string = 'Admin',
  reason: string = 'Customer return'
) {
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
    // If not restockable (e.g. damaged or opened)
    await tx.stockMovement.create({
      data: {
        productId,
        quantity: 0, // No change to available inventory
        type: 'DAMAGE',
        notes: `Returned item logged as damaged (not restocked): ${reason}`,
        changedBy: actor,
      },
    })
  }
}
