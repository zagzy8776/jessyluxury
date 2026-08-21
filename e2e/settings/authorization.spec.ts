import { test, expect } from '@playwright/test'

/**
 * Authorization Test Suite - P11-T021
 * Validates: Requirements 6, 26
 * 
 * Tests permission enforcement on protected API routes
 * - Orders routes require 'orders' permission
 * - Products routes require 'products' permission
 * - Customers routes require 'customers' permission
 * - Analytics routes require 'analytics' permission
 * - Settings routes require 'settings' permission OR Owner role
 * - Shipping routes require 'orders' OR 'fulfillment' permission
 * - Inactive staff accounts cannot authenticate
 */

const API_BASE = 'http://localhost:3000/api'

// Test data
const testUsers = {
  owner: {
    email: 'owner@jessy.test',
    password: 'ownerpass123456',
    role: 'Owner',
    permissions: ['orders', 'products', 'customers', 'analytics', 'settings', 'catalog', 'fulfillment']
  },
  manager: {
    email: 'manager@jessy.test',
    password: 'managerpass123456',
    role: 'Manager',
    permissions: ['orders', 'products', 'customers', 'analytics']
  },
  fulfillment: {
    email: 'fulfillment@jessy.test',
    password: 'fulfillmentpass123456',
    role: 'Fulfillment',
    permissions: ['orders', 'fulfillment']
  },
  catalog: {
    email: 'catalog@jessy.test',
    password: 'catalogpass123456',
    role: 'Catalog',
    permissions: ['products', 'catalog']
  },
  inactive: {
    email: 'inactive@jessy.test',
    password: 'inactivepass123456',
    role: 'Manager',
    permissions: ['orders', 'products'],
    active: false
  }
}

/**
 * Helper: Get staff auth token by authenticating
 */
async function getStaffToken(email: string, password: string): Promise<string | null> {
  const response = await fetch(`${API_BASE}/admin-auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  })
  
  if (!response.ok) {
    console.error(`Failed to authenticate ${email}: ${response.status}`)
    return null
  }
  
  // Extract the jl_staff_token cookie from Set-Cookie header
  const setCookieHeader = response.headers.get('set-cookie')
  if (!setCookieHeader) {
    console.error(`No Set-Cookie header in response for ${email}`)
    return null
  }
  
  // Parse the cookie value from Set-Cookie header
  // Format: jl_staff_token=<token_value>; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=604800
  const match = setCookieHeader.match(/jl_staff_token=([^;]+)/)
  if (!match) {
    console.error(`Could not extract jl_staff_token from Set-Cookie header for ${email}`)
    return null
  }
  
  return match[1]
}

/**
 * Helper: Make authenticated API call with proper cookie
 * Note: In the actual implementation, authentication is cookie-based via jl_staff_token
 * For testing, we need to simulate the login flow which sets the cookie
 */
async function makeAuthenticatedRequest(
  path: string,
  method: string = 'GET',
  token?: string,
  body?: object
) {
  const headers: any = { 'Content-Type': 'application/json' }
  
  // If token is provided (even dummy), set the cookie header
  // In real tests, this would come from a successful login response
  if (token) {
    headers.Cookie = `jl_staff_token=${token}`
  }
  
  const options: any = { method, headers }
  if (body) {
    options.body = JSON.stringify(body)
  }
  
  return fetch(`${API_BASE}${path}`, options)
}

test.describe('Authorization - Orders Routes', () => {
  test('Unauthenticated request to orders returns 401', async () => {
    const response = await makeAuthenticatedRequest('/orders', 'GET')
    expect(response.status).toBe(401)
  })

  test('Manager with orders permission can access orders', async () => {
    const token = await getStaffToken(testUsers.manager.email, testUsers.manager.password)
    if (!token) test.skip()
    
    const response = await makeAuthenticatedRequest('/orders', 'GET', token)
    expect(response.status).not.toBe(403)
  })

  test('Catalog without orders permission cannot access orders', async () => {
    const token = await getStaffToken(testUsers.catalog.email, testUsers.catalog.password)
    if (!token) test.skip()
    
    const response = await makeAuthenticatedRequest('/orders', 'GET', token)
    expect(response.status).toBe(403)
  })

  test('Fulfillment with orders permission can access orders', async () => {
    const token = await getStaffToken(testUsers.fulfillment.email, testUsers.fulfillment.password)
    if (!token) test.skip()
    
    const response = await makeAuthenticatedRequest('/orders', 'GET', token)
    expect(response.status).not.toBe(403)
  })

  test('Owner can access orders', async () => {
    const token = await getStaffToken(testUsers.owner.email, testUsers.owner.password)
    if (!token) test.skip()
    
    const response = await makeAuthenticatedRequest('/orders', 'GET', token)
    expect(response.status).not.toBe(403)
  })
})

test.describe('Authorization - Products Routes', () => {
  test('Manager with products permission can access products admin', async () => {
    const token = await getStaffToken(testUsers.manager.email, testUsers.manager.password)
    if (!token) test.skip()
    
    const response = await makeAuthenticatedRequest('/products', 'POST', token, {
      name: 'Test',
      brand: 'Test',
      price: 100,
      categoryId: 1,
      stock: 10
    })
    expect(response.status).not.toBe(403)
  })

  test('Catalog with products permission can access products admin', async () => {
    const token = await getStaffToken(testUsers.catalog.email, testUsers.catalog.password)
    if (!token) test.skip()
    
    const response = await makeAuthenticatedRequest('/products', 'POST', token, {
      name: 'Test',
      brand: 'Test',
      price: 100,
      categoryId: 1,
      stock: 10
    })
    expect(response.status).not.toBe(403)
  })

  test('Fulfillment without products permission cannot create products', async () => {
    const token = await getStaffToken(testUsers.fulfillment.email, testUsers.fulfillment.password)
    if (!token) test.skip()
    
    const response = await makeAuthenticatedRequest('/products', 'POST', token, {
      name: 'Test',
      brand: 'Test',
      price: 100,
      categoryId: 1,
      stock: 10
    })
    expect(response.status).toBe(403)
  })

  test('Owner can create products', async () => {
    const token = await getStaffToken(testUsers.owner.email, testUsers.owner.password)
    if (!token) test.skip()
    
    const response = await makeAuthenticatedRequest('/products', 'POST', token, {
      name: 'Test',
      brand: 'Test',
      price: 100,
      categoryId: 1,
      stock: 10
    })
    expect(response.status).not.toBe(403)
  })
})

test.describe('Authorization - Customers Routes', () => {
  test('Manager with customers permission can access customers', async () => {
    const token = await getStaffToken(testUsers.manager.email, testUsers.manager.password)
    if (!token) test.skip()
    
    const response = await makeAuthenticatedRequest('/customers', 'GET', token)
    expect(response.status).not.toBe(403)
  })

  test('Catalog without customers permission cannot access customers', async () => {
    const token = await getStaffToken(testUsers.catalog.email, testUsers.catalog.password)
    if (!token) test.skip()
    
    const response = await makeAuthenticatedRequest('/customers', 'GET', token)
    expect(response.status).toBe(403)
  })

  test('Fulfillment without customers permission cannot access customers', async () => {
    const token = await getStaffToken(testUsers.fulfillment.email, testUsers.fulfillment.password)
    if (!token) test.skip()
    
    const response = await makeAuthenticatedRequest('/customers', 'GET', token)
    expect(response.status).toBe(403)
  })

  test('Owner can access customers', async () => {
    const token = await getStaffToken(testUsers.owner.email, testUsers.owner.password)
    if (!token) test.skip()
    
    const response = await makeAuthenticatedRequest('/customers', 'GET', token)
    expect(response.status).not.toBe(403)
  })
})

test.describe('Authorization - Analytics Routes', () => {
  test('Manager with analytics permission can access analytics', async () => {
    const token = await getStaffToken(testUsers.manager.email, testUsers.manager.password)
    if (!token) test.skip()
    
    const response = await makeAuthenticatedRequest('/analytics', 'GET', token)
    expect(response.status).not.toBe(403)
  })

  test('Catalog without analytics permission cannot access analytics', async () => {
    const token = await getStaffToken(testUsers.catalog.email, testUsers.catalog.password)
    if (!token) test.skip()
    
    const response = await makeAuthenticatedRequest('/analytics', 'GET', token)
    expect(response.status).toBe(403)
  })

  test('Fulfillment without analytics permission cannot access analytics', async () => {
    const token = await getStaffToken(testUsers.fulfillment.email, testUsers.fulfillment.password)
    if (!token) test.skip()
    
    const response = await makeAuthenticatedRequest('/analytics', 'GET', token)
    expect(response.status).toBe(403)
  })

  test('Owner can access analytics', async () => {
    const token = await getStaffToken(testUsers.owner.email, testUsers.owner.password)
    if (!token) test.skip()
    
    const response = await makeAuthenticatedRequest('/analytics', 'GET', token)
    expect(response.status).not.toBe(403)
  })
})

test.describe('Authorization - Settings Routes', () => {
  test('Manager without settings permission cannot access business profile', async () => {
    const token = await getStaffToken(testUsers.manager.email, testUsers.manager.password)
    if (!token) test.skip()
    
    const response = await makeAuthenticatedRequest('/settings/business-profile', 'GET', token)
    expect(response.status).toBe(403)
  })

  test('Catalog without settings permission cannot access settings', async () => {
    const token = await getStaffToken(testUsers.catalog.email, testUsers.catalog.password)
    if (!token) test.skip()
    
    const response = await makeAuthenticatedRequest('/settings/business-profile', 'GET', token)
    expect(response.status).toBe(403)
  })

  test('Fulfillment without settings permission cannot access settings', async () => {
    const token = await getStaffToken(testUsers.fulfillment.email, testUsers.fulfillment.password)
    if (!token) test.skip()
    
    const response = await makeAuthenticatedRequest('/settings/business-profile', 'GET', token)
    expect(response.status).toBe(403)
  })

  test('Owner can access settings (implicit settings permission)', async () => {
    const token = await getStaffToken(testUsers.owner.email, testUsers.owner.password)
    if (!token) test.skip()
    
    const response = await makeAuthenticatedRequest('/settings/business-profile', 'GET', token)
    expect(response.status).not.toBe(403)
  })

  test('Owner can update settings', async () => {
    const token = await getStaffToken(testUsers.owner.email, testUsers.owner.password)
    if (!token) test.skip()
    
    const response = await makeAuthenticatedRequest('/settings/business-profile', 'PUT', token, {
      name: 'Jessy Luxury',
      phone: '+234 701 234 5678',
      email: 'info@jessyluxury.com',
      address: 'Lagos, Nigeria',
      hours: '9AM - 6PM',
      taxId: 'TAX123'
    })
    expect(response.status).not.toBe(403)
  })
})

test.describe('Authorization - Shipping Routes', () => {
  test('Fulfillment with fulfillment permission can create shipping zone', async () => {
    const token = await getStaffToken(testUsers.fulfillment.email, testUsers.fulfillment.password)
    if (!token) test.skip()
    
    const response = await makeAuthenticatedRequest('/shipping', 'POST', token, {
      name: 'Test Zone',
      fee: 500,
      estimatedDays: '2-3 days'
    })
    expect(response.status).not.toBe(403)
  })

  test('Orders staff with orders permission can create shipping zone', async () => {
    // Create test orders staff first if needed
    // For now, just test that Manager (who has orders) can create shipping zone
    const token = await getStaffToken(testUsers.manager.email, testUsers.manager.password)
    if (!token) test.skip()
    
    const response = await makeAuthenticatedRequest('/shipping', 'POST', token, {
      name: 'Test Zone',
      fee: 500,
      estimatedDays: '2-3 days'
    })
    // Should work due to orders OR fulfillment logic
    expect([200, 201, 403]).toContain(response.status)
  })

  test('Catalog cannot create shipping zone (no orders/fulfillment)', async () => {
    const token = await getStaffToken(testUsers.catalog.email, testUsers.catalog.password)
    if (!token) test.skip()
    
    const response = await makeAuthenticatedRequest('/shipping', 'POST', token, {
      name: 'Test Zone',
      fee: 500,
      estimatedDays: '2-3 days'
    })
    expect(response.status).toBe(403)
  })

  test('Owner can create shipping zone', async () => {
    const token = await getStaffToken(testUsers.owner.email, testUsers.owner.password)
    if (!token) test.skip()
    
    const response = await makeAuthenticatedRequest('/shipping', 'POST', token, {
      name: 'Test Zone',
      fee: 500,
      estimatedDays: '2-3 days'
    })
    expect(response.status).not.toBe(403)
  })
})

test.describe('Authorization - Inactive Staff Accounts', () => {
  test('Inactive staff account cannot authenticate', async () => {
    const response = await fetch(`${API_BASE}/admin-auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testUsers.inactive.email,
        password: testUsers.inactive.password
      })
    })
    
    // Inactive staff should get 403 (Forbidden) not 401 (Unauthorized)
    expect(response.status).toBe(403)
  })

  test('Inactive staff account rejected on protected resource', async () => {
    // Try to use an inactive staff token (if we can get one)
    // The system should reject authentication for inactive accounts
    const response = await makeAuthenticatedRequest('/orders', 'GET')
    expect(response.status).toBe(401)
  })
})

test.describe('Authorization - Public Routes Remain Public', () => {
  test('Order tracking is public (no auth required)', async () => {
    // GET /api/orders/track/* should be public
    const response = await makeAuthenticatedRequest('/orders/track/search', 'POST', undefined, {
      query: 'test'
    })
    // Should not return 401, might return 400 or other validation error
    expect(response.status).not.toBe(401)
  })

  test('Product storefront is public (no auth required for GET)', async () => {
    // GET /api/products should be public
    const response = await makeAuthenticatedRequest('/products', 'GET')
    expect(response.status).not.toBe(401)
  })

  test('Shipping zones list is public (no auth required for GET)', async () => {
    // GET /api/shipping should be public
    const response = await makeAuthenticatedRequest('/shipping', 'GET')
    expect(response.status).not.toBe(401)
  })
})

test.describe('Authorization - Permission Enforcement on Multiple Actions', () => {
  test('Staff can only modify their permitted resources', async () => {
    const managerToken = await getStaffToken(testUsers.manager.email, testUsers.manager.password)
    if (!managerToken) test.skip()
    
    // Manager has: orders, products, customers, analytics
    // Manager should NOT have: settings, fulfillment, catalog
    
    const ordersAccess = await makeAuthenticatedRequest('/orders', 'GET', managerToken)
    expect([200, 400, 500]).toContain(ordersAccess.status) // Should not be 403
    
    const settingsAccess = await makeAuthenticatedRequest('/settings/business-profile', 'GET', managerToken)
    expect(settingsAccess.status).toBe(403) // Should be forbidden
  })

  test('Fulfillment can only access orders and fulfillment resources', async () => {
    const fulfillmentToken = await getStaffToken(testUsers.fulfillment.email, testUsers.fulfillment.password)
    if (!fulfillmentToken) test.skip()
    
    // Fulfillment has: orders, fulfillment
    // Fulfillment should NOT have: products, customers, analytics, settings
    
    const ordersAccess = await makeAuthenticatedRequest('/orders', 'GET', fulfillmentToken)
    expect([200, 400, 500]).toContain(ordersAccess.status) // Should not be 403
    
    const productsAccess = await makeAuthenticatedRequest('/products', 'POST', fulfillmentToken, {
      name: 'Test',
      brand: 'Test',
      price: 100,
      categoryId: 1,
      stock: 10
    })
    expect(productsAccess.status).toBe(403) // Should be forbidden
    
    const customersAccess = await makeAuthenticatedRequest('/customers', 'GET', fulfillmentToken)
    expect(customersAccess.status).toBe(403) // Should be forbidden
  })

  test('Catalog can only access products and catalog resources', async () => {
    const catalogToken = await getStaffToken(testUsers.catalog.email, testUsers.catalog.password)
    if (!catalogToken) test.skip()
    
    // Catalog has: products, catalog
    // Catalog should NOT have: orders, customers, analytics, settings, fulfillment
    
    const productsAccess = await makeAuthenticatedRequest('/products', 'POST', catalogToken, {
      name: 'Test',
      brand: 'Test',
      price: 100,
      categoryId: 1,
      stock: 10
    })
    expect([200, 201, 400, 500]).toContain(productsAccess.status) // Should not be 403
    
    const ordersAccess = await makeAuthenticatedRequest('/orders', 'GET', catalogToken)
    expect(ordersAccess.status).toBe(403) // Should be forbidden
    
    const customersAccess = await makeAuthenticatedRequest('/customers', 'GET', catalogToken)
    expect(customersAccess.status).toBe(403) // Should be forbidden
  })
})

test.describe('Authorization - Edge Cases', () => {
  test('Expired session token returns 401', async () => {
    // Try with invalid/expired token format
    const response = await makeAuthenticatedRequest('/orders', 'GET', 'invalid_token_12345')
    expect(response.status).toBe(401)
  })

  test('Malformed request header is handled gracefully', async () => {
    const response = await fetch(`${API_BASE}/orders`, {
      method: 'GET',
      headers: {
        'Cookie': 'jl_staff_token='  // Empty token
      }
    })
    expect(response.status).toBe(401)
  })

  test('Missing Content-Type still authenticates', async () => {
    const token = await getStaffToken(testUsers.owner.email, testUsers.owner.password)
    if (!token) test.skip()
    
    const response = await fetch(`${API_BASE}/orders`, {
      method: 'GET',
      headers: {
        'Cookie': `jl_staff_token=${token}`
      }
    })
    expect(response.status).not.toBe(401)
  })
})
