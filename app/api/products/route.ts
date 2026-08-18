import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdminAuth } from '@/lib/auth'
import { broadcastOneSignalPush } from '@/lib/notifications/client'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const featured = searchParams.get('featured')
    const gift = searchParams.get('gift')

    const where: any = {}

    if (category && category !== 'All') {
      where.category = {
        name: category,
      }
    }

    if (featured === 'true') {
      where.featured = true
    }

    if (gift === 'true') {
      where.gift = true
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { brand: { contains: search, mode: 'insensitive' } },
        { notes: { contains: search, mode: 'insensitive' } },
      ]
    }

    const products = await prisma.product.findMany({
      where,
      include: {
        category: true,
        reviews: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(products)
  } catch (error) {
    console.error('Error fetching products:', error)
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const authErr = await requireAdminAuth(request)
  if (authErr) return authErr

  try {
    const body = await request.json()
    const {
      name,
      brand,
      price,
      salePrice,
      costPrice,
      badge,
      categoryId,
      volume,
      notes,
      topNotes,
      middleNotes,
      baseNotes,
      description,
      tone,
      stock,
      featured,
      gift,
      images,
    } = body

    const product = await prisma.product.create({
      data: {
        name,
        brand,
        price: Number(price),
        salePrice: salePrice ? Number(salePrice) : null,
        costPrice: costPrice ? Number(costPrice) : 0,
        badge,
        categoryId: Number(categoryId),
        volume: volume || '100ml EDP',
        notes,
        topNotes,
        middleNotes,
 baseNotes,
        description,
        tone: tone || 'amber',
        stock: Number(stock) || 10,
        featured: Boolean(featured),
        gift: Boolean(gift),
        images: Array.isArray(images) ? images : [],
      },
    })

    // Broadcast push notification to all subscribed customers about the new product
    try {
      const priceStr = product.salePrice ? `N${product.salePrice}` : `N${product.price}`
      const promoMsg = `Discover our new arrival: ${product.name} by ${product.brand}. notes: ${product.notes || 'delightful scents'}. Buy now for ${priceStr}!`
      broadcastOneSignalPush(`New Scent Added! ✨`, promoMsg, `/products/${product.id}`).catch((err) => {
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
