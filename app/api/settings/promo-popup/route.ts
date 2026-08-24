import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireStaffAuth } from '@/lib/staff-auth'

/**
 * GET /api/settings/promo-popup
 * Fetch promotional popup configuration (public – storefront needs this)
 */
export async function GET() {
  try {
    let config = await prisma.promoPopupConfig.findUnique({ where: { id: 1 } })

    if (!config) {
      // Create default config if none exists
      config = await prisma.promoPopupConfig.create({
        data: {
          enabled: false,
          title: 'Congratulations ✨',
          message: "You've unlocked an exclusive shopping reward just for visiting today.",
          discountLabel: '10% OFF',
          couponCode: '',
          ctaText: 'Shop & Use Coupon',
          displayDelay: 4000,
          displayFreqHrs: 24,
          updatedAt: new Date(),
        },
      })
    }

    // Check if expired
    const isExpired = config.expiryDate && new Date(config.expiryDate) < new Date()

    return NextResponse.json({
      ...config,
      isExpired,
    })
  } catch (error) {
    console.error('[promo-popup] GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch promo popup config' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/settings/promo-popup
 * Update promotional popup configuration (admin only)
 */
export async function PUT(req: Request) {
  const authErr = await requireStaffAuth(req, 'settings')
  if (authErr) return authErr

  try {
    const body = await req.json()

    const {
      enabled,
      title,
      message,
      discountLabel,
      couponCode,
      ctaText,
      displayDelay,
      minPurchase,
      expiryDate,
      displayFreqHrs,
    } = body

    // Validate coupon code exists if enabled
    if (enabled && couponCode) {
      const coupon = await prisma.coupon.findUnique({
        where: { code: couponCode.toUpperCase() },
      })

      if (!coupon) {
        return NextResponse.json(
          { error: `Coupon code "${couponCode}" does not exist. Please create it first in Discounts.` },
          { status: 400 }
        )
      }

      if (!coupon.isActive) {
        return NextResponse.json(
          { error: `Coupon "${couponCode}" is inactive. Please activate it first.` },
          { status: 400 }
        )
      }
    }

    const updated = await prisma.promoPopupConfig.upsert({
      where: { id: 1 },
      create: {
        enabled: Boolean(enabled),
        title: title || 'Congratulations ✨',
        message: message || "You've unlocked an exclusive reward.",
        discountLabel: discountLabel || '10% OFF',
        couponCode: couponCode ? couponCode.toUpperCase() : '',
        ctaText: ctaText || 'Shop & Use Coupon',
        displayDelay: Number(displayDelay) || 4000,
        minPurchase: minPurchase ? Number(minPurchase) : null,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        displayFreqHrs: Number(displayFreqHrs) || 24,
        updatedAt: new Date(),
      },
      update: {
        enabled: Boolean(enabled),
        title,
        message,
        discountLabel,
        couponCode: couponCode ? couponCode.toUpperCase() : '',
        ctaText,
        displayDelay: Number(displayDelay),
        minPurchase: minPurchase ? Number(minPurchase) : null,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        displayFreqHrs: Number(displayFreqHrs),
        updatedAt: new Date(),
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('[promo-popup] PUT error:', error)
    return NextResponse.json(
      { error: 'Failed to update promo popup config' },
      { status: 500 }
    )
  }
}
