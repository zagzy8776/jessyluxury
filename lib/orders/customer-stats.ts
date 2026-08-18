export type OrderState = {
  paymentStatus: string;
  status: string;
  total: number;
};

/**
 * Checks if an order qualifies as completed according to the strict system invariant:
 * - paymentStatus must be PAID
 * - status must not be CANCELLED or RETURNED
 */
export function isCompletedOrder(order: Pick<OrderState, 'paymentStatus' | 'status'>): boolean {
  return order.paymentStatus === 'PAID' &&
         order.status !== 'CANCELLED' &&
         order.status !== 'RETURNED';
}

/**
 * Updates a customer's cached summary statistics (ordersCount, totalSpent)
 * inside a database transaction by analyzing the before -> after state transition.
 */
export async function updateCustomerStats(
  tx: any,
  customerId: number,
  beforeOrder: OrderState | null,
  afterOrder: OrderState
): Promise<void> {
  const wasCompleted = beforeOrder ? isCompletedOrder(beforeOrder) : false;
  const isCompleted = isCompletedOrder(afterOrder);

  let ordersCountDelta = 0;
  let totalSpentDelta = 0;

  if (!wasCompleted && isCompleted) {
    ordersCountDelta = 1;
    totalSpentDelta = afterOrder.total;
  } else if (wasCompleted && !isCompleted) {
    ordersCountDelta = -1;
    totalSpentDelta = -beforeOrder!.total;
  } else if (wasCompleted && isCompleted) {
    // Handle changes in order totals for already completed orders
    totalSpentDelta = afterOrder.total - beforeOrder!.total;
  }

  if (ordersCountDelta !== 0 || totalSpentDelta !== 0) {
    await tx.customer.update({
      where: { id: customerId },
      data: {
        ordersCount: { increment: ordersCountDelta },
        totalSpent: { increment: totalSpentDelta },
      },
    });
  }
}
