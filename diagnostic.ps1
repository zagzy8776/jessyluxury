# Neon DB Cold-Start Diagnostic Script
# Run this to isolate the connection issue

#!/bin/bash

echo "=== Neon DB Cold-Start Diagnostic ==="
echo "$(date)"
echo

# 1. Test network connectivity to Neon hosts
echo "1. Testing network connectivity..."
echo "Pooler host connectivity:"
testnetpooler=$(Test-NetConnection -ComputerName ep-silent-forest-azug0wa0-pooler.c-3.ap-southeast-1.aws.neon.tech -Port 5432 -WarningAction SilentlyContinue | Select-Object TcpTestSucceeded)
Write-Output $testnetpooler

echo "Non-pooler host connectivity:"
testregular=$(Test-NetConnection -ComputerName ep-silent-forest-azug0wa0.ap-southeast-1.aws.neon.tech -Port 5432 -WarningAction SilentlyContinue | Select-Object TcpTestSucceeded)
Write-Output $testregular
echo

# 2. Check if Neon compute is reachable via psql (if available)
echo "2. Testing direct psql connection..."
if (Get-Command psql -ErrorAction SilentlyContinue) {
    Write-Output "psql command found"
    $env:PGPASSWORD = "npg_Dmn5zZXLuAP8"
    $result = psql -h ep-silent-forest-azug0wa0.ap-southeast-1.aws.neon.tech -U neondb_owner -d neondb -c "SELECT 1;" 2>&1
    Write-Output "psql result: $result"
} else {
    Write-Output "psql not available, skipping direct test"
}
echo

# 3. Kill any stuck Node processes
echo "3. Checking for stuck Node processes..."
$nodeProcesses = Get-Process | Where-Object {$_.ProcessName -eq 'node'} | Select-Object Id, StartTime, CPU, WorkingSet
Write-Output $nodeProcesses
echo

# 4. Kill the stuck watchdog if needed
echo "4. Attempting to kill stuck watchdog process..."
$watchdogPids = $nodeProcesses | Where-Object { $_.ProcessName -eq 'node' -and $_.StartTime -lt (Get-Date).AddMinutes(-1) } | Select-Object Id
if ($watchdogPids) {
    foreach ($pid in $watchdogPids.Id) {
        try {
            Stop-Process -Id $pid -Force
            Write-Output "Killed watchdog process $pid"
        } catch {
            Write-Output "Failed to kill process $pid`: $($_.Exception.Message)"
        }
    }
} else {
    Write-Output "No obviously stuck watchdog processes found"
}
echo

# 5. Try a single connection attempt with verbose logging
echo "5. Testing single connection attempt..."
$env:NODE_OPTIONS = "--max-old-space-size=8196"
$testScript = @"
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

function loadEnv(p) {
  const c = fs.readFileSync(p, 'utf8');
  const o = {};
  for (const l of c.split(/\\r?\\n/)) {
    const i = l.indexOf('=');
    if (i > 0) {
      const k = l.slice(0, i).trim();
      const v = l.slice(i + 1).trim().replace(/^\"|\"$/g, '');
      if (k && !k.startsWith('#')) o[k] = v;
    }
  }
  return o;
}

const e = loadEnv(path.join('${PWD}', '.env'));
const url = e.DATABASE_URL || '';
if (!url) { console.error('NO DATABASE_URL'); process.exit(2); }

(async () => {
  const t0 = Date.now();
  const c = new Client({ connectionString: url, connectionTimeoutMillis: 60000, keepAlive: true });
  try {
    console.log('Attempting connection to:', url.split('@')[0] + '@***');
    await c.connect();
    console.log('PG_CONNECT_OK after ' + (Date.now() - t0) + 'ms');
    const r = await c.query('SELECT 1 as n');
    console.log('PG_QUERY_OK n=' + r.rows[0].n);
    console.log('SUCCESS: Database connection established');
    await c.end();
  } catch (err) {
    console.error('PG_ERR after ' + (Date.now() - t0) + 'ms: ' + (err && err.code ? 'code=' + err.code + ' ' : '') + (err && err.message ? err.message : err));
    if (err.code === 'ECONNRESET') {
      console.error('This indicates the Neon compute is unreachable or rejecting connections');
    } else if (err.message.includes('timeout')) {
      console.error('This indicates a connection timeout - compute may be in cold-start or unreachable');
    }
  } finally {
    try { await c.end(); } catch (_) {}
  }
})();
"@

$testScript | node --max-old-space-size=8196 | Write-Output
echo

# 6. Provide summary
echo "=== Diagnostic Complete ==="
echo "Check the output above for specific connection errors."
echo "If all tests show ECONNRESET or timeout, the issue is likely:
- Neon compute in cold-start mode
- SSL certificate issues  
- Network routing problems to the compute endpoint
- Database connection pooler configuration issues"
echo
echo "Recommended next steps based on results:"
echo "1. If connection fails: Check Neon dashboard for compute status"
echo "2. If network works but connection fails: Check SSL modes in DATABASE_URL"
echo "3. If all fails: Consider temporarily disabling Neon autosleep"
echo "4. If still stuck: Check if any other processes are binding to the port"