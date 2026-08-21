import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireStaffAuth } from '@/lib/staff-auth'
import { createAuditLog } from '@/lib/audit'
import { validateRequired } from '@/lib/validation'

/**
 * GET /api/settings/locations
 * 
 * Retrieves all store locations with pagination support.
 * Returns locations ordered by isDefault DESC, name ASC for deterministic results.
 * 
 * Query Parameters:
 * - page (optional): Page number, defaults to 1
 * - pageSize (optional): Number of items per page, defaults to 20
 * 
 * Authorization: Requires Admin authentication
 * 
 * Response:
 * - 200: { locations: StoreLocation[], total: number, page: number, pageSize: number }
 * - 401: { error: 'Unauthorized: Admin authentication required' }
 * - 500: { error: 'Failed to retrieve store locations' }
 */
export async function GET(request: Request) {
  const authErr = await requireStaffAuth(request, 'settings')
  if (authErr) return authErr

  try {
    // Parse query parameters for pagination
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1', 10)
    const pageSize = parseInt(searchParams.get('pageSize') || '20', 10)

    // Validate pagination parameters
    const validPage = Math.max(1, page)
    const validPageSize = Math.max(1, Math.min(100, pageSize)) // Cap at 100

    const skip = (validPage - 1) * validPageSize

    // Fetch locations with pagination, ordered deterministically
    const [locations, total] = await Promise.all([
      prisma.storeLocation.findMany({
        orderBy: [
          { isDefault: 'desc' }, // Default location first
          { name: 'asc' }        // Then alphabetically by name
        ],
        skip,
        take: validPageSize,
      }),
      prisma.storeLocation.count()
    ])

    return NextResponse.json({
      locations,
      total,
      page: validPage,
      pageSize: validPageSize
    })
  } catch (error) {
    console.error('Get store locations error:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve store locations' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/settings/locations
 * 
 * Creates a new store location with atomic default switching.
 * If isDefault is true, atomically unsets any existing default and sets new location as default.
 * 
 * Request Body:
 * - name (required): Location name (must be unique)
 * - address (required): Location address
 * - city (required): Location city
 * - isDefault (optional): Whether this is the default location
 * 
 * Authorization: Requires Admin authentication
 * 
 * Response:
 * - 200: Created StoreLocation
 * - 400: Validation error
 * - 409: Duplicate name
 * - 401: Unauthorized
 * - 500: Server error
 */
export async function POST(request: Request) {
  const authErr = await requireStaffAuth(request, 'settings')
  if (authErr) return authErr

  try {
    const body = await request.json()
    const { name, address, city, isDefault = false } = body

    // Validate required fields
    const nameError = validateRequired(name, 'Location name')
    if (nameError) {
      return NextResponse.json({ error: nameError }, { status: 400 })
    }

    const addressError = validateRequired(address, 'Address')
    if (addressError) {
      return NextResponse.json({ error: addressError }, { status: 400 })
    }

    const cityError = validateRequired(city, 'City')
    if (cityError) {
      return NextResponse.json({ error: cityError }, { status: 400 })
    }

    // Check for duplicate name
    const existingLocation = await prisma.storeLocation.findUnique({
      where: { name: name.trim() }
    })

    if (existingLocation) {
      return NextResponse.json(
        { error: 'Location name already exists' },
        { status: 409 }
      )
    }

    let newLocation

    // If creating as default, atomically switch default using transaction
    if (isDefault) {
      newLocation = await prisma.$transaction(async (tx) => {
        // Unset all existing defaults
        await tx.storeLocation.updateMany({
          where: { isDefault: true },
          data: { isDefault: false }
        })

        // Create new location as default
        const location = await tx.storeLocation.create({
          data: {
            name: name.trim(),
            address: address.trim(),
            city: city.trim(),
            isDefault: true,
            updatedAt: new Date()
          }
        })

        return location
      })
    } else {
      // Create non-default location (no transaction needed)
      newLocation = await prisma.storeLocation.create({
        data: {
          name: name.trim(),
          address: address.trim(),
          city: city.trim(),
          isDefault: false,
          updatedAt: new Date()
        }
      })
    }

    // Audit log
    await createAuditLog(
      'LOCATION_CREATED',
      'StoreLocation',
      String(newLocation.id),
      { 
        name: newLocation.name, 
        city: newLocation.city, 
        isDefault: newLocation.isDefault 
      },
      'Admin'
    )

    return NextResponse.json(newLocation)
  } catch (error) {
    console.error('Create store location error:', error)
    return NextResponse.json(
      { error: 'Failed to create store location' },
      { status: 500 }
    )
  }
}
