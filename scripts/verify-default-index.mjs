// Temporary diagnostic: verify single-default index + current default count
import { PrismaClient } from '@prisma/client'
const p = new PrismaClient()
async function main() {
  const idx = await p.$queryRawUnsafe(
    "SELECT INDEXNAME FROM PG_INDEXES WHERE TABLENAME = 'StoreLocation'"
  )
  console.log('INDEXES:', JSON.stringify(idx))
  const defaults = await p.storeLocation.findMany({ where: { isDefault: true } })
  console.log('DEFAULT_COUNT:', defaults.length, defaults.map((d) => d.id))
  await p.$disconnect()
}
main().catch((e) => { console.error(e.message); process.exit(1) })
