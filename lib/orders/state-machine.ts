export type FulfillmentStatus = 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'RETURNED'
export type PaymentStatus = 'UNPAID' | 'PARTIALLY_PAID' | 'PAID' | 'REFUNDED'

const VALID_FULFILLMENT_TRANSITIONS: Record<FulfillmentStatus, FulfillmentStatus[]> = {
  PENDING: ['PROCESSING', 'CANCELLED'],
  PROCESSING: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['DELIVERED', 'RETURNED'],
  DELIVERED: ['RETURNED'],
  CANCELLED: [], // terminal state
  RETURNED: [],  // terminal state
}

const VALID_PAYMENT_TRANSITIONS: Record<PaymentStatus, PaymentStatus[]> = {
  UNPAID: ['PARTIALLY_PAID', 'PAID', 'REFUNDED'],
  PARTIALLY_PAID: ['PAID'],
  PAID: ['REFUNDED'],
  REFUNDED: [], // terminal state
}

export function canTransitionFulfillment(from: FulfillmentStatus, to: FulfillmentStatus): boolean {
  if (from === to) return true
  const allowed = VALID_FULFILLMENT_TRANSITIONS[from] || []
  return allowed.includes(to)
}

export function canTransitionPayment(from: PaymentStatus, to: PaymentStatus): boolean {
  if (from === to) return true
  const allowed = VALID_PAYMENT_TRANSITIONS[from] || []
  return allowed.includes(to)
}
