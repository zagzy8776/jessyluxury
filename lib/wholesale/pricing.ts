import { prisma } from '@/lib/prisma'

export function retailUnitPrice(product: { price: number; salePrice?: number | null }): number {
  return product.salePrice != null ? product.salePrice : product.price
}

type PriceRule = {
  productId: number | null
  categoryId: number | null
  minQuantity: number
  unitPrice: number | null
  discountPercent: number | null
}

function applyRule(retail: number, rule: PriceRule, quantity: number): number | null {
  if (quantity < rule.minQuantity) return null
  if (rule.unitPrice != null) return rule.unitPrice
  if (rule.discountPercent != null) {
    const pct = Math.min(100, Math.max(0, rule.discountPercent))
    return Math.round((retail * (100 - pct)) / 100)
  }
  return null
}

function pickBest(rules: PriceRule[], retail: number, quantity: number): number | null {
  const eligible = rules
    .filter((rule) => quantity >= rule.minQuantity)
    .sort((a, b) => b.minQuantity - a.minQuantity)
  if (eligible.length === 0) return null
  return applyRule(retail, eligible[0], quantity)
}

export async function resolveWholesaleUnitPrice(args: {
  customerGroupId?: number | null
  productId: number
  categoryId?: number | null
  quantity: number
  retailPrice: number
}): Promise<number> {
  const { customerGroupId, productId, categoryId, quantity, retailPrice } = args
  if (!customerGroupId) return retailPrice

  const group = await prisma.customerGroup.findUnique({
    where: { id: customerGroupId },
    include: { WholesalePriceRule: true },
  })
  if (!group || !group.isActive) return retailPrice

  const rules = group.WholesalePriceRule
  const productPrice = pickBest(rules.filter((r: PriceRule) => r.productId === productId), retailPrice, quantity)
  if (productPrice != null) return productPrice

  if (categoryId != null) {
    const categoryPrice = pickBest(
      rules.filter((r: PriceRule) => r.productId == null && r.categoryId === categoryId),
      retailPrice,
      quantity
    )
    if (categoryPrice != null) return categoryPrice
  }

  const groupPrice = pickBest(
    rules.filter((r: PriceRule) => r.productId == null && r.categoryId == null),
    retailPrice,
    quantity
  )
  return groupPrice != null ? groupPrice : retailPrice
}

export async function getActiveWholesaleGroupId(customerId?: number | null): Promise<number | null> {
  if (!customerId) return null
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    select: {
      customerGroupId: true,
      CustomerGroup: { select: { isActive: true } },
    },
  })
  if (customer?.customerGroupId && customer.CustomerGroup?.isActive) {
    return customer.customerGroupId
  }
  return null
}

export async function decorateProductsWithWholesale<T extends {
  id: number
  price: number
  salePrice?: number | null
  categoryId: number
}>(products: T[], customerId?: number | null): Promise<Array<T & {
  wholesalePrice: number | null
  displayPrice: number
  isWholesale: boolean
}>> {
  const groupId = await getActiveWholesaleGroupId(customerId)
  const decorated = []
  for (const product of products) {
    const retail = retailUnitPrice(product)
    const displayPrice = await resolveWholesaleUnitPrice({
      customerGroupId: groupId,
      productId: product.id,
      categoryId: product.categoryId,
      quantity: 1,
      retailPrice: retail,
    })
    decorated.push({
      ...product,
      wholesalePrice: groupId != null ? displayPrice : null,
      displayPrice,
      isWholesale: groupId != null,
    })
  }
  return decorated
}

export function couponAudienceError(wholesaleEligible: boolean, isWholesale: boolean): string | null {
  if (isWholesale && !wholesaleEligible) {
    return 'This coupon is for retail customers only'
  }
  if (!isWholesale && wholesaleEligible) {
    return 'This coupon is for wholesale customers only'
  }
  return null
}
