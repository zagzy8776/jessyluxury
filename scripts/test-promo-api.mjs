#!/usr/bin/env node
/**
 * Direct API test for promo popup configuration
 * Tests authentication, validation, and database persistence
 */

const BASE_URL = 'http://localhost:3000'

// Test account from global-setup
const OWNER_EMAIL = 'owner@jessy.test'
const OWNER_PASSWORD = 'ownerpass123456'

async function login() {
  console.log('🔐 Logging in as owner...')
  const res = await fetch(`${BASE_URL}/api/admin-auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: OWNER_EMAIL,
      password: OWNER_PASSWORD,
    }),
  })

  if (!res.ok) {
    throw new Error(`Login failed: ${res.status} ${await res.text()}`)
  }

  // Extract cookie
  const setCookie = res.headers.get('set-cookie')
  if (!setCookie) {
    throw new Error('No session cookie received')
  }

  const cookie = setCookie.split(';')[0]
  console.log(`✅ Logged in, cookie: ${cookie.substring(0, 30)}...`)
  return cookie
}

async function testGetConfig(cookie) {
  console.log('\n📥 GET /api/settings/promo-popup')
  const res = await fetch(`${BASE_URL}/api/settings/promo-popup`, {
    headers: { Cookie: cookie },
  })

  console.log(`   Status: ${res.status}`)
  const data = await res.json()
  console.log(`   Response:`, JSON.stringify(data, null, 2))
  return { status: res.status, data }
}

async function testPutConfig(cookie, config) {
  console.log('\n📤 PUT /api/settings/promo-popup')
  console.log('   Payload:', JSON.stringify(config, null, 2))

  const res = await fetch(`${BASE_URL}/api/settings/promo-popup`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookie,
    },
    body: JSON.stringify(config),
  })

  console.log(`   Status: ${res.status}`)
  const data = await res.json()
  console.log(`   Response:`, JSON.stringify(data, null, 2))
  return { status: res.status, data }
}

async function testUnauthenticatedPut(config) {
  console.log('\n🚫 PUT /api/settings/promo-popup (unauthenticated)')
  const res = await fetch(`${BASE_URL}/api/settings/promo-popup`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config),
  })

  console.log(`   Status: ${res.status}`)
  const data = await res.json()
  console.log(`   Response:`, JSON.stringify(data, null, 2))
  return { status: res.status, data }
}

async function main() {
  console.log('🧪 Promo Popup API Direct Test\n')
  console.log('=' .repeat(60))

  try {
    // 1. Login
    const cookie = await login()

    // 2. Test GET (public endpoint - should work without auth too)
    const getResult = await testGetConfig(cookie)
    if (getResult.status !== 200) {
      console.error('❌ GET failed')
      process.exit(1)
    }

    // 3. Test unauthenticated PUT (should fail)
    const unauthResult = await testUnauthenticatedPut({
      enabled: true,
      title: 'Test',
      message: 'Test',
      discountLabel: '10% OFF',
      couponCode: 'RTVERIFY10',
      ctaText: 'Shop',
      displayDelay: 4000,
      displayFreqHrs: 24,
    })

    if (unauthResult.status === 200) {
      console.error('❌ Unauthenticated PUT should have failed but succeeded!')
      process.exit(1)
    }
    console.log('✅ Unauthenticated PUT correctly rejected')

    // 4. Test invalid coupon (should fail with 400)
    console.log('\n' + '='.repeat(60))
    console.log('Testing invalid coupon validation...')
    const invalidResult = await testPutConfig(cookie, {
      enabled: true,
      title: 'Test Reward',
      message: 'API test message',
      discountLabel: '10% OFF',
      couponCode: 'INVALIDCODE999',
      ctaText: 'Shop Now',
      displayDelay: 4000,
      minPurchase: null,
      expiryDate: null,
      displayFreqHrs: 24,
    })

    if (invalidResult.status !== 400) {
      console.error(`❌ Invalid coupon should return 400, got ${invalidResult.status}`)
      process.exit(1)
    }

    if (!invalidResult.data.error || !invalidResult.data.error.includes('does not exist')) {
      console.error('❌ Invalid coupon error message incorrect')
      process.exit(1)
    }
    console.log('✅ Invalid coupon correctly rejected')

    // 5. Test valid configuration (should succeed)
    console.log('\n' + '='.repeat(60))
    console.log('Testing valid configuration save...')
    const validResult = await testPutConfig(cookie, {
      enabled: true,
      title: 'API Test Reward ✨',
      message: 'This configuration was saved via direct API test.',
      discountLabel: '10% OFF',
      couponCode: 'RTVERIFY10',
      ctaText: 'Verify API Save',
      displayDelay: 1000,
      minPurchase: 20000,
      expiryDate: null,
      displayFreqHrs: 1,
    })

    if (validResult.status !== 200) {
      console.error(`❌ Valid config save failed with status ${validResult.status}`)
      console.error('   Error:', validResult.data)
      process.exit(1)
    }
    console.log('✅ Valid configuration saved successfully')

    // 6. Read back and verify
    console.log('\n' + '='.repeat(60))
    console.log('Verifying read-after-write...')
    const verifyResult = await testGetConfig(cookie)

    if (verifyResult.data.enabled !== true) {
      console.error('❌ enabled not persisted correctly')
      process.exit(1)
    }

    if (verifyResult.data.couponCode !== 'RTVERIFY10') {
      console.error(`❌ couponCode not persisted correctly: ${verifyResult.data.couponCode}`)
      process.exit(1)
    }

    if (verifyResult.data.title !== 'API Test Reward ✨') {
      console.error(`❌ title not persisted correctly: ${verifyResult.data.title}`)
      process.exit(1)
    }

    if (verifyResult.data.displayDelay !== 1000) {
      console.error(`❌ displayDelay not persisted correctly: ${verifyResult.data.displayDelay}`)
      process.exit(1)
    }

    if (verifyResult.data.minPurchase !== 20000) {
      console.error(`❌ minPurchase not persisted correctly: ${verifyResult.data.minPurchase}`)
      process.exit(1)
    }

    if (verifyResult.data.displayFreqHrs !== 1) {
      console.error(`❌ displayFreqHrs not persisted correctly: ${verifyResult.data.displayFreqHrs}`)
      process.exit(1)
    }

    console.log('✅ All fields persisted correctly')

    // 7. Test public GET (no auth)
    console.log('\n' + '='.repeat(60))
    console.log('Testing public GET (no authentication)...')
    const publicResult = await fetch(`${BASE_URL}/api/settings/promo-popup`)
    console.log(`   Status: ${publicResult.status}`)
    const publicData = await publicResult.json()

    if (publicResult.status !== 200) {
      console.error('❌ Public GET should work without auth')
      process.exit(1)
    }

    if (publicData.enabled !== true) {
      console.error('❌ Public GET should return enabled=true')
      process.exit(1)
    }

    console.log('✅ Public GET works without authentication')

    console.log('\n' + '='.repeat(60))
    console.log('🎉 ALL API TESTS PASSED')
    console.log('=' .repeat(60))
    console.log('\n✅ API VERDICT: Backend is working correctly')
    console.log('   - Authentication works')
    console.log('   - Validation works')
    console.log('   - Database persistence works')
    console.log('   - Read-after-write works')
    console.log('   - Public endpoint accessible')
    console.log('\n⚠️  Issue must be in frontend UI or component logic')

  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message)
    console.error(error.stack)
    process.exit(1)
  }
}

main()
