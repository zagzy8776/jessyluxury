const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

function loadEnv(p) {
  const c = fs.readFileSync(p, 'utf8');
  const o = {};
  for (const l of c.split(/\r?\n/)) {
    const i = l.indexOf('=');
    if (i > 0) {
      const k = l.slice(0, i).trim();
      const v = l.slice(i + 1).trim().replace(/^"|"$/g, '');
      if (k && !k.startsWith('#')) o[k] = v;
    }
  }
  return o;
}

const e = loadEnv(path.join('e:\\jessy-luxury-website\\jessy-luxury', '.env'));
const url = (e.DATABASE_URL || '').replace('connection_limit=10', 'connection_limit=1');
if (!url) { console.error('NO DATABASE_URL'); process.exit(2); }

const prisma = new PrismaClient({
  datasources: { db: { url } },
  log: ['error'],
});

(async () => {
  try {
    const ok = await prisma.$connect();
    const [a, b, c] = await prisma.$transaction([
      prisma.product.count(),
      prisma.staffAccount.count(),
      prisma.systemConfig.findUnique({ where: { id: 1 } }).then(r => r ? r.sessionVersion : null),
    ]);
    console.log('PROBE_OK productCount=' + a + ' staffCount=' + b + ' sessionVersion=' + c);
  } catch (err) {
    console.error('PROBE_ERR ' + (err && err.message ? err.message : err));
  } finally {
    await prisma.$disconnect();
  }
})();
