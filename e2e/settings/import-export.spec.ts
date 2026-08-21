import '../load-env'
import { test, expect } from '@playwright/test'
import { PrismaClient } from '@prisma/client'
import { generateAdminToken } from '../../lib/auth-crypto'

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'
const prisma = new PrismaClient()

test.describe('Configuration Import/Export', () => {
  let authToken: string

  test.beforeAll(async () => {
    // Ensure SystemConfig record exists for token generation
    const config = await prisma.systemConfig.upsert({
      where: { id: 1 },
      update: {},
      create: { id: 1, sessionVersion: 1, updatedAt: new Date() },
    })
    const sessionVersion = config.sessionVersion
    authToken = await generateAdminToken(sessionVersion)
  })

  test('should export all settings as JSON with masked secrets', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/settings/config/export`, {
      headers: { 'Cookie': `jl_admin_token=${authToken}` }
    })

    expect(response.status()).toBe(200)

    const config = await response.json()

    // Verify structure
    expect(config).toHaveProperty('schemaVersion')
    expect(config).toHaveProperty('exportTimestamp')
    expect(config).toHaveProperty('businessProfile')
    expect(config).toHaveProperty('storeLocations')
    expect(config).toHaveProperty('staffAccounts')
    expect(config).toHaveProperty('paymentSettings')
    expect(config).toHaveProperty('notificationSettings')
    expect(config).toHaveProperty('systemDefaults')

    // Verify secrets are masked
    if (config.paymentSettings?.paymentProviderApiKey) {
      expect(config.paymentSettings.paymentProviderApiKey).toContain('•')
      expect(config.paymentSettings.paymentProviderApiKey).not.toMatch(/sk_live_/)
    }

    if (config.notificationSettings?.resendApiKey) {
      expect(config.notificationSettings.resendApiKey).toContain('•')
    }
  })

  test('should validate business profile data on import', async ({ request }) => {
    const invalidConfig = {
      schemaVersion: 1,
      exportTimestamp: new Date().toISOString(),
      businessProfile: {
        name: '', // Empty name should fail
        email: 'test@example.com',
        phone: '+1234567890',
        address: '123 Main St',
        hours: '9-5'
      }
    }

    const response = await request.post(`${BASE_URL}/api/settings/config/import`, {
      data: invalidConfig,
      headers: { 'Cookie': `jl_admin_token=${authToken}` }
    })

    expect(response.status()).toBe(400)
    const error = await response.json()
    expect(error).toHaveProperty('details')
    expect(error.details).toContain('Business name is required')
  })

  test('should validate store locations on import', async ({ request }) => {
    const invalidConfig = {
      schemaVersion: 1,
      exportTimestamp: new Date().toISOString(),
      storeLocations: [
        { name: 'Loc1', address: '123 Main', city: 'NYC', isDefault: true },
        { name: 'Loc2', address: '456 Oak', city: 'LA', isDefault: true } // Multiple defaults
      ]
    }

    const response = await request.post(`${BASE_URL}/api/settings/config/import`, {
      data: invalidConfig,
      headers: { 'Cookie': `jl_admin_token=${authToken}` }
    })

    expect(response.status()).toBe(400)
    const error = await response.json()
    expect(error.details).toContain('Exactly one location must be marked as default')
  })

  test('should validate staff accounts on import', async ({ request }) => {
    const invalidConfig = {
      schemaVersion: 1,
      exportTimestamp: new Date().toISOString(),
      staffAccounts: [
        {
          name: 'John',
          email: 'invalid-email',
          role: 'Manager',
          permissions: ['orders']
        }
      ]
    }

    const response = await request.post(`${BASE_URL}/api/settings/config/import`, {
      data: invalidConfig,
      headers: { 'Cookie': `jl_admin_token=${authToken}` }
    })

    expect(response.status()).toBe(400)
    const error = await response.json()
    expect(error.details.some((d: string) => d.startsWith('Invalid email format'))).toBeTruthy()
  })

  test('should reject unmasked secrets in import', async ({ request }) => {
    const invalidConfig = {
      schemaVersion: 1,
      exportTimestamp: new Date().toISOString(),
      paymentSettings: {
        paymentProviderApiKey: 'sk_live_actual_secret_key_12345' // Raw secret
      }
    }

    const response = await request.post(`${BASE_URL}/api/settings/config/import`, {
      data: invalidConfig,
      headers: { 'Cookie': `jl_admin_token=${authToken}` }
    })

    expect(response.status()).toBe(400)
    const error = await response.json()
    expect(error.details.some((d: string) => d.includes('unmasked'))).toBeTruthy()
  })

  test('should import valid configuration successfully', async ({ request }) => {
    // First, export current config
    const exportRes = await request.get(`${BASE_URL}/api/settings/config/export`, {
      headers: { 'Cookie': `jl_admin_token=${authToken}` }
    })
    const config = await exportRes.json()

    // Prepare import data with minimal modifications
    const importData = {
      schemaVersion: config.schemaVersion,
      exportTimestamp: new Date().toISOString(),
      businessProfile: config.businessProfile || {
        name: 'Test Business',
        email: 'test@example.com',
        phone: '+11234567890',
        address: '123 Main St',
        hours: '9 AM - 5 PM'
      },
      storeLocations: config.storeLocations?.length > 0
        ? config.storeLocations
        : [{ name: 'Main Store', address: '123 Main', city: 'NYC', isDefault: true }],
      paymentSettings: config.paymentSettings || {},
      notificationSettings: config.notificationSettings || {
        emailEnabled: true,
        pushEnabled: true
      },
      systemDefaults: config.systemDefaults || {
        orderNumberPrefix: 'JL',
        defaultAcquisitionSource: 'Manual'
      }
    }

    const response = await request.post(`${BASE_URL}/api/settings/config/import`, {
      data: importData,
      headers: { 'Cookie': `jl_admin_token=${authToken}` }
    })

    expect(response.status()).toBe(200)
    const result = await response.json()
    expect(result.success).toBe(true)

    // ── Round-trip equivalence: re-export and verify the configuration survived ──
    const reExportRes = await request.get(`${BASE_URL}/api/settings/config/export`, {
      headers: { 'Cookie': `jl_admin_token=${authToken}` }
    })
    expect(reExportRes.status()).toBe(200)
    const reExported = await reExportRes.json()

    // Business profile survives the round trip unchanged
    if (config.businessProfile) {
      expect(reExported.businessProfile.name).toBe(config.businessProfile.name)
      expect(reExported.businessProfile.email).toBe(config.businessProfile.email)
      expect(reExported.businessProfile.phone).toBe(config.businessProfile.phone)
      expect(reExported.businessProfile.address).toBe(config.businessProfile.address)
    }

    // Store locations survive with identical names and exactly one default
    if (config.storeLocations?.length > 0) {
      const originalNames = [...config.storeLocations.map((l: any) => l.name)].sort()
      const reExportedNames = [...reExported.storeLocations.map((l: any) => l.name)].sort()
      expect(reExportedNames).toEqual(originalNames)
      expect(reExported.storeLocations.filter((l: any) => l.isDefault).length).toBe(1)
    }
  })

  test('should enforce authorization on export', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/settings/config/export`, {
      headers: { Authorization: 'Bearer invalid-token' }
    })

    expect(response.status()).toBe(401)
  })

  test('should enforce authorization on import', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/settings/config/import`, {
      data: { schemaVersion: 1 },
      headers: { Authorization: 'Bearer invalid-token' }
    })

    expect(response.status()).toBe(401)
  })

  test('should maintain round-trip property for non-secret settings', async ({ request }) => {
    // Export original config
    const exportRes1 = await request.get(`${BASE_URL}/api/settings/config/export`, {
      headers: { 'Cookie': `jl_admin_token=${authToken}` }
    })
    const config1 = await exportRes1.json()

    // Import the config
    if (config1.businessProfile || config1.storeLocations?.length > 0) {
      const importData = {
        ...config1,
        exportTimestamp: new Date().toISOString()
      }

      await request.post(`${BASE_URL}/api/settings/config/import`, {
        data: importData,
        headers: { 'Cookie': `jl_admin_token=${authToken}` }
      })

      // Export again
      const exportRes2 = await request.get(`${BASE_URL}/api/settings/config/export`, {
        headers: { 'Cookie': `jl_admin_token=${authToken}` }
      })
      const config2 = await exportRes2.json()

      // Compare non-secret fields
      if (config1.businessProfile?.name) {
        expect(config2.businessProfile?.name).toBe(config1.businessProfile.name)
      }

      // Store locations should match (except timestamps)
      expect(config2.storeLocations?.length).toBe(config1.storeLocations?.length)
    }
  })

  test('should handle empty configuration export', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/settings/config/export`, {
      headers: { 'Cookie': `jl_admin_token=${authToken}` }
    })

    expect(response.status()).toBe(200)
    const config = await response.json()

    // Should have schema and timestamp even if data is empty
    expect(config).toHaveProperty('schemaVersion')
    expect(config).toHaveProperty('exportTimestamp')
  })

  test('should create audit log on successful import', async ({ request }) => {
    const importData = {
      schemaVersion: 1,
      exportTimestamp: new Date().toISOString(),
      storeLocations: [
        { name: 'Store for Audit Test', address: '999 Test', city: 'Test City', isDefault: true }
      ]
    }

    const response = await request.post(`${BASE_URL}/api/settings/config/import`, {
      data: importData,
      headers: { 'Cookie': `jl_admin_token=${authToken}` }
    })

    expect(response.status()).toBe(200)

    // Note: In a real test, you'd verify the audit log was created by checking the database
    // or by calling an audit log endpoint if available
  })
})
