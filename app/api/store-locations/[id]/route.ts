import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireStaffAuth } from '@/lib/staff-auth'

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const authErr = await requireStaffAuth(request, 'settings')
  if (authErr) return authErr

  try {
    const id = parseInt(params.id, 10)
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid location ID' }, { status: 400 })
    }

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

    // Check if location exists
    const existing = await prisma.storeLocation.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Location not found' }, { status: 404 })
    }

    // Check for duplicate name (excluding current location)
    const duplicate = await prisma.storeLocation.findFirst({
      where: {
        name: name.trim(),
        id: { not: id }
      }
    })

    if (duplicate) {
      return NextResponse.json({ error: 'A location with this name already exists' }, { status: 400 })
    }

    // Transaction: If setting as default, unset existing default first
    const location = await prisma.$transaction(async (tx) => {
      if (isDefault === true) {
        // Unset existing default
        await tx.storeLocation.updateMany({
          where: { 
            isDefault: true,
            id: { not: id }
          },
          data: { isDefault: false }
        })
      }

      // Update location
      const updated = await tx.storeLocation.update({
        where: { id },
        data: {
          name: name.trim(),
          address: address.trim(),
          city: city.trim(),
          isDefault: isDefault === true
        }
      })

      return updated
    })

    // Audit log
    await prisma.auditLog.create({
      data: {
        action: isDefault !== existing.isDefault ? 'STORE_LOCATION_DEFAULT_CHANGED' : 'STORE_LOCATION_UPDATED',
        entity: 'StoreLocation',
        entityId: id.toString(),
        details: JSON.stringify({ 
          name: location.name, 
          city: location.city,
          isDefault: location.isDefault,
          wasDefault: existing.isDefault
        }),
        changedBy: 'Admin',
      }
    })

    return NextResponse.json(location)
  } catch (error) {
    console.error('Update store location error:', error)
    return NextResponse.json({ error: 'Failed to update store location' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const authErr = await requireStaffAuth(request, 'settings')
  if (authErr) return authErr

  try {
    const id = parseInt(params.id, 10)
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid location ID' }, { status: 400 })
    }

    // Check if location exists
    const location = await prisma.storeLocation.findUnique({ where: { id } })
    if (!location) {
      return NextResponse.json({ error: 'Location not found' }, { status: 404 })
    }

    // Cannot delete default location
    if (location.isDefault) {
      return NextResponse.json({ 
        error: 'Cannot delete the default location. Please set another location as default first.' 
      }, { status: 400 })
    }

    // Check if location is referenced by existing coupons
    const couponsUsingLocation = await prisma.coupon.count({
      where: { storeLocation: location.name }
    })

    if (couponsUsingLocation > 0) {
      return NextResponse.json({ 
        error: `Cannot delete location. It is referenced by ${couponsUsingLocation} existing coupon(s).` 
      }, { status: 400 })
    }

    // Safe to delete
    await prisma.storeLocation.delete({ where: { id } })

    // Audit log
    await prisma.auditLog.create({
      data: {
        action: 'STORE_LOCATION_DELETED',
        entity: 'StoreLocation',
        entityId: id.toString(),
        details: JSON.stringify({ 
          name: location.name, 
          city: location.city 
        }),
        changedBy: 'Admin',
      }
    })

    return NextResponse.json({ success: true, message: 'Location deleted successfully' })
  } catch (error) {
    console.error('Delete store location error:', error)
    return NextResponse.json({ error: 'Failed to delete store location' }, { status: 500 })
  }
}
