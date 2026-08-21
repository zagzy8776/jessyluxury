import { resolveWholesaleUnitPrice } from '@/lib/wholesale/pricing'

/**
 * Validate order item pricing/quantities and audit overrides when manual custom prices are set.
 */
export async function validateAndLogPricing(
  tx: any,
  orderId: number,
  productId: number,
  qty: number,
  clientSubmittedPrice: number, // Renamed from customPrice for clarity
  actor: string = 'Admin',
  reason: string = 'Manual POS price adjustment',
  customerGroupId?: number | null
): Promise<number> { // Now returns the enforced price
  // Validate quantity is a positive integer
  if (!Number.isInteger(qty) || qty <= 0) {
    throw new Error(`Quantity must be a positive integer. Got: ${qty}`)
  }

  // Validate clientSubmittedPrice is a non-negative integer
  if (!Number.isInteger(clientSubmittedPrice) || clientSubmittedPrice < 0) {
    throw new Error(`Price must be a non-negative integer. Got: ${clientSubmittedPrice}`)
  }

  // Fetch product regular prices
  const product = await tx.product.findUnique({
    where: { id: productId },
  })

  if (!product) {
    throw new Error(`Product with ID ${productId} not found`)
  }

  const retailPrice = product.salePrice !== null ? product.salePrice : product.price
  const normalPrice = await resolveWholesaleUnitPrice({
    customerGroupId,
    productId,
    categoryId: product.categoryId,
    quantity: qty,
    retailPrice,
  })

  let enforcedPrice = clientSubmittedPrice; // Start with client's price
  let auditAction: 'PRICE_TAMPERING_BLOCKED' | 'PRICE_MANUAL_OVERRIDE' | 'PRICE_APPLIED' = 'PRICE_APPLIED'; // Default action

  if (clientSubmittedPrice !== normalPrice) {
    const difference = clientSubmittedPrice - normalPrice;

    if (clientSubmittedPrice < normalPrice) {
      // Client sent a lower price than server's calculation -> tampering blocked
      enforcedPrice = normalPrice; // Server enforces its own price
      auditAction = 'PRICE_TAMPERING_BLOCKED';
      reason = `Client submitted lower price (${clientSubmittedPrice}), enforced server price (${normalPrice}).`;
    } else {
      // Client sent a higher price -> legitimate manual override
      auditAction = 'PRICE_MANUAL_OVERRIDE';
      reason = `Manual override: client submitted higher price (${clientSubmittedPrice}), server calculated (${normalPrice}).`;
    }

    // Log the manual pricing override
    await tx.priceAdjustmentLog.create({ // Log the price adjustment/tampering attempt
      data: {
        orderId,
        productId,
        productName: product.name,
        originalPrice: normalPrice, // Server's calculated price
        customPrice: clientSubmittedPrice, // Client's submitted price
        difference,
        changedBy: actor,
        reason,
      },
    })

    await tx.auditLog.create({
      data: {
        action: auditAction, // Use the specific action
        entity: 'Order',
        entityId: String(orderId),
        details: JSON.stringify({
          productId,
          productName: product.name,
          originalPrice: normalPrice,
          clientSubmittedPrice: clientSubmittedPrice,
          enforcedPrice: enforcedPrice,
          difference,
          reason,
        }),
        changedBy: actor,
      },
    })

    // Crucially, update the OrderItem with the enforced price if it was tampered with
    // This ensures the OrderItem.price in the DB always reflects the final, authoritative price.
    if (enforcedPrice !== clientSubmittedPrice) {
      await tx.orderItem.updateMany({
        where: { orderId, productId },
        data: { price: enforcedPrice }
      });
    }
  }
  return enforcedPrice; // Return the price that was actually used
}
