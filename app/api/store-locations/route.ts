import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireStaffAuth } from '@/lib/staff-auth'

export async function GET(request: Request) {
  const authErr = await requireStaffAuth(request, 'settings')
  if (authErr) return authErr

  try {
    const locations = await prisma.storeLocation.findMany({
      orderBy: [
        { isDefault: 'desc' }, // Default first
        { name: 'asc' }
      ]
    })

    return NextResponse.json(locations)
  } catch (error) {
    console.error('Get store locations error:', error)
    return NextResponse.json({ error: 'Failed to retrieve store locations' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const authErr = await requireStaffAuth(request, 'settings')
  if (authErr) return authErr

  try {
    const { name, address, city, isDefault } = await request.json()

    // Server-side validation
    if (!name || name.trim().length === 0) {
      return NextResponse.json({ error: 'Location name is required' }, { status: 400 })
    }

    if (!address || address.trim().length === 0) {
      return NextResponse.json({ error: 'Address is required' }, { status: 400 })
    }

    if (!city || city.trim().length === 0) {
      return NextResponse.json({ error: 'City is required' }, { status: 400 })
    }

    // Check for duplicate name
    const existing = await prisma.storeLocation.findUnique({
      where: { name: name.trim() }
    })

    if (existing) {
      return NextResponse.json({ error: 'A location with this name already exists' }, { status: 400 })
    }

    // Transaction: If setting as default, unset existing default first
    const location = await prisma.$transaction(async (tx) => {
      if (isDefault === true) {
        // Unset existing default
        await tx.storeLocation.updateMany({
          where: { isDefault: true },
          data: { isDefault: false }
        })
      }

      // Create new location
      const newLocation = await tx.storeLocation.create({
        data: {
          name: name.trim(),
          address: address.trim(),
          city: city.trim(),
          isDefault: isDefault === true,
          updatedAt: new Date()
        }
      })

      return newLocation
    })

    // Audit log
    await prisma.auditLog.create({
      data: {
        action: 'STORE_LOCATION_CREATED',
        entity: 'StoreLocation',
        entityId: location.id.toString(),
        details: JSON.stringify({ 
          name: location.name, 
          city: location.city,
          isDefault: location.isDefault 
        }),
        changedBy: 'Admin',
      }
    })

    return NextResponse.json(location, { status: 201 })
  } catch (error) {
    console.error('Create store location error:', error)
    return NextResponse.json({ error: 'Failed to create store location' }, { status: 500 })
  }
}
