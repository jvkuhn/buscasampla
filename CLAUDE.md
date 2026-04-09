# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Buscasampla** is a ranking/review site for Brazilian products built with Next.js 16, featuring an admin dashboard to manage rankings (Top 10 lists), products, categories, banners, and affiliate links. It's an affiliate marketing platform.

### Tech Stack

- **Framework**: Next.js 16.2.2 (App Router)
- **Auth**: NextAuth v5 (beta.30) with credentials provider
- **Database**: PostgreSQL via Prisma 6
- **Styling**: Tailwind CSS 4 with postcss
- **Validation**: Zod 4 for schemas

## Development Commands

```bash
npm run dev       # Start dev server (localhost:3000)
npm run build     # Build (runs: prisma generate && next build)
npm start         # Start production server
npm run seed      # Seed database from prisma/seed.ts
npm run lint      # Run ESLint
```

**Database migrations:**
```bash
npx prisma migrate dev --name <description>   # Create and apply migration
npx prisma migrate deploy                      # Apply migrations in production
npx prisma studio                              # GUI to inspect database
```

**Environment Setup:**
1. Copy `.env.example` to `.env`
2. Set `DATABASE_URL` (Neon PostgreSQL or local)
3. Set `NEXT_PUBLIC_SITE_URL` (e.g. `http://localhost:3000`)
4. Generate `AUTH_SECRET` with: `openssl rand -base64 32`
5. Optional: `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` (defaults: `admin@admin.com` / `admin123`)

## Architecture

### Request Flow

All admin mutations use **Next.js Server Actions** (no API routes). The pattern is:

1. Form submits `FormData` to a server action in `lib/actions/<domain>.ts`
2. Action calls `requireAdmin()` to check session (redirects to `/admin/login` if not authenticated)
3. Parses with Zod schema from `lib/validations.ts`
4. Executes Prisma query via `db` from `lib/db.ts`
5. Calls `revalidatePath()` and `redirect()`

### Authentication (NextAuth v5)

The auth setup is split across two files due to Next.js edge runtime constraints:

- **`lib/auth.config.ts`** — edge-safe config (no Prisma/bcryptjs imports); used in middleware
- **`lib/auth.ts`** — full Credentials provider with bcryptjs; used in server actions

**Middleware** (`middleware.ts`) protects all `/admin/*` routes using the edge-safe config.

Session is JWT-based and stores `id` and `role` (ADMIN/EDITOR).

### App Router Structure

```
app/
  (public)/     — public-facing site (home, category, ranking, product, search, pages)
  admin/        — protected admin dashboard
  api/auth/     — NextAuth.js route handler
components/
  admin/        — forms and UI for the admin panel
  public/       — header, footer, cards for the public site
lib/
  actions/      — server actions, one file per domain (categories, products, rankings, top10, settings)
  auth.ts / auth.config.ts  — auth setup
  db.ts         — Prisma client singleton
  validations.ts — all Zod schemas and inferred TypeScript types
  utils.ts      — slugify and other utilities
prisma/
  schema.prisma — data model
  seed.ts       — seeds admin user, sample data, and initial SiteSettings
```

### Data Model (Prisma)

Key relationships:
- **Category** → has many Rankings and Products
- **Product** → has many AffiliateLinks and RankingItems
- **Ranking** → has many RankingItems (ordered) and FAQs
- **RankingItem** — junction between Ranking and Product; enforces unique `(rankingId, productId)` and `(rankingId, order)`
- **SiteSettings** — singleton row with `id = "default"`, stores global config including GTM ID
- **Status** enum: DRAFT / PUBLISHED (controls public visibility)
- **Badge** enum: BEST_SELLER, BEST_VALUE, PREMIUM, CHEAPEST

### Public Site

The `(public)` route group serves SEO-optimized pages:
- Dynamic `sitemap.xml` and `robots.txt` (blocks `/admin` and `/api`)
- JSON-LD structured data: `WebSite` on home, `ItemList` + `FAQPage` on rankings, `Product` on product pages
- Open Graph metadata generated from each ranking/product's `og*` fields

### Admin Pages

All under `/app/admin/`:
- **Dashboard** (`/admin`) — overview
- **Rankings** — CRUD for Top 10 lists; items are drag-ordered
  - **New Top 10** (`/admin/rankings/novo-top10`) — bulk creation: paste JSON → creates Ranking + Products + AffiliateLinks in one transaction (`lib/actions/top10.ts`)
- **Products** — full CRUD including affiliate links per product
- **Categories, Banners, Pages, Settings** — standard CRUD

### Important Notes

- **No test suite** exists in this project.
- **Next.js 16 breaking changes**: Check `node_modules/next/dist/docs/` for API changes vs. training data.
- **Prisma 6**: Use `force-dynamic` export in routes that call `db` directly from Server Components.
- **Slugs**: Auto-generated via `slugify()` from `lib/utils.ts` if not manually provided; stored on both Product and Ranking for URL routing.
- **`NEXT_PUBLIC_SITE_URL`** is the canonical environment variable (not `NEXTAUTH_URL`).

## Key Files

1. `prisma/schema.prisma` — canonical data model
2. `lib/validations.ts` — all Zod schemas and TypeScript types (start here for any domain)
3. `lib/auth.ts` + `lib/auth.config.ts` — auth setup (edge/non-edge split)
4. `lib/actions/top10.ts` — most complex action (bulk creation transaction)
5. `app/admin/layout.tsx` — auth guard for all admin routes
