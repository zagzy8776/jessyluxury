const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const LOG = 'e:\\jessy-luxury-website\\jessy-luxury\\wd.log';
function log(s) {
  fs.appendFileSync(LOG, (new Date().toISOString()) + ' ' + s + '\n');
}

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
const url = e.DATABASE_URL || '';
if (!url) { log('NO DATABASE_URL'); process.exit(2); }

let warmed = false;
let warmClient = null;

async function oneAttempt() {
  const t0 = Date.now();
  const c = new Client({ connectionString: url, connectionTimeoutMillis: 60000 });
  try {
    await c.connect();
    log('  connect ok after ' + (Date.now() - t0) + 'ms');
    const r = await c.query('SELECT 1 as n');
    if (!warmed) log('WARMED after ' + (Date.now() - t0) + 'ms n=' + r.rows[0].n);
    return c; // keep open
  } catch (err) {
    log('FAIL ' + (Date.now() - t0) + 'ms code=' + (err && err.code) + ' msg=' + (err && err.message));
    try { await c.end(); } catch (_) {}
    return null;
  }
}

async function warmupLoop() {
  while (!warmed) {
    const c = await oneAttempt();
    if (c) {
      warmed = true;
      warmClient = c;
    } else {
      await new Promise((r) => setTimeout(r, 5000));
    }
  }
}

async function heartbeat() {
  while (true) {
    await new Promise((r) => setTimeout(r, 10000));
    if (!warmClient) continue;
    const t0 = Date.now();
    try {
      const r = await warmClient.query('SELECT 1 as n');
      log('HEARTBEAT ok ' + (Date.now() - t0) + 'ms n=' + r.rows[0].n);
    } catch (err) {
      log('HEARTBEAT_FAIL ' + (err && err.code) + ' ' + (err && err.message));
      warmed = false;
      try { await warmClient.end(); } catch (_) {}
      warmClient = null;
      warmupLoop();
    }
  }
}

log('WATCHDOG_START');
warmupLoop().then(() => { log('WARMED_DONE'); heartbeat(); });



