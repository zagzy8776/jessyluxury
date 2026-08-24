import { NextResponse } from 'next/server'
import { requireStaffAuth } from '@/lib/staff-auth'
import { prisma } from '@/lib/prisma'

function parseCsvLine(line: string) {
  const cells: string[] = []
  let current = ''
  let quoted = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    const next = line[i + 1]
    if (ch === '"' && quoted && next === '"') {
      current += '"'
      i++
    } else if (ch === '"') {
      quoted = !quoted
    } else if (ch === ',' && !quoted) {
      cells.push(current.trim())
      current = ''
    } else {
      current += ch
    }
  }
  cells.push(current.trim())
  return cells
}

function toBool(value: string | undefined) {
  return ['true', '1', 'yes', 'y'].includes(String(value || '').trim().toLowerCase())
}

function toNumber(value: string | undefined, fallback = 0) {
  const n = Number(String(value ?? '').replace(/[,₦]/g, '').trim())
  return Number.isFinite(n) ? n : fallback
}

export async function POST(request: Request) {
  const authErr = await requireStaffAuth(request, 'products')
  if (authErr) return authErr

  try {
    const csv = await request.text()
    if (!csv.trim()) return NextResponse.json({ error: 'The CSV file is empty' }, { status: 400 })

    const lines = csv.replace(/^\uFEFF/, '').split(/\r?\n/).filter((line) => line.trim().length > 0)
    if (lines.length < 2) return NextResponse.json({ error: 'CSV must contain a header row and at least one product row' }, { status: 400 })

    const headers = parseCsvLine(lines[0]).map((h) => h.toLowerCase().replace(/\s+/g, ''))
    const required = ['name', 'price']
    for (const key of required) {
      if (!headers.includes(key)) return NextResponse.json({ error: `CSV is missing required column: ${key}` }, { status: 400 })
    }

    let created = 0
    let updated = 0
    const errors: string[] = []

    for (let index = 1; index < lines.length; index++) {
      const cells = parseCsvLine(lines[index])
      const row = Object.fromEntries(headers.map((h, i) => [h, cells[i] ?? '']))
      const name = String(row.name || '').trim()
      const brand = String(row.brand || 'Jessy Selection').trim()
      const price = toNumber(row.price)
      if (!name || price <= 0) {
        errors.push(`Row ${index + 1}: name and a positive price are required`)
        continue
      }

      let categoryId = toNumber(row.categoryid, 0)
      if (!categoryId && row.category) {
        const category = await prisma.category.findFirst({
          where: { name: { equals: String(row.category).trim(), mode: 'insensitive' } },
          select: { id: true },
        })
        categoryId = category?.id || 0
      }
      if (!categoryId) {
        errors.push(`Row ${index + 1}: a valid categoryId or category name is required`)
        continue
      }

      const categoryExists = await prisma.category.findUnique({ where: { id: categoryId }, select: { id: true } })
      if (!categoryExists) {
        errors.push(`Row ${index + 1}: category does not exist`)
        continue
      }

      const data = {
        name,
        brand,
        price,
        salePrice: row.saleprice ? toNumber(row.saleprice) : null,
        costPrice: row.costprice ? toNumber(row.costprice) : 0,
        badge: row.badge ? String(row.badge).trim() : null,
        categoryId,
        volume: String(row.volume || '100ml EDP').trim(),
        notes: row.notes || null,
        topNotes: row.topnotes || null,
        middleNotes: row.middlenotes || null,
        baseNotes: row.basenotes || null,
        description: row.description || null,
        tone: String(row.tone || 'amber').trim(),
        stock: Math.max(0, Math.trunc(toNumber(row.stock, 0))),
        featured: toBool(row.featured),
        gift: toBool(row.gift),
        images: row.images
          ? String(row.images).split('|').map((v) => v.trim()).filter(Boolean)
          : row.imageurl
            ? [String(row.imageurl).trim()]
            : [],
        updatedAt: new Date(),
      }

      const existing = row.id
        ? await prisma.product.findUnique({ where: { id: Math.trunc(toNumber(row.id)) }, select: { id: true } })
        : await prisma.product.findFirst({ where: { name: { equals: name, mode: 'insensitive' }, brand: { equals: brand, mode: 'insensitive' } }, select: { id: true } })

      if (existing) {
        await prisma.product.update({ where: { id: existing.id }, data })
        updated++
      } else {
        await prisma.product.create({ data })
        created++
      }
    }

    return NextResponse.json({ created, updated, errors }, { status: errors.length ? 207 : 200 })
  } catch (error) {
    console.error('[PRODUCT_IMPORT] error:', error)
    return NextResponse.json({ error: 'Failed to import products' }, { status: 500 })
  }
}
