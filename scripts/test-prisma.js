const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

function loadDotEnv() {
  const envPath = path.resolve(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, 'utf8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx < 1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const raw = trimmed.slice(eqIdx + 1).trim();
    const value = raw.replace(/^['"]|['"]$/g, '');
    process.env[key] = value;
  }
}

loadDotEnv();

const prisma = new PrismaClient();

async function run() {
  try {
    console.log('Testing Prisma connection with DATABASE_URL:', process.env.DATABASE_URL);
    const customers = await prisma.customer.findMany({ orderBy: { id: 'desc' }, take: 5 });
    const campaigns = await prisma.campaign.findMany({ orderBy: { id: 'desc' }, take: 5 });
    const notifications = await prisma.notification.findMany({ orderBy: { id: 'desc' }, take: 5 });
    console.log('Customers:', JSON.stringify(customers, null, 2));
    console.log('Campaigns:', JSON.stringify(campaigns, null, 2));
    console.log('Notifications:', JSON.stringify(notifications, null, 2));
  } catch (err) {
    console.error('Failed to connect with Prisma:', err);
  } finally {
    await prisma.$disconnect();
  }
}

run();
