# Jessy Luxury Fragrance

Production-ready Next.js 14 e-commerce platform for Jessy Luxury Fragrance (Owerri, Nigeria).

## Features
- Premium storefront (shop, product detail, cart, WhatsApp ordering, order tracking)
- Full admin / store portal at `/store-portal-jl` (orders, products, customers, coupons, campaigns, shipping, analytics, settings, staff accounts, expenses, notifications)
- PostgreSQL (Neon) via Prisma
- Auth (admin + staff tokens), audit logs, inventory reservation, coupons, wholesale rules
- Push/email notification pipeline (OneSignal / Resend ready)
- Cloudinary image upload support

## Setup
1. Copy `.env.example` → `.env` and fill `DATABASE_URL`, `ADMIN_PASSWORD`, WhatsApp, Cloudinary.
2. `npm install`
3. `npx prisma generate && npx prisma db push` (or migrate)
4. Optional: `npx prisma db seed` (settings only) or run `node scripts/seed.mjs` carefully (demo data).
5. `npm run dev`

## Production notes
- Admin lives under `/store-portal-jl/dashboard/*` (old `/admin/*` routes redirect).
- Do **not** run the full `scripts/seed.mjs` on a live domain — it seeds demo products, customers and orders. Use the minimal `prisma/seed.ts` for settings only.
- Replace any Unsplash placeholder product images with real Cloudinary / local assets before going live.
- Ensure `ADMIN_PASSWORD` and notification secrets are set in the production environment.
- Clean committed debug logs / build artifacts if cloning for deploy (many `*.log`, `build_*.txt`, `visual-review/` are local artifacts).

## Domain
Already configured for production use. Keep secrets out of the repository.
