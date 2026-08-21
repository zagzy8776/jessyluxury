import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireStaffAuth } from '@/lib/staff-auth'
import { validateRequired, validateEmail } from '@/lib/validation'
import { createAuditLog } from '@/lib/audit'

export async function POST(request: Request) {
  // Require Admin authorization
  const authErr = await requireStaffAuth(request, 'settings')
  if (authErr) return authErr

  try {
    const config = await request.json()

    // Validate schema version
    if (!config.schemaVersion) {
      return NextResponse.json({ error: 'Missing schemaVersion in import data' }, { status: 400 })
    }

    const errors: string[] = []

    // Validate business profile if present
    if (config.businessProfile) {
      const bp = config.businessProfile
      if (!bp.name?.trim()) errors.push('Business name is required')
      if (!bp.email?.trim()) errors.push('Email is required')
      if (!bp.phone?.trim()) errors.push('Phone is required')
      if (!bp.address?.trim()) errors.push('Address is required')
      if (!bp.hours?.trim()) errors.push('Business hours are required')
    }

    // Validate store locations
    if (config.storeLocations && Array.isArray(config.storeLocations)) {
      const defaultCount = config.storeLocations.filter((l: any) => l.isDefault).length
      if (defaultCount !== 1) {
        errors.push('Exactly one location must be marked as default')
      }

      // Check for duplicate names
      const names = new Set<string>()
      config.storeLocations.forEach((l: any) => {
        if (!l.name?.trim()) errors.push('Location name is required')
        if (!l.address?.trim()) errors.push('Location address is required')
        if (!l.city?.trim()) errors.push('Location city is required')
        if (names.has(l.name?.trim())) errors.push(`Duplicate location name: ${l.name}`)
        names.add(l.name?.trim())
      })
    }

    // Validate staff accounts
    if (config.staffAccounts && Array.isArray(config.staffAccounts)) {
      const emails = new Set<string>()
      const validRoles = ['Owner', 'Manager', 'Fulfillment', 'Catalog']
      
      config.staffAccounts.forEach((s: any) => {
        if (!s.name?.trim()) errors.push('Staff name is required')
        if (!s.email?.trim()) errors.push('Staff email is required')
        if (!validateEmail(s.email)) errors.push(`Invalid email format: ${s.email}`)
        if (emails.has(s.email?.trim())) errors.push(`Duplicate staff email: ${s.email}`)
        if (!validRoles.includes(s.role)) errors.push(`Invalid staff role: ${s.role}`)
        
        // Validate permissions
        const validPermissions = ['orders', 'products', 'customers', 'analytics', 'settings', 'catalog', 'fulfillment']
        if (Array.isArray(s.permissions)) {
          s.permissions.forEach((perm: string) => {
            if (!validPermissions.includes(perm)) {
              errors.push(`Invalid permission: ${perm}`)
            }
          })
        }
        
        emails.add(s.email?.trim())
      })
    }

    // Check for unmasked secrets in payment settings — no longer needed,
    // bank details are plain text and safe to import

    if (config.notificationSettings) {
      const ns = config.notificationSettings
      if (ns.resendApiKey && !ns.resendApiKey.includes('•') && ns.resendApiKey.length > 10) {
        errors.push('Cannot import unmasked Resend API keys. Use masked format or empty.')
      }
      if (ns.oneSignalApiKey && !ns.oneSignalApiKey.includes('•') && ns.oneSignalApiKey.length > 10) {
        errors.push('Cannot import unmasked OneSignal API keys. Use masked format or empty.')
      }
    }

    // Return errors if any validation failed
    if (errors.length > 0) {
      return NextResponse.json({ error: 'Validation failed', details: errors }, { status: 400 })
    }

    // Use transaction for atomic import
    await prisma.$transaction(async (tx) => {
      // Import business profile
      if (config.businessProfile) {
        const bp = config.businessProfile
        await tx.businessProfile.upsert({
          where: { id: 1 },
          update: {
            name: bp.name.trim(),
            email: bp.email.trim(),
            phone: bp.phone.trim(),
            address: bp.address.trim(),
            hours: bp.hours.trim(),
            taxId: bp.taxId?.trim() || null,
            updatedAt: new Date()
          },
          create: {
            id: 1,
            name: bp.name.trim(),
            email: bp.email.trim(),
            phone: bp.phone.trim(),
            address: bp.address.trim(),
            hours: bp.hours.trim(),
            taxId: bp.taxId?.trim() || null,
            updatedAt: new Date()
          }
        })
      }

      // Import store locations - delete existing and recreate
      if (config.storeLocations && Array.isArray(config.storeLocations)) {
        // Note: This is a full replace. In production, you may want partial import
        await tx.storeLocation.deleteMany({})
        
        for (const loc of config.storeLocations) {
          await tx.storeLocation.create({
            data: {
              name: loc.name.trim(),
              address: loc.address.trim(),
              city: loc.city.trim(),
              isDefault: loc.isDefault || false,
              updatedAt: new Date()
            }
          })
        }
      }

      // Import staff accounts - for now, only update existing or create new (don't delete)
      // Full replacement strategy would need to handle foreign key constraints first
      if (config.staffAccounts && Array.isArray(config.staffAccounts)) {
        for (const staff of config.staffAccounts) {
          // Try to find existing staff by email
          const existing = await tx.staffAccount.findUnique({
            where: { email: staff.email.trim() }
          })
          
          if (existing) {
            // Update existing
            await tx.staffAccount.update({
              where: { id: existing.id },
              data: {
                name: staff.name.trim(),
                role: staff.role,
                permissions: staff.permissions || ['orders', 'products'],
                active: staff.active !== false,
                updatedAt: new Date()
              }
            })
          } else {
            // Create new
            await tx.staffAccount.create({
              data: {
                name: staff.name.trim(),
                email: staff.email.trim(),
                role: staff.role,
                permissions: staff.permissions || ['orders', 'products'],
                active: staff.active !== false,
                updatedAt: new Date()
              }
            })
          }
        }
      }

      // Import payment settings
      if (config.paymentSettings) {
        const ps = config.paymentSettings
        await tx.paymentSettings.upsert({
          where: { id: 1 },
          update: {
            bankAccountNumber: ps.bankAccountNumber || null,
            bankAccountName: ps.bankAccountName || null,
            bankName: ps.bankName || null,
            updatedAt: new Date()
          },
          create: {
            id: 1,
            bankAccountNumber: ps.bankAccountNumber || null,
            bankAccountName: ps.bankAccountName || null,
            bankName: ps.bankName || null,
            updatedAt: new Date()
          }
        })
      }

      // Import notification settings (similar to payment settings)
      if (config.notificationSettings) {
        const ns = config.notificationSettings
        await tx.notificationSettings.upsert({
          where: { id: 1 },
          update: {
            emailEnabled: ns.emailEnabled !== undefined ? ns.emailEnabled : true,
            pushEnabled: ns.pushEnabled !== undefined ? ns.pushEnabled : true,
            updatedAt: new Date()
          },
          create: {
            id: 1,
            emailEnabled: ns.emailEnabled !== undefined ? ns.emailEnabled : true,
            pushEnabled: ns.pushEnabled !== undefined ? ns.pushEnabled : true,
            updatedAt: new Date()
          }
        })
      }

      // Import system defaults
      if (config.systemDefaults) {
        const sd = config.systemDefaults
        await tx.systemDefaults.upsert({
          where: { id: 1 },
          update: {
            defaultShippingZoneId: sd.defaultShippingZoneId || null,
            defaultStoreLocationId: sd.defaultStoreLocationId || null,
            defaultAcquisitionSource: sd.defaultAcquisitionSource || 'Manual',
            orderNumberPrefix: sd.orderNumberPrefix || 'JL',
            updatedAt: new Date()
          },
          create: {
            id: 1,
            defaultShippingZoneId: sd.defaultShippingZoneId || null,
            defaultStoreLocationId: sd.defaultStoreLocationId || null,
            defaultAcquisitionSource: sd.defaultAcquisitionSource || 'Manual',
            orderNumberPrefix: sd.orderNumberPrefix || 'JL',
            updatedAt: new Date()
          }
        })
      }

      // Create audit log
      await tx.auditLog.create({
        data: {
          action: 'SETTINGS_IMPORTED',
          entity: 'SystemConfig',
          entityId: '1',
          details: JSON.stringify({
            businessProfile: !!config.businessProfile,
            storeLocations: config.storeLocations?.length || 0,
            staffAccounts: config.staffAccounts?.length || 0,
            paymentSettings: !!config.paymentSettings,
            notificationSettings: !!config.notificationSettings,
            systemDefaults: !!config.systemDefaults
          }),
          changedBy: 'Admin'
        }
      })
    })

    return NextResponse.json({
      success: true,
      message: 'Configuration imported successfully',
      warnings: []
    })
  } catch (error) {
    console.error('Import config error:', error)
    return NextResponse.json({ error: 'Failed to import configuration' }, { status: 500 })
  }
}
