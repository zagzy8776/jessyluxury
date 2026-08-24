// Temporary diagnostic: verify single-default index + current default count
import { PrismaClient } from '@prisma/client'
const p = new PrismaClient()
async function main() {
  const cols = await p.$queryRawUnsafe(
    "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'PaymentSettings' ORDER BY COLUMN_NAME"
  )
  console.log('PAYMENT_COLS:', JSON.stringify(cols))
  const idx = await p.$queryRawUnsafe(
    "SELECT INDEXNAME FROM PG_INDEXES WHERE TABLENAME = 'StoreLocation'"
  )
  console.log('INDEXES:', JSON.stringify(idx))
  const defaults = await p.storeLocation.findMany({ where: { isDefault: true } })
  console.log('DEFAULT_COUNT:', defaults.length, defaults.map((d) => d.id))
  const locs = await p.storeLocation.findMany({ select: { id: true, name: true, isDefault: true } })
  console.log('LOCATIONS:', JSON.stringify(locs))
  await p.$disconnect()
}
main().catch((e) => { console.error(e.message); process.exit(1) })

main().catch((e) => { console.error(e.message); process.exit(1) })
