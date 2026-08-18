/**
 * Backfill script: populate OrderItem snapshot fields for existing records.
 *
 * For each existing OrderItem:
 *   - unitCost        → product.costPrice if product exists, else NULL
 *   - productNameSnapshot → product.name if product exists, else NULL
 *   - brandSnapshot   → product.brand if product exists, else NULL
 *
 * Run once after schema migration:
 *   npx ts-node --project tsconfig.json scripts/backfill-orderitem-snapshots.ts
 *   OR:
 *   npx tsx scripts/backfill-orderitem-snapshots.ts
 */
import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'

// Manual env loading for script context
const envPath = path.resolve(process.cwd(), '.env')
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const i = t.indexOf('=')
    if (i < 1) continue
    const k = t.slice(0, i).trim()
    const v = t.slice(i + 1).trim().replace(/^['"]|['"]$/g, '')
    if (!process.env[k]) process.env[k] = v
  }
}

const prisma = new PrismaClient()

async function main() {
  console.log('Starting OrderItem snapshot backfill...')

  // Get all items that haven't been backfilled (productNameSnapshot is null)
  const items = await prisma.orderItem.findMany({
    where: { productNameSnapshot: null },
    include: { product: true },
  })

  console.log(`Found ${items.length} OrderItems to backfill.`)

  let filled = 0
  let nulled = 0

  for (const item of items) {
    if (item.product) {
      await prisma.orderItem.update({
        where: { id: item.id },
        data: {
          unitCost: item.product.costPrice ?? null,
          productNameSnapshot: item.product.name,
          brandSnapshot: item.product.brand,
        },
      })
      filled++
    } else {
      // Product has been deleted — preserve NULL explicitly
      await prisma.orderItem.update({
        where: { id: item.id },
        data: {
          unitCost: null,
          productNameSnapshot: null,
          brandSnapshot: null,
        },
      })
      nulled++
    }
  }

  console.log(`Backfill complete. Filled: ${filled}, Marked unavailable: ${nulled}`)
  await prisma.$disconnect()
}

main().catch((e) => {
  console.error('Backfill failed:', e)
  process.exit(1)
})
