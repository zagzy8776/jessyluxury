// scripts/prebuild.mjs
// Runs before `next build` on every platform (Vercel, Render, local).
// Database schema changes are intentionally not performed during deployment.
// Production schema changes must be applied separately and verified before release.
import { spawnSync } from 'node:child_process'

function run(cmd) {
  const [bin, ...args] = cmd.split(' ')
  return spawnSync(bin, args, {
    stdio: 'inherit',
    shell: true,
  }).status ?? 1
}

console.log('\n→ Generating Prisma Client...\n')
const status = run('npx prisma generate')

if (status !== 0) {
  console.error('\n❌ Prisma Client generation failed.\n')
  process.exit(status)
}

console.log('\n✅ Prebuild checks complete. Database schema is not modified during deployment.\n')
