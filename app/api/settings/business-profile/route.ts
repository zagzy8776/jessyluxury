import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireStaffAuth } from '@/lib/staff-auth'
import { validateEmail, validatePhone, validateRequired } from '@/lib/validation'
import { createAuditLog } from '@/lib/audit'

export async function GET(request: Request) {
  const authErr = await requireStaffAuth(request, 'settings')
  if (authErr) return authErr

  try {
    let profile = await prisma.businessProfile.findUnique({ where: { id: 1 } })
    
    // Create default if not exists
    if (!profile) {
      profile = await prisma.businessProfile.create({
        data: { id: 1, updatedAt: new Date() }
      })
    }

    return NextResponse.json(profile)
  } catch (error) {
    console.error('Get business profile error:', error)
    return NextResponse.json({ error: 'Failed to retrieve business profile' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  const authErr = await requireStaffAuth(request, 'settings')
  if (authErr) return authErr

  try {
    const { name, phone, email, address, hours, taxId } = await request.json()

    // Server-side validation using lib/validation.ts
    
    // Validate required fields
    const nameError = validateRequired(name, 'Business name')
    if (nameError) {
      return NextResponse.json({ error: nameError }, { status: 400 })
    }

    const emailError = validateRequired(email, 'Email')
    if (emailError) {
      return NextResponse.json({ error: emailError }, { status: 400 })
    }

    const phoneError = validateRequired(phone, 'Phone')
    if (phoneError) {
      return NextResponse.json({ error: phoneError }, { status: 400 })
    }

    const addressError = validateRequired(address, 'Address')
    if (addressError) {
      return NextResponse.json({ error: addressError }, { status: 400 })
    }

    const hoursError = validateRequired(hours, 'Business hours')
    if (hoursError) {
      return NextResponse.json({ error: hoursError }, { status: 400 })
    }

    // Validate email format
    if (!validateEmail(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
    }

    // Validate phone format
    if (!validatePhone(phone)) {
      return NextResponse.json({ error: 'Invalid phone format' }, { status: 400 })
    }

    // Upsert profile
    const profile = await prisma.businessProfile.upsert({
      where: { id: 1 },
      update: {
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        address: address.trim(),
        hours: hours.trim(),
        taxId: taxId?.trim() || null,
        updatedAt: new Date(),
      },
      create: {
        id: 1,
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        address: address.trim(),
        hours: hours.trim(),
        taxId: taxId?.trim() || null,
        updatedAt: new Date(),
      }
    })

    // Audit logging using lib/audit.ts
    await createAuditLog(
      'BUSINESS_PROFILE_UPDATED',
      'BusinessProfile',
      '1',
      { 
        name: profile.name, 
        email: profile.email,
        phone: profile.phone 
      },
      'Admin'
    )

    return NextResponse.json(profile)
  } catch (error) {
    console.error('Update business profile error:', error)
    return NextResponse.json({ error: 'Failed to update business profile' }, { status: 500 })
  }
}
