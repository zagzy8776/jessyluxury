// scripts/prebuild.mjs
// Runs before `next build` on every platform (Vercel, Render, local).
// When DATABASE_URL is configured, the build verifies that the Prisma schema
// can be synchronized before compiling the application. We deliberately avoid
// --accept-data-loss so a production build cannot silently apply destructive
// schema changes.
// Vercel redeploy trigger: 2026-08-24
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { readFileSync, existsSync } from 'node:fs'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')

function loadDotEnv() {
  const file = resolve(root, '.env')
  if (!existsSync(file)) return
  for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*("?)(.*?)\2\s*$/)
    if (match && !(match[1] in process.env)) process.env[match[1]] = match[3]
  }
}

function run(cmd) {
  const [bin, ...args] = cmd.split(' ')
  return spawnSync(bin, args, {
    cwd: root,
    stdio: 'inherit',
    shell: true,
  }).status ?? 1
}

loadDotEnv()
const dbUrl = process.env.DATABASE_URL

if (!dbUrl) {
  console.warn(
    '\n⚠️  DATABASE_URL is not set — skipping database schema sync.\n' +
      '   Configure DATABASE_URL before production deployment so DB-backed routes work.\n'
  )
} else {
  console.log('\n→ DATABASE_URL found — verifying Prisma schema with `prisma db push --dry-run`...\n')
  const status = run('npx prisma db push --dry-run')
  if (status !== 0) {
    console.error(
      '\n❌ Prisma schema verification failed.\n' +
        '   Fix the database connection or schema mismatch before building for deployment.\n'
    )
    process.exit(status)
  }
}

console.log('\n→ Generating Prisma Client...\n')
process.exit(run('npx prisma generate'))
