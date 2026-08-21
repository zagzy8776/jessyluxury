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
 * GET /api/settings/expenses/:id
 * Retrieve a single expense by ID
 * 
 * Authorization: Requires Admin or Staff with "analytics" permission
 * 
 * Path Parameters:
 * - id: number (Expense ID)
 * 
 * Returns:
 * - 200: Expense record
 * - 401: Unauthorized
 * - 403: Forbidden (insufficient permissions)
 * - 404: Expense not found
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const authErr = await requireStaffAuthOr(request, ['analytics'])
  if (authErr) return authErr

  try {
    const expenseId = parseInt(params.id, 10)
    if (isNaN(expenseId)) {
      return NextResponse.json(
        { error: 'Invalid expense ID' },
        { status: 400 }
      )
    }

    const expense = await prisma.expense.findUnique({
      where: { id: expenseId },
    })

    if (!expense) {
      return NextResponse.json(
        { error: 'Expense not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(expense, { status: 200 })
  } catch (error) {
    console.error('[EXPENSES] Error fetching expense:', error)
    return NextResponse.json(
      { error: 'Failed to fetch expense' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/settings/expenses/:id
 * Update an expense record
 * 
 * Authorization: Requires Admin or Staff with "analytics" permission
 * 
 * Path Parameters:
 * - id: number (Expense ID)
 * 
 * Body:
 * - category: string (required, must be one of: Packaging, Shipping, Marketing, Utility, Salary)
 * - description: string (required)
 * - amount: number (required, must be > 0)
 * - date: ISO date string (optional)
 * 
 * Returns:
 * - 200: Updated expense record
 * - 400: Validation error
 * - 401: Unauthorized
 * - 403: Forbidden (insufficient permissions)
 * - 404: Expense not found
 */
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const authErr = await requireStaffAuthOr(request, ['analytics'])
  if (authErr) return authErr

  try {
    const expenseId = parseInt(params.id, 10)
    if (isNaN(expenseId)) {
      return NextResponse.json(
        { error: 'Invalid expense ID' },
        { status: 400 }
      )
    }

    // Check if expense exists
    const existingExpense = await prisma.expense.findUnique({
      where: { id: expenseId },
    })

    if (!existingExpense) {
      return NextResponse.json(
        { error: 'Expense not found' },
        { status: 404 }
      )
    }

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
      return NextResponse.json(
        { error: 'Category must be one of: Packaging, Shipping, Marketing, Utility, Salary' },
        { status: 400 }
      )
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

    // Parse date if provided
    let expenseDate: Date | undefined
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

    // Update expense record
    const updateData: any = {
      category: body.category.trim(),
      description: body.description.trim(),
      amount: Math.round(amount * 100) / 100, // Store as decimal
    }

    if (expenseDate) {
      updateData.date = expenseDate
    }

    const updatedExpense = await prisma.expense.update({
      where: { id: expenseId },
      data: updateData,
    })

    // Create audit log
    await createAuditLog(
      'EXPENSE_UPDATED',
      'Expense',
      updatedExpense.id.toString(),
      {
        category: updatedExpense.category,
        description: updatedExpense.description,
        amount: updatedExpense.amount,
        date: updatedExpense.date.toISOString(),
      },
      'Admin'
    )

    return NextResponse.json(updatedExpense, { status: 200 })
  } catch (error) {
    console.error('[EXPENSES] Error updating expense:', error)
    return NextResponse.json(
      { error: 'Failed to update expense' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/settings/expenses/:id
 * Delete an expense record
 * 
 * Authorization: Requires Admin or Staff with "analytics" permission
 * 
 * Path Parameters:
 * - id: number (Expense ID)
 * 
 * Returns:
 * - 200: Success message
 * - 401: Unauthorized
 * - 403: Forbidden (insufficient permissions)
 * - 404: Expense not found
 */
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const authErr = await requireStaffAuthOr(request, ['analytics'])
  if (authErr) return authErr

  try {
    const expenseId = parseInt(params.id, 10)
    if (isNaN(expenseId)) {
      return NextResponse.json(
        { error: 'Invalid expense ID' },
        { status: 400 }
      )
    }

    // Check if expense exists
    const existingExpense = await prisma.expense.findUnique({
      where: { id: expenseId },
    })

    if (!existingExpense) {
      return NextResponse.json(
        { error: 'Expense not found' },
        { status: 404 }
      )
    }

    // Delete the expense
    await prisma.expense.delete({
      where: { id: expenseId },
    })

    // Create audit log
    await createAuditLog(
      'EXPENSE_DELETED',
      'Expense',
      expenseId.toString(),
      {
        category: existingExpense.category,
        description: existingExpense.description,
        amount: existingExpense.amount,
        date: existingExpense.date.toISOString(),
      },
      'Admin'
    )

    return NextResponse.json({ success: true, message: 'Expense deleted' }, { status: 200 })
  } catch (error) {
    console.error('[EXPENSES] Error deleting expense:', error)
    return NextResponse.json(
      { error: 'Failed to delete expense' },
      { status: 500 }
    )
  }
}
