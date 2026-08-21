import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireStaffAuthOr } from '@/lib/staff-auth'
import { validateRequired, validateEnum } from '@/lib/validation'
import { createAuditLog } from '@/lib/audit'

/**
 * Valid expense categories
 */
const VALID_CATEGORIES = ['Packaging', 'Shipping', 'Marketing', 'Utility', 'Salary'] as const

/**
 * GET /api/settings/expenses
 * List all expenses with pagination and date filtering
 * 
 * Authorization: Requires Admin or Staff with "analytics" permission
 * 
 * Query Parameters:
 * - page: number (default: 1)
 * - pageSize: number (default: 20)
 * - startDate: ISO date string (optional, filters createdAt >= startDate)
 * - endDate: ISO date string (optional, filters createdAt <= endDate)
 * 
 * Returns:
 * - 200: { expenses: Expense[], total: number, page: number, pageSize: number, totalPages: number }
 * - 401: Unauthorized
 * - 403: Forbidden (insufficient permissions)
 */
export async function GET(request: Request) {
  const authErr = await requireStaffAuthOr(request, ['analytics'])
  if (authErr) return authErr

  try {
    const { searchParams } = new URL(request.url)
    
    // Get pagination parameters
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '20', 10)))
    
    // Get date filters
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    
    // Build where clause for date filtering
    const where: any = {}
    
    if (startDate) {
      try {
        const startDateTime = new Date(startDate)
        if (isNaN(startDateTime.getTime())) {
          return NextResponse.json(
            { error: 'Invalid startDate format. Use ISO date string (e.g., 2024-01-01)' },
            { status: 400 }
          )
        }
        where.createdAt = { gte: startDateTime }
      } catch {
        return NextResponse.json(
          { error: 'Invalid startDate format. Use ISO date string (e.g., 2024-01-01)' },
          { status: 400 }
        )
      }
    }
    
    if (endDate) {
      try {
        const endDateTime = new Date(endDate)
        // Set to end of day
        if (isNaN(endDateTime.getTime())) {
          return NextResponse.json(
            { error: 'Invalid endDate format. Use ISO date string (e.g., 2024-12-31)' },
            { status: 400 }
          )
        }
        endDateTime.setHours(23, 59, 59, 999)
        if (where.createdAt) {
          where.createdAt.lte = endDateTime
        } else {
          where.createdAt = { lte: endDateTime }
        }
      } catch {
        return NextResponse.json(
          { error: 'Invalid endDate format. Use ISO date string (e.g., 2024-12-31)' },
          { status: 400 }
        )
      }
    }
    
    // Get total count of matching records
    const total = await prisma.expense.count({ where })
    
    // Calculate pagination
    const skip = (page - 1) * pageSize
    const totalPages = Math.ceil(total / pageSize)
    
    // Fetch paginated expenses, ordered by date descending
    const expenses = await prisma.expense.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: pageSize,
    })
    
    return NextResponse.json({
      expenses,
      total,
      page,
      pageSize,
      totalPages,
    }, { status: 200 })
  } catch (error) {
    console.error('[EXPENSES] Error fetching expenses:', error)
    return NextResponse.json(
      { error: 'Failed to fetch expenses' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/settings/expenses
 * Create new expense record
 * 
 * Authorization: Requires Admin or Staff with "analytics" permission
 * 
 * Body:
 * - category: string (required, must be one of: Packaging, Shipping, Marketing, Utility, Salary)
 * - description: string (required)
 * - amount: number (required, must be > 0)
 * - date: ISO date string (optional, defaults to now)
 * 
 * Returns:
 * - 200: Created expense record
 * - 400: Validation error
 * - 401: Unauthorized
 * - 403: Forbidden (insufficient permissions)
 */
export async function POST(request: Request) {
  const authErr = await requireStaffAuthOr(request, ['analytics'])
  if (authErr) return authErr

  try {
    const body = await request.json()
    
    // Validate required fields
    const categoryError = validateRequired(body.category, 'Category')
    if (categoryError) {
      return NextResponse.json({ error: categoryError }, { status: 400 })
    }
    
    // Validate category enum
    const validCategoryError = validateEnum(
      body.category,
      VALID_CATEGORIES as unknown as string[],
      'category'
    )
    if (validCategoryError) {
      return NextResponse.json({ error: 'Category must be one of: Packaging, Shipping, Marketing, Utility, Salary' }, { status: 400 })
    }
    
    const descriptionError = validateRequired(body.description, 'Description')
    if (descriptionError) {
      return NextResponse.json({ error: descriptionError }, { status: 400 })
    }
    
    const amountError = validateRequired(body.amount, 'Amount')
    if (amountError) {
      return NextResponse.json({ error: amountError }, { status: 400 })
    }
    
    // Validate amount is a positive number
    const amount = parseFloat(body.amount)
    if (isNaN(amount) || amount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be greater than 0' },
        { status: 400 }
      )
    }
    
    // Parse date if provided, otherwise use now
    let expenseDate = new Date()
    if (body.date) {
      try {
        const parsedDate = new Date(body.date)
        if (isNaN(parsedDate.getTime())) {
          return NextResponse.json(
            { error: 'Invalid date format. Use ISO date string (e.g., 2024-01-01T10:30:00Z)' },
            { status: 400 }
          )
        }
        expenseDate = parsedDate
      } catch {
        return NextResponse.json(
          { error: 'Invalid date format' },
          { status: 400 }
        )
      }
    }
    
    // Create expense record
    const newExpense = await prisma.expense.create({
      data: {
        category: body.category.trim(),
        description: body.description.trim(),
        amount: Math.round(amount * 100) / 100, // Store as decimal
        date: expenseDate,
      },
    })
    
    // Create audit log
    await createAuditLog(
      'EXPENSE_CREATED',
      'Expense',
      newExpense.id.toString(),
      {
        category: newExpense.category,
        description: newExpense.description,
        amount: newExpense.amount,
        date: newExpense.date.toISOString(),
      },
      'Admin'
    )
    
    return NextResponse.json(newExpense, { status: 200 })
  } catch (error) {
    console.error('[EXPENSES] Error creating expense:', error)
    return NextResponse.json(
      { error: 'Failed to create expense' },
      { status: 500 }
    )
  }
}
