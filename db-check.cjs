const { PrismaClient } = require('@prisma/client')
const p = new PrismaClient()
const t = Date.now()
p.product
  .count()
  .then((c) => console.log('PRODUCT_COUNT', c, 'elapsed_ms', Date.now() - t))
  .catch((e) => console.log('DBERR', e.message))
  .finally(() => p.$disconnect())