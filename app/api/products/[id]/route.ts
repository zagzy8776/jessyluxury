import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const productId = parseInt(params.id, 10)
    if (isNaN(productId)) {
      return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 })
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        category: true,
        reviews: {
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    return NextResponse.json(product)
  } catch (error) {
    console.error('Error fetching product:', error)
    return NextResponse.json({ error: 'Failed to fetch product' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const productId = parseInt(params.id, 10)
    const body = await request.json()

    const product = await prisma.product.update({
      where: { id: productId },
      data: {
        name: body.name,
        brand: body.brand,
        price: Number(body.price),
        salePrice: body.salePrice ? Number(body.salePrice) : null,
        badge: body.badge || null,
        categoryId: Number(body.categoryId),
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
      },
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
  try {
    const productId = parseInt(params.id, 10)
    await prisma.product.delete({
      where: { id: productId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting product:', error)
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 })
  }
}
