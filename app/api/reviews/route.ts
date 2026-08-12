import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const { productId, customerName, rating, comment } = await request.json()

    if (!productId || !customerName || !rating || !comment) {
      return NextResponse.json({ error: 'All review fields are required' }, { status: 400 })
    }

    const review = await prisma.review.create({
      data: {
        productId: Number(productId),
        customerName,
        rating: Number(rating),
        comment,
      },
    })

    return NextResponse.json(review, { status: 201 })
  } catch (error) {
    console.error('Error creating review:', error)
    return NextResponse.json({ error: 'Failed to post review' }, { status: 500 })
  }
}
