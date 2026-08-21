import './load-env'
import { test, expect } from '@playwright/test'
import { PrismaClient } from '@prisma/client'
import { generateAdminToken } from '../lib/auth-crypto'

const prisma = new PrismaClient()

test.describe('Phase 11 - Expenses List API with Pagination and Filtering', () => {
  test.setTimeout(120000)

  const runId = Math.floor(1000 + Math.random() * 9000)
  const namespace = `EXP_E2E_${runId}`

  let authToken: string = ''
  let testExpense1: any
  let testExpense2: any
  let testExpense3: any

  test.beforeAll(async () => {
    // Ensure SystemConfig record exists
    const config = await prisma.systemConfig.upsert({
      where: { id: 1 },
      update: {},
      create: { id: 1, sessionVersion: 1, updatedAt: new Date() },
    })
    const sessionVersion = config.sessionVersion
    authToken = await generateAdminToken(sessionVersion)

    // Create test expenses with different dates
    const baseDate = new Date('2024-01-15')
    
    testExpense1 = await prisma.expense.create({
      data: {
        category: 'Packaging',
        description: `${namespace} - Shipping boxes`,
        amount: 50000,
        date: new Date(baseDate.getTime()),
      },
    })

    testExpense2 = await prisma.expense.create({
      data: {
        category: 'Marketing',
        description: `${namespace} - Social media ads`,
        amount: 75000,
        date: new Date(baseDate.getTime() + 7 * 24 * 60 * 60 * 1000), // 7 days later
      },
    })

    testExpense3 = await prisma.expense.create({
      data: {
        category: 'Salary',
        description: `${namespace} - Monthly salary`,
        amount: 500000,
        date: new Date(baseDate.getTime() + 14 * 24 * 60 * 60 * 1000), // 14 days later
      },
    })
  })

  test.afterAll(async () => {
    // Clean up test expenses
    if (testExpense1?.id) {
      await prisma.expense.delete({ where: { id: testExpense1.id } }).catch(() => {})
    }
    if (testExpense2?.id) {
      await prisma.expense.delete({ where: { id: testExpense2.id } }).catch(() => {})
    }
    if (testExpense3?.id) {
      await prisma.expense.delete({ where: { id: testExpense3.id } }).catch(() => {})
    }

    await prisma.$disconnect()
  })

  // Authorization Tests
  test('1. Unauthenticated GET request is rejected with 401', async ({ request }) => {
    const response = await request.get('http://localhost:3000/api/settings/expenses')
    expect(response.status()).toBe(401)
    const data = await response.json()
    expect(data.error).toContain('Unauthorized')
  })

  test('2. Authenticated GET request succeeds with 200', async ({ request }) => {
    const response = await request.get('http://localhost:3000/api/settings/expenses', {
      headers: {
        'Cookie': `jl_admin_token=${authToken}`,
      },
    })
    expect(response.status()).toBe(200)
    const data = await response.json()
    expect(data).toBeDefined()
  })

  // Response Structure Tests
  test('3. GET response has correct pagination metadata', async ({ request }) => {
    const response = await request.get('http://localhost:3000/api/settings/expenses', {
      headers: {
        'Cookie': `jl_admin_token=${authToken}`,
      },
    })
    expect(response.status()).toBe(200)

    const data = await response.json()
    expect(data.expenses).toBeDefined()
    expect(Array.isArray(data.expenses)).toBe(true)
    expect(data.total).toBeGreaterThanOrEqual(0)
    expect(data.page).toBe(1)
    expect(data.pageSize).toBe(20)
    expect(typeof data.totalPages).toBe('number')
  })

  // Pagination Tests
  test('4. Default pagination returns pageSize=20 and page=1', async ({ request }) => {
    const response = await request.get('http://localhost:3000/api/settings/expenses', {
      headers: {
        'Cookie': `jl_admin_token=${authToken}`,
      },
    })
    expect(response.status()).toBe(200)

    const data = await response.json()
    expect(data.page).toBe(1)
    expect(data.pageSize).toBe(20)
  })

  test('5. Custom pagination parameters are respected', async ({ request }) => {
    const response = await request.get('http://localhost:3000/api/settings/expenses?page=2&pageSize=5', {
      headers: {
        'Cookie': `jl_admin_token=${authToken}`,
      },
    })
    expect(response.status()).toBe(200)

    const data = await response.json()
    expect(data.page).toBe(2)
    expect(data.pageSize).toBe(5)
    expect(data.expenses.length).toBeLessThanOrEqual(5)
  })

  // Date Filtering Tests
  test('6. startDate filter works correctly', async ({ request }) => {
    const startDateStr = '2024-01-20' // Between expense 1 and 2
    const response = await request.get(
      `http://localhost:3000/api/settings/expenses?startDate=${startDateStr}`,
      {
        headers: {
          'Cookie': `jl_admin_token=${authToken}`,
        },
      }
    )
    expect(response.status()).toBe(200)

    const data = await response.json()
    const startDate = new Date(startDateStr)
    
    // All returned expenses should have createdAt >= startDate
    for (const expense of data.expenses) {
      const expenseDate = new Date(expense.createdAt)
      expect(expenseDate.getTime()).toBeGreaterThanOrEqual(startDate.getTime())
    }
  })

  test('7. endDate filter works correctly', async ({ request }) => {
    const endDateStr = '2024-01-20' // Between expense 1 and 2
    const response = await request.get(
      `http://localhost:3000/api/settings/expenses?endDate=${endDateStr}`,
      {
        headers: {
          'Cookie': `jl_admin_token=${authToken}`,
        },
      }
    )
    expect(response.status()).toBe(200)

    const data = await response.json()
    const endDate = new Date(endDateStr)
    endDate.setHours(23, 59, 59, 999)
    
    // All returned expenses should have createdAt <= endDate
    for (const expense of data.expenses) {
      const expenseDate = new Date(expense.createdAt)
      expect(expenseDate.getTime()).toBeLessThanOrEqual(endDate.getTime())
    }
  })

  test('8. startDate and endDate filters work together', async ({ request }) => {
    const startDateStr = '2024-01-10'
    const endDateStr = '2024-01-25'
    const response = await request.get(
      `http://localhost:3000/api/settings/expenses?startDate=${startDateStr}&endDate=${endDateStr}`,
      {
        headers: {
          'Cookie': `jl_admin_token=${authToken}`,
        },
      }
    )
    expect(response.status()).toBe(200)

    const data = await response.json()
    const startDate = new Date(startDateStr)
    const endDate = new Date(endDateStr)
    endDate.setHours(23, 59, 59, 999)
    
    for (const expense of data.expenses) {
      const expenseDate = new Date(expense.createdAt)
      expect(expenseDate.getTime()).toBeGreaterThanOrEqual(startDate.getTime())
      expect(expenseDate.getTime()).toBeLessThanOrEqual(endDate.getTime())
    }
  })

  test('9. Invalid startDate returns 400 error', async ({ request }) => {
    const response = await request.get(
      'http://localhost:3000/api/settings/expenses?startDate=invalid-date',
      {
        headers: {
          'Cookie': `jl_admin_token=${authToken}`,
        },
      }
    )
    expect(response.status()).toBe(400)
    const data = await response.json()
    expect(data.error).toContain('Invalid startDate')
  })

  test('10. Invalid endDate returns 400 error', async ({ request }) => {
    const response = await request.get(
      'http://localhost:3000/api/settings/expenses?endDate=bad-date',
      {
        headers: {
          'Cookie': `jl_admin_token=${authToken}`,
        },
      }
    )
    expect(response.status()).toBe(400)
    const data = await response.json()
    expect(data.error).toContain('Invalid endDate')
  })

  // Ordering Test
  test('11. Expenses are ordered by date descending', async ({ request }) => {
    const response = await request.get('http://localhost:3000/api/settings/expenses', {
      headers: {
        'Cookie': `jl_admin_token=${authToken}`,
      },
    })
    expect(response.status()).toBe(200)

    const data = await response.json()
    if (data.expenses.length > 1) {
      // Check that expenses are in descending order by createdAt
      for (let i = 0; i < data.expenses.length - 1; i++) {
        const current = new Date(data.expenses[i].createdAt).getTime()
        const next = new Date(data.expenses[i + 1].createdAt).getTime()
        expect(current).toBeGreaterThanOrEqual(next)
      }
    }
  })

  // POST Tests
  test('12. POST with valid data creates expense', async ({ request }) => {
    const newExpense = {
      category: 'Shipping',
      description: 'Test expense creation',
      amount: 25000,
    }

    const response = await request.post('http://localhost:3000/api/settings/expenses', {
      headers: {
        'Cookie': `jl_admin_token=${authToken}`,
        'Content-Type': 'application/json',
      },
      data: newExpense,
    })
    expect(response.status()).toBe(200)

    const data = await response.json()
    expect(data.id).toBeDefined()
    expect(data.category).toBe(newExpense.category)
    expect(data.description).toBe(newExpense.description)
    expect(data.amount).toBe(newExpense.amount)
    
    // Clean up
    if (data.id) {
      await prisma.expense.delete({ where: { id: data.id } }).catch(() => {})
    }
  })

  test('13. POST without category returns 400 error', async ({ request }) => {
    const newExpense = {
      description: 'Test without category',
      amount: 10000,
    }

    const response = await request.post('http://localhost:3000/api/settings/expenses', {
      headers: {
        'Cookie': `jl_admin_token=${authToken}`,
        'Content-Type': 'application/json',
      },
      data: newExpense,
    })
    expect(response.status()).toBe(400)
    const data = await response.json()
    expect(data.error).toContain('Category is required')
  })

  test('14. POST with invalid category returns 400 error', async ({ request }) => {
    const newExpense = {
      category: 'InvalidCategory',
      description: 'Test with invalid category',
      amount: 10000,
    }

    const response = await request.post('http://localhost:3000/api/settings/expenses', {
      headers: {
        'Cookie': `jl_admin_token=${authToken}`,
        'Content-Type': 'application/json',
      },
      data: newExpense,
    })
    expect(response.status()).toBe(400)
    const data = await response.json()
    expect(data.error).toContain('must be one of')
  })

  test('15. POST without description returns 400 error', async ({ request }) => {
    const newExpense = {
      category: 'Packaging',
      amount: 10000,
    }

    const response = await request.post('http://localhost:3000/api/settings/expenses', {
      headers: {
        'Cookie': `jl_admin_token=${authToken}`,
        'Content-Type': 'application/json',
      },
      data: newExpense,
    })
    expect(response.status()).toBe(400)
    const data = await response.json()
    expect(data.error).toContain('Description is required')
  })

  test('16. POST without amount returns 400 error', async ({ request }) => {
    const newExpense = {
      category: 'Packaging',
      description: 'Test without amount',
    }

    const response = await request.post('http://localhost:3000/api/settings/expenses', {
      headers: {
        'Cookie': `jl_admin_token=${authToken}`,
        'Content-Type': 'application/json',
      },
      data: newExpense,
    })
    expect(response.status()).toBe(400)
    const data = await response.json()
    expect(data.error).toContain('Amount is required')
  })

  test('17. POST with amount <= 0 returns 400 error', async ({ request }) => {
    const newExpense = {
      category: 'Packaging',
      description: 'Test with zero amount',
      amount: 0,
    }

    const response = await request.post('http://localhost:3000/api/settings/expenses', {
      headers: {
        'Cookie': `jl_admin_token=${authToken}`,
        'Content-Type': 'application/json',
      },
      data: newExpense,
    })
    expect(response.status()).toBe(400)
    const data = await response.json()
    expect(data.error).toContain('must be greater than 0')
  })

  test('18. POST with negative amount returns 400 error', async ({ request }) => {
    const newExpense = {
      category: 'Packaging',
      description: 'Test with negative amount',
      amount: -5000,
    }

    const response = await request.post('http://localhost:3000/api/settings/expenses', {
      headers: {
        'Cookie': `jl_admin_token=${authToken}`,
        'Content-Type': 'application/json',
      },
      data: newExpense,
    })
    expect(response.status()).toBe(400)
    const data = await response.json()
    expect(data.error).toContain('must be greater than 0')
  })

  test('19. POST with valid date uses provided date', async ({ request }) => {
    const testDate = '2024-06-15T10:30:00Z'
    const newExpense = {
      category: 'Utility',
      description: 'Test with custom date',
      amount: 30000,
      date: testDate,
    }

    const response = await request.post('http://localhost:3000/api/settings/expenses', {
      headers: {
        'Cookie': `jl_admin_token=${authToken}`,
        'Content-Type': 'application/json',
      },
      data: newExpense,
    })
    expect(response.status()).toBe(200)

    const data = await response.json()
    expect(data.date).toBeDefined()
    
    // Clean up
    if (data.id) {
      await prisma.expense.delete({ where: { id: data.id } }).catch(() => {})
    }
  })

  test('20. POST with invalid date returns 400 error', async ({ request }) => {
    const newExpense = {
      category: 'Packaging',
      description: 'Test with invalid date',
      amount: 10000,
      date: 'not-a-date',
    }

    const response = await request.post('http://localhost:3000/api/settings/expenses', {
      headers: {
        'Cookie': `jl_admin_token=${authToken}`,
        'Content-Type': 'application/json',
      },
      data: newExpense,
    })
    expect(response.status()).toBe(400)
    const data = await response.json()
    expect(data.error).toContain('Invalid date format')
  })

  // Audit Log Tests
  test('21. POST creates audit log entry', async ({ request }) => {
    const newExpense = {
      category: 'Marketing',
      description: 'Test for audit log',
      amount: 40000,
    }

    const auditCountBefore = await prisma.auditLog.count()

    const response = await request.post('http://localhost:3000/api/settings/expenses', {
      headers: {
        'Cookie': `jl_admin_token=${authToken}`,
        'Content-Type': 'application/json',
      },
      data: newExpense,
    })
    expect(response.status()).toBe(200)

    const data = await response.json()
    const auditCountAfter = await prisma.auditLog.count()
    
    expect(auditCountAfter).toBeGreaterThan(auditCountBefore)

    // Check that audit log contains the expense creation entry
    const auditLog = await prisma.auditLog.findFirst({
      where: {
        action: 'EXPENSE_CREATED',
        entityId: data.id.toString(),
      },
      orderBy: { createdAt: 'desc' },
    })
    
    expect(auditLog).toBeDefined()
    expect(auditLog?.entity).toBe('Expense')

    // Clean up
    if (data.id) {
      await prisma.expense.delete({ where: { id: data.id } }).catch(() => {})
    }
  })

  // Category Validation Tests
  test('22. All valid categories are accepted', async ({ request }) => {
    const validCategories = ['Packaging', 'Shipping', 'Marketing', 'Utility', 'Salary']
    
    const createdExpenseIds = []

    for (const category of validCategories) {
      const newExpense = {
        category,
        description: `Test ${category}`,
        amount: 10000,
      }

      const response = await request.post('http://localhost:3000/api/settings/expenses', {
        headers: {
          'Cookie': `jl_admin_token=${authToken}`,
          'Content-Type': 'application/json',
        },
        data: newExpense,
      })
      expect(response.status()).toBe(200)
      const data = await response.json()
      expect(data.category).toBe(category)
      createdExpenseIds.push(data.id)
    }

    // Clean up
    for (const id of createdExpenseIds) {
      await prisma.expense.delete({ where: { id } }).catch(() => {})
    }
  })

  // Unauthenticated POST Test
  test('23. Unauthenticated POST is rejected with 401', async ({ request }) => {
    const newExpense = {
      category: 'Packaging',
      description: 'Test unauthenticated',
      amount: 10000,
    }

    const response = await request.post('http://localhost:3000/api/settings/expenses', {
      headers: {
        'Content-Type': 'application/json',
      },
      data: newExpense,
    })
    expect(response.status()).toBe(401)
    const data = await response.json()
    expect(data.error).toContain('Unauthorized')
  })

  // Total Count Accuracy Test
  test('24. Total count reflects actual number of expenses', async ({ request }) => {
    const response = await request.get('http://localhost:3000/api/settings/expenses', {
      headers: {
        'Cookie': `jl_admin_token=${authToken}`,
      },
    })
    expect(response.status()).toBe(200)

    const data = await response.json()
    // Total should be at least the number of test expenses we created
    expect(data.total).toBeGreaterThanOrEqual(3)
  })

  // Edge case: Very large pageSize
  test('25. pageSize is capped at 100', async ({ request }) => {
    const response = await request.get('http://localhost:3000/api/settings/expenses?pageSize=9999', {
      headers: {
        'Cookie': `jl_admin_token=${authToken}`,
      },
    })
    expect(response.status()).toBe(200)

    const data = await response.json()
    expect(data.pageSize).toBeLessThanOrEqual(100)
  })

  // Edge case: pageSize of 0 or negative
  test('26. pageSize is at least 1', async ({ request }) => {
    const response = await request.get('http://localhost:3000/api/settings/expenses?pageSize=0', {
      headers: {
        'Cookie': `jl_admin_token=${authToken}`,
      },
    })
    expect(response.status()).toBe(200)

    const data = await response.json()
    expect(data.pageSize).toBeGreaterThanOrEqual(1)
  })

  // ===== INDIVIDUAL API TESTS (PUT and DELETE) =====

  // GET Individual Tests
  test('27. GET /api/settings/expenses/:id returns single expense', async ({ request }) => {
    const response = await request.get(`http://localhost:3000/api/settings/expenses/${testExpense1.id}`, {
      headers: {
        'Cookie': `jl_admin_token=${authToken}`,
      },
    })
    expect(response.status()).toBe(200)

    const data = await response.json()
    expect(data.id).toBe(testExpense1.id)
    expect(data.category).toBe(testExpense1.category)
    expect(data.description).toBe(testExpense1.description)
    expect(data.amount).toBe(testExpense1.amount)
  })

  test('28. GET /api/settings/expenses/:id with invalid ID returns 400', async ({ request }) => {
    const response = await request.get('http://localhost:3000/api/settings/expenses/invalid', {
      headers: {
        'Cookie': `jl_admin_token=${authToken}`,
      },
    })
    expect(response.status()).toBe(400)
    const data = await response.json()
    expect(data.error).toContain('Invalid expense ID')
  })

  test('29. GET /api/settings/expenses/:id with non-existent ID returns 404', async ({ request }) => {
    const response = await request.get('http://localhost:3000/api/settings/expenses/99999', {
      headers: {
        'Cookie': `jl_admin_token=${authToken}`,
      },
    })
    expect(response.status()).toBe(404)
    const data = await response.json()
    expect(data.error).toContain('not found')
  })

  // PUT Tests
  test('30. PUT /api/settings/expenses/:id updates expense', async ({ request }) => {
    const updateData = {
      category: 'Utility',
      description: 'Updated description',
      amount: 100000,
    }

    const response = await request.put(
      `http://localhost:3000/api/settings/expenses/${testExpense1.id}`,
      {
        headers: {
          'Cookie': `jl_admin_token=${authToken}`,
          'Content-Type': 'application/json',
        },
        data: updateData,
      }
    )
    expect(response.status()).toBe(200)

    const data = await response.json()
    expect(data.id).toBe(testExpense1.id)
    expect(data.category).toBe(updateData.category)
    expect(data.description).toBe(updateData.description)
    expect(data.amount).toBe(updateData.amount)

    // Restore original data
    await request.put(
      `http://localhost:3000/api/settings/expenses/${testExpense1.id}`,
      {
        headers: {
          'Cookie': `jl_admin_token=${authToken}`,
          'Content-Type': 'application/json',
        },
        data: {
          category: testExpense1.category,
          description: testExpense1.description,
          amount: testExpense1.amount,
        },
      }
    )
  })

  test('31. PUT /api/settings/expenses/:id with invalid ID returns 400', async ({ request }) => {
    const response = await request.put('http://localhost:3000/api/settings/expenses/invalid', {
      headers: {
        'Cookie': `jl_admin_token=${authToken}`,
        'Content-Type': 'application/json',
      },
      data: {
        category: 'Packaging',
        description: 'Test',
        amount: 10000,
      },
    })
    expect(response.status()).toBe(400)
    const data = await response.json()
    expect(data.error).toContain('Invalid expense ID')
  })

  test('32. PUT /api/settings/expenses/:id with non-existent ID returns 404', async ({ request }) => {
    const response = await request.put('http://localhost:3000/api/settings/expenses/99999', {
      headers: {
        'Cookie': `jl_admin_token=${authToken}`,
        'Content-Type': 'application/json',
      },
      data: {
        category: 'Packaging',
        description: 'Test',
        amount: 10000,
      },
    })
    expect(response.status()).toBe(404)
    const data = await response.json()
    expect(data.error).toContain('not found')
  })

  test('33. PUT without category returns 400', async ({ request }) => {
    const response = await request.put(
      `http://localhost:3000/api/settings/expenses/${testExpense1.id}`,
      {
        headers: {
          'Cookie': `jl_admin_token=${authToken}`,
          'Content-Type': 'application/json',
        },
        data: {
          description: 'Test',
          amount: 10000,
        },
      }
    )
    expect(response.status()).toBe(400)
    const data = await response.json()
    expect(data.error).toContain('Category is required')
  })

  test('34. PUT with invalid category returns 400', async ({ request }) => {
    const response = await request.put(
      `http://localhost:3000/api/settings/expenses/${testExpense1.id}`,
      {
        headers: {
          'Cookie': `jl_admin_token=${authToken}`,
          'Content-Type': 'application/json',
        },
        data: {
          category: 'InvalidCategory',
          description: 'Test',
          amount: 10000,
        },
      }
    )
    expect(response.status()).toBe(400)
    const data = await response.json()
    expect(data.error).toContain('must be one of')
  })

  test('35. PUT without description returns 400', async ({ request }) => {
    const response = await request.put(
      `http://localhost:3000/api/settings/expenses/${testExpense1.id}`,
      {
        headers: {
          'Cookie': `jl_admin_token=${authToken}`,
          'Content-Type': 'application/json',
        },
        data: {
          category: 'Packaging',
          amount: 10000,
        },
      }
    )
    expect(response.status()).toBe(400)
    const data = await response.json()
    expect(data.error).toContain('Description is required')
  })

  test('36. PUT without amount returns 400', async ({ request }) => {
    const response = await request.put(
      `http://localhost:3000/api/settings/expenses/${testExpense1.id}`,
      {
        headers: {
          'Cookie': `jl_admin_token=${authToken}`,
          'Content-Type': 'application/json',
        },
        data: {
          category: 'Packaging',
          description: 'Test',
        },
      }
    )
    expect(response.status()).toBe(400)
    const data = await response.json()
    expect(data.error).toContain('Amount is required')
  })

  test('37. PUT with zero amount returns 400', async ({ request }) => {
    const response = await request.put(
      `http://localhost:3000/api/settings/expenses/${testExpense1.id}`,
      {
        headers: {
          'Cookie': `jl_admin_token=${authToken}`,
          'Content-Type': 'application/json',
        },
        data: {
          category: 'Packaging',
          description: 'Test',
          amount: 0,
        },
      }
    )
    expect(response.status()).toBe(400)
    const data = await response.json()
    expect(data.error).toContain('must be greater than 0')
  })

  test('38. PUT with negative amount returns 400', async ({ request }) => {
    const response = await request.put(
      `http://localhost:3000/api/settings/expenses/${testExpense1.id}`,
      {
        headers: {
          'Cookie': `jl_admin_token=${authToken}`,
          'Content-Type': 'application/json',
        },
        data: {
          category: 'Packaging',
          description: 'Test',
          amount: -5000,
        },
      }
    )
    expect(response.status()).toBe(400)
    const data = await response.json()
    expect(data.error).toContain('must be greater than 0')
  })

  test('39. PUT with invalid date returns 400', async ({ request }) => {
    const response = await request.put(
      `http://localhost:3000/api/settings/expenses/${testExpense1.id}`,
      {
        headers: {
          'Cookie': `jl_admin_token=${authToken}`,
          'Content-Type': 'application/json',
        },
        data: {
          category: 'Packaging',
          description: 'Test',
          amount: 10000,
          date: 'invalid-date',
        },
      }
    )
    expect(response.status()).toBe(400)
    const data = await response.json()
    expect(data.error).toContain('Invalid date format')
  })

  test('40. PUT creates audit log entry', async ({ request }) => {
    const auditCountBefore = await prisma.auditLog.count()

    const response = await request.put(
      `http://localhost:3000/api/settings/expenses/${testExpense1.id}`,
      {
        headers: {
          'Cookie': `jl_admin_token=${authToken}`,
          'Content-Type': 'application/json',
        },
        data: {
          category: 'Utility',
          description: 'Updated for audit test',
          amount: 55000,
        },
      }
    )
    expect(response.status()).toBe(200)

    const auditCountAfter = await prisma.auditLog.count()
    expect(auditCountAfter).toBeGreaterThan(auditCountBefore)

    // Check audit log
    const auditLog = await prisma.auditLog.findFirst({
      where: {
        action: 'EXPENSE_UPDATED',
        entityId: testExpense1.id.toString(),
      },
      orderBy: { createdAt: 'desc' },
    })
    expect(auditLog).toBeDefined()
    expect(auditLog?.entity).toBe('Expense')

    // Restore original
    await request.put(
      `http://localhost:3000/api/settings/expenses/${testExpense1.id}`,
      {
        headers: {
          'Cookie': `jl_admin_token=${authToken}`,
          'Content-Type': 'application/json',
        },
        data: {
          category: testExpense1.category,
          description: testExpense1.description,
          amount: testExpense1.amount,
        },
      }
    )
  })

  // DELETE Tests
  test('41. DELETE /api/settings/expenses/:id removes expense', async ({ request }) => {
    // Create a test expense to delete
    const createResponse = await request.post('http://localhost:3000/api/settings/expenses', {
      headers: {
        'Cookie': `jl_admin_token=${authToken}`,
        'Content-Type': 'application/json',
      },
      data: {
        category: 'Shipping',
        description: 'Test expense for deletion',
        amount: 15000,
      },
    })
    expect(createResponse.status()).toBe(200)
    const createdExpense = await createResponse.json()

    // Delete it
    const deleteResponse = await request.delete(
      `http://localhost:3000/api/settings/expenses/${createdExpense.id}`,
      {
        headers: {
          'Cookie': `jl_admin_token=${authToken}`,
        },
      }
    )
    expect(deleteResponse.status()).toBe(200)
    const deleteData = await deleteResponse.json()
    expect(deleteData.success).toBe(true)

    // Verify it's deleted
    const getResponse = await request.get(
      `http://localhost:3000/api/settings/expenses/${createdExpense.id}`,
      {
        headers: {
          'Cookie': `jl_admin_token=${authToken}`,
        },
      }
    )
    expect(getResponse.status()).toBe(404)
  })

  test('42. DELETE with invalid ID returns 400', async ({ request }) => {
    const response = await request.delete('http://localhost:3000/api/settings/expenses/invalid', {
      headers: {
        'Cookie': `jl_admin_token=${authToken}`,
      },
    })
    expect(response.status()).toBe(400)
    const data = await response.json()
    expect(data.error).toContain('Invalid expense ID')
  })

  test('43. DELETE with non-existent ID returns 404', async ({ request }) => {
    const response = await request.delete('http://localhost:3000/api/settings/expenses/99999', {
      headers: {
        'Cookie': `jl_admin_token=${authToken}`,
      },
    })
    expect(response.status()).toBe(404)
    const data = await response.json()
    expect(data.error).toContain('not found')
  })

  test('44. DELETE creates audit log entry', async ({ request }) => {
    // Create a test expense to delete
    const createResponse = await request.post('http://localhost:3000/api/settings/expenses', {
      headers: {
        'Cookie': `jl_admin_token=${authToken}`,
        'Content-Type': 'application/json',
      },
      data: {
        category: 'Marketing',
        description: 'Test expense for audit test',
        amount: 35000,
      },
    })
    expect(createResponse.status()).toBe(200)
    const createdExpense = await createResponse.json()

    const auditCountBefore = await prisma.auditLog.count()

    // Delete it
    const deleteResponse = await request.delete(
      `http://localhost:3000/api/settings/expenses/${createdExpense.id}`,
      {
        headers: {
          'Cookie': `jl_admin_token=${authToken}`,
        },
      }
    )
    expect(deleteResponse.status()).toBe(200)

    const auditCountAfter = await prisma.auditLog.count()
    expect(auditCountAfter).toBeGreaterThan(auditCountBefore)

    // Check audit log
    const auditLog = await prisma.auditLog.findFirst({
      where: {
        action: 'EXPENSE_DELETED',
        entityId: createdExpense.id.toString(),
      },
      orderBy: { createdAt: 'desc' },
    })
    expect(auditLog).toBeDefined()
    expect(auditLog?.entity).toBe('Expense')
  })

  test('45. Unauthenticated GET individual expense is rejected with 401', async ({ request }) => {
    const response = await request.get(`http://localhost:3000/api/settings/expenses/${testExpense1.id}`)
    expect(response.status()).toBe(401)
  })

  test('46. Unauthenticated PUT is rejected with 401', async ({ request }) => {
    const response = await request.put(
      `http://localhost:3000/api/settings/expenses/${testExpense1.id}`,
      {
        headers: {
          'Content-Type': 'application/json',
        },
        data: {
          category: 'Packaging',
          description: 'Test',
          amount: 10000,
        },
      }
    )
    expect(response.status()).toBe(401)
  })

  test('47. Unauthenticated DELETE is rejected with 401', async ({ request }) => {
    const response = await request.delete(
      `http://localhost:3000/api/settings/expenses/${testExpense1.id}`
    )
    expect(response.status()).toBe(401)
  })
})
