/**
 * Validate order item pricing/quantities and audit overrides when manual custom prices are set.
 */
export async function validateAndLogPricing(
  tx: any,
  orderId: number,
  productId: number,
  qty: number,
  customPrice: number,
  actor: string = 'Admin',
  reason: string = 'Manual POS price adjustment'
) {
  // Validate quantity is a positive integer
  if (!Number.isInteger(qty) || qty <= 0) {
    throw new Error(`Quantity must be a positive integer. Got: ${qty}`)
  }

  // Validate customPrice is a non-negative integer
  if (!Number.isInteger(customPrice) || customPrice < 0) {
    throw new Error(`Price must be a non-negative integer. Got: ${customPrice}`)
  }

  // Fetch product regular prices
  const product = await tx.product.findUnique({
    where: { id: productId },
  })

  if (!product) {
    throw new Error(`Product with ID ${productId} not found`)
  }

  const normalPrice = product.salePrice !== null ? product.salePrice : product.price

  if (customPrice !== normalPrice) {
    const difference = customPrice - normalPrice

    // Log the manual pricing override
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

    // Log to atomic system audit
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
