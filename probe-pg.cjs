const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

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

(async () => {
  const t0 = Date.now();
  const c = new Client({ connectionString: url, connectionTimeoutMillis: 60000 });
  try {
    await c.connect();
    console.log('PG_CONNECT_OK after ' + (Date.now() - t0) + 'ms');
    const r = await c.query('SELECT 1 as n');
    console.log('PG_QUERY_OK n=' + r.rows[0].n);
    const tables = await c.query("SELECT string_agg(tablename, ',' ORDER BY tablename) FROM pg_tables WHERE schemaname='public'");
    console.log('PG_TABLES=' + (tables.rows[0] ? tables.rows[0].string_agg : ''));
  } catch (err) {
    console.error('PG_ERR after ' + (Date.now() - t0) + 'ms: ' + (err && err.message ? err.message : err));
  } finally {
    try { await c.end(); } catch (_) {}
  }
})();
