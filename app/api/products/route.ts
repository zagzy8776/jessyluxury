import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

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

    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    console.error('Error creating product:', error)
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 })
  }
}
