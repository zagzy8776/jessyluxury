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
    const config = await prisma.systemConfig.findUnique({ where: { id: 1 } });
    console.log('Successfully reached database with Prisma! config:', config);
  } catch (err) {
    console.error('Failed to connect with Prisma:', err);
  } finally {
    await prisma.$disconnect();
  }
}

run();
