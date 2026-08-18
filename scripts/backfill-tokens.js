const { PrismaClient } = require('@prisma/client');
const { randomUUID } = require('crypto');

const prisma = new PrismaClient();

async function main() {
  console.log('Starting trackingToken backfill...');
  const orders = await prisma.order.findMany({
    where: {
      trackingToken: null,
    },
  });

  console.log(`Found ${orders.length} orders to backfill.`);

  for (const order of orders) {
    const token = 'track_' + randomUUID().replace(/-/g, '');
    await prisma.order.update({
      where: { id: order.id },
      data: { trackingToken: token },
    });
    console.log(`Backfilled order #${order.orderNumber} with token ${token}`);
  }

  // Double check
  const remaining = await prisma.order.count({
    where: { trackingToken: null },
  });
  console.log(`Verification: ${remaining} orders remaining with NULL trackingToken.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
