// scripts/prebuild.mjs
// Runs before `next build` on every platform (Vercel, Render, local).
// - Syncs the Prisma schema to the database with `prisma db push`
//   when DATABASE_URL is set and reachable.
// - Never fails the build: if DATABASE_URL is missing or the DB is
//   unreachable, it warns loudly but lets the build continue so a
//   deploy can never be blocked by database configuration.
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { readFileSync, existsSync } from 'node:fs'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')

// Minimal .env loader (no dependency) so local `npm run prebuild` sees
// DATABASE_URL from the project .env, matching Prisma CLI behaviour.
// On Vercel/Render the platform env vars are already in process.env.
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
  }).status
}

loadDotEnv()
const dbUrl = process.env.DATABASE_URL

if (!dbUrl) {
  console.warn(
    '\n⚠️  DATABASE_URL is NOT set — skipping `prisma db push`.\n' +
      '   The build will continue, but DB-backed API routes (/api/products, /api/orders)\n' +
      '   will not work until DATABASE_URL is added to your platform environment variables.\n'
  )
} else {
  console.log('\n→ DATABASE_URL found — syncing schema with `prisma db push`...\n')
  const status = run('npx prisma db push')
  if (status !== 0) {
    console.warn(
      '\n⚠️  `prisma db push` failed (database unreachable or invalid string?).\n' +
        `   Continuing the build anyway — fix DATABASE_URL (status: ${status}).\n`
    )
  }
}

console.log('\n→ Generating Prisma Client...\n')
process.exit(run('npx prisma generate'))