import { NextResponse } from 'next/server'
import { requireStaffAuth, getStaffIdFromToken } from '@/lib/staff-auth'
import { broadcastOneSignalPush } from '@/lib/notifications/client'
import { decorateProductsWithWholesale } from '@/lib/wholesale/pricing'
import { isAdminAuthenticated, isCustomerAuthenticated } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const featured = searchParams.get('featured')
    const gift = searchParams.get('gift')
    const includeInactive = searchParams.get('includeInactive') === 'true'

    const isStaff = (await isAdminAuthenticated(request)) || (await getStaffIdFromToken(request) !== null)

    const where: any = {}

    // Default: only active products for both customers and admin catalog.
    // Soft-deleted (hidden) products stay out of the normal admin list so
    // Delete removes them from the UI permanently. Staff can still request
    // them with ?includeInactive=true if a "show hidden" view is needed later.
    if (!(isStaff && includeInactive)) {
      where.isActive = true
    }

    if (category && category !== 'All') where.Category = { name: category }
    if (featured === 'true') where.featured = true
    if (gift === 'true') where.gift = true

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { brand: { contains: search, mode: 'insensitive' } },
        { notes: { contains: search, mode: 'insensitive' } },
      ]
    }

    const products = await prisma.product.findMany({
      where,
      include: { Category: true, Review: true },
      orderBy: { createdAt: 'desc' },
    })

    let customerId = await isCustomerAuthenticated(request)
    if (isStaff) {
      const forCustomerId = Number(searchParams.get('forCustomerId'))
      if (!isNaN(forCustomerId) && forCustomerId > 0) customerId = forCustomerId
    }

    const decorated = await decorateProductsWithWholesale(products, customerId)
    const normalized = decorated.map((product: any) => {
      const { Category, Review, ...rest } = product
      if (isStaff) return { ...rest, category: Category ?? null, reviews: Review ?? [] }

      const { costPrice: _costPrice, reserved, ...publicProduct } = rest
      return {
        ...publicProduct,
        stock: Math.max(0, Number(product.stock || 0) - Number(reserved || 0)),
        category: Category ?? null,
        reviews: Review ?? [],
      }
    })

    return NextResponse.json(normalized, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    console.error('Error fetching products:', error)
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500, headers: { 'Cache-Control': 'no-store' } })
  }
}

export async function POST(request: Request) {
  const authErr = await requireStaffAuth(request, 'products')
  if (authErr) return authErr

  try {
    const body = await request.json()
    const {
      name, brand, price, salePrice, costPrice, badge, categoryId, volume, notes,
      topNotes, middleNotes, baseNotes, description, tone, stock, featured, gift, images,
    } = body

    // Validate all required fields before hitting the database.
    const normalizedName = typeof name === 'string' ? name.trim() : ''
    if (!normalizedName) {
      return NextResponse.json({ error: 'Product name is required' }, { status: 400 })
    }

    const normalizedBrand = typeof brand === 'string' && brand.trim() ? brand.trim() : 'Jessy Selection'
    const normalizedPrice = Number(price)
    if (!Number.isFinite(normalizedPrice) || normalizedPrice <= 0) {
      return NextResponse.json({ error: 'A valid positive retail price is required' }, { status: 400 })
    }

    const normalizedStock = Number.isFinite(Number(stock)) ? Math.max(0, Math.trunc(Number(stock))) : 10

    const normalizedCategoryId = Number(categoryId)
    if (!Number.isInteger(normalizedCategoryId) || normalizedCategoryId <= 0) {
      return NextResponse.json({ error: 'Please select a valid product category' }, { status: 400 })
    }

    const category = await prisma.category.findUnique({ where: { id: normalizedCategoryId }, select: { id: true } })
    if (!category) {
      return NextResponse.json({ error: 'The selected product category no longer exists' }, { status: 400 })
    }

    const product = await prisma.product.create({
      data: {
        name: normalizedName,
        brand: normalizedBrand,
        price: normalizedPrice,
        salePrice: salePrice !== undefined && salePrice !== null && salePrice !== '' ? Number(salePrice) : null,
        costPrice: costPrice ? Number(costPrice) : 0,
        badge: badge || null,
        categoryId: normalizedCategoryId,
        volume: volume || '100ml EDP',
        notes: typeof notes === 'string' ? notes : '',
        topNotes: topNotes || null,
        middleNotes: middleNotes || null,
        baseNotes: baseNotes || null,
        description: description || null,
        tone: tone || 'amber',
        stock: normalizedStock,
        featured: Boolean(featured),
        gift: Boolean(gift),
        isActive: true,
        images: Array.isArray(images) ? images : [],
        updatedAt: new Date(),
      },
    })

    try {
      const priceStr = product.salePrice ? `N${product.salePrice}` : `N${product.price}`
      const promoMsg = `Discover our new arrival: ${product.name} by ${product.brand}. notes: ${product.notes || 'delightful scents'}. Buy now for ${priceStr}!`
      broadcastOneSignalPush(`New Scent Added! ✨`, promoMsg, `/shop/${product.id}`).catch((err) => {
        console.error('Failed to broadcast product push notification:', err)
      })
    } catch (err) {
      console.error('Failed to initiate product push broadcast:', err)
    }

    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    console.error('Error creating product:', error)
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 })
  }
}
