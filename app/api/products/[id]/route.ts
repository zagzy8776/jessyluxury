import { NextResponse } from 'next/server'
import { requireStaffAuth, getStaffIdFromToken } from '@/lib/staff-auth'
import { decorateProductsWithWholesale } from '@/lib/wholesale/pricing'
import { isAdminAuthenticated, isCustomerAuthenticated } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const productId = parseInt(params.id, 10)
    if (isNaN(productId)) return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 })

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { Category: true, Review: { orderBy: { createdAt: 'desc' } } },
    })

    if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 })

    const isStaff = (await isAdminAuthenticated(request)) || (await getStaffIdFromToken(request) !== null)

    // Hide inactive products from customers / public API consumers
    if (!isStaff && !product.isActive) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    let customerId = await isCustomerAuthenticated(request)
    if (isStaff) {
      const forCustomerId = Number(new URL(request.url).searchParams.get('forCustomerId'))
      if (!isNaN(forCustomerId) && forCustomerId > 0) customerId = forCustomerId
    }

    const [decorated] = await decorateProductsWithWholesale([product], customerId)
    const { Category, Review, ...rest } = decorated as any

    if (isStaff) {
      return NextResponse.json({ ...rest, category: Category ?? null, reviews: Review ?? [] }, { headers: { 'Cache-Control': 'no-store' } })
    }

    const { costPrice: _costPrice, reserved, ...publicProduct } = rest
    return NextResponse.json({
      ...publicProduct,
      stock: Math.max(0, Number(product.stock || 0) - Number(reserved || 0)),
      category: Category ?? null,
      reviews: Review ?? [],
    }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    console.error('Error fetching product:', error)
    return NextResponse.json({ error: 'Failed to fetch product' }, { status: 500, headers: { 'Cache-Control': 'no-store' } })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const authErr = await requireStaffAuth(request, 'products')
  if (authErr) return authErr

  try {
    const productId = parseInt(params.id, 10)
    const body = await request.json()
    const categoryId = Number(body.categoryId)

    if (!Number.isInteger(categoryId) || categoryId <= 0) {
      return NextResponse.json({ error: 'Please select a valid product category' }, { status: 400 })
    }

    const category = await prisma.category.findUnique({ where: { id: categoryId }, select: { id: true } })
    if (!category) return NextResponse.json({ error: 'The selected product category no longer exists' }, { status: 400 })

    const data: any = {
      name: body.name,
      brand: body.brand,
      price: Number(body.price),
      salePrice: body.salePrice ? Number(body.salePrice) : null,
      badge: body.badge || null,
      categoryId,
      volume: body.volume,
      notes: body.notes,
      topNotes: body.topNotes,
      middleNotes: body.middleNotes,
      baseNotes: body.baseNotes,
      description: body.description,
      tone: body.tone,
      stock: Number(body.stock),
      featured: Boolean(body.featured),
      gift: Boolean(body.gift),
      images: Array.isArray(body.images) ? body.images : [],
      updatedAt: new Date(),
    }

    // Allow staff to re-activate a previously soft-deleted product
    if (typeof body.isActive === 'boolean') {
      data.isActive = body.isActive
    }

    const product = await prisma.product.update({
      where: { id: productId },
      data,
    })

    return NextResponse.json(product)
  } catch (error) {
    console.error('Error updating product:', error)
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const authErr = await requireStaffAuth(request, 'products')
  if (authErr) return authErr

  try {
    const productId = parseInt(params.id, 10)
    if (isNaN(productId)) return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 })

    const product = await prisma.product.findUnique({ where: { id: productId }, select: { id: true, isActive: true } })
    if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 })

    // Soft-delete: hide from storefront while preserving the row for order history / FK integrity.
    await prisma.product.update({
      where: { id: productId },
      data: {
        isActive: false,
        featured: false,
        gift: false,
        updatedAt: new Date(),
      },
    })

    return NextResponse.json({ success: true, softDeleted: true })
  } catch (error) {
    console.error('Error soft-deleting product:', error)
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 })
  }
}
