# Block 1 — Favicon + `/inicio` Mirror Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the favicon update (logo `A` azul) and the `/inicio` mirror route so the user can test the pre-configured Google Ads campaign.

**Architecture:** Extract current `HomePage` into a shared server component used by both `/` and `/inicio`. `/inicio` declares canonical `/` via metadata. Favicon via App Router convention (`app/icon.jpg`).

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Prisma 6.

---

## File Structure

**Files to create:**
- `components/public/HomePageContent.tsx` — shared async server component with home logic (queries + JSX).
- `app/(public)/inicio/page.tsx` — mirror route rendering `HomePageContent` with canonical `/`.
- `app/icon.jpg` — new favicon source (copied/renamed from `app/ampla.jpg`).

**Files to modify:**
- `app/(public)/page.tsx` — replace inline home logic with re-export of `HomePageContent`, preserving `dynamic = "force-dynamic"`.

**Files to delete:**
- `app/favicon.ico` — legacy favicon being replaced.
- `app/ampla.jpg` — replaced by `app/icon.jpg` (rename, not duplicate).

**Files NOT modified (confirmed):**
- `app/sitemap.ts` — already only lists `/` in static routes; `/inicio` intentionally excluded.
- `app/robots.ts` — no change; `/inicio` remains crawlable.
- `app/layout.tsx` — no change; Next.js auto-injects `<link rel="icon">` from `app/icon.jpg`.

**Note on testing:** Project has no test suite. Verification is manual (dev server + build).

---

### Task 1: Replace favicon source

**Files:**
- Rename: `app/ampla.jpg` → `app/icon.jpg`
- Delete: `app/favicon.ico`

- [ ] **Step 1: Rename `ampla.jpg` to `icon.jpg`**

Run:
```bash
git mv app/ampla.jpg app/icon.jpg
```

Expected: file moves, git tracks rename.

- [ ] **Step 2: Delete legacy favicon**

Run:
```bash
git rm app/favicon.ico
```

Expected: file removed from working tree and staged for deletion.

- [ ] **Step 3: Verify file layout**

Run:
```bash
ls app/icon.jpg app/favicon.ico 2>&1
```

Expected: `app/icon.jpg` exists, `app/favicon.ico` shows "No such file".

---

### Task 2: Extract `HomePageContent` shared server component

**Files:**
- Create: `components/public/HomePageContent.tsx`

- [ ] **Step 1: Create the shared component file**

Write to `components/public/HomePageContent.tsx`:

```tsx
import Link from "next/link";
import { db } from "@/lib/db";
import { RankingCard } from "@/components/public/RankingCard";

export default async function HomePageContent() {
  const [categoriesWithRankings, uncategorizedRankings, topBanner, settings] = await Promise.all([
    db.category.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { order: "asc" },
      include: {
        rankings: {
          where: { status: "PUBLISHED" },
          orderBy: { updatedAt: "desc" },
          take: 3,
          include: {
            category: { select: { name: true } },
            _count: { select: { items: true } },
            items: {
              where: { order: 1 },
              take: 1,
              select: { product: { select: { imageUrl: true } } },
            },
          },
        },
      },
    }),
    db.ranking.findMany({
      where: { status: "PUBLISHED", categoryId: null },
      orderBy: { updatedAt: "desc" },
      take: 6,
      include: {
        category: { select: { name: true } },
        _count: { select: { items: true } },
        items: {
          where: { order: 1 },
          take: 1,
          select: { product: { select: { imageUrl: true } } },
        },
      },
    }),
    db.banner.findFirst({
      where: { active: true, position: "home_top" },
      orderBy: { order: "asc" },
    }),
    db.siteSettings.findUnique({ where: { id: "default" } }),
  ]);

  const categoriesWithContent = categoriesWithRankings.filter((c) => c.rankings.length > 0);
  const totalRankings = categoriesWithRankings.reduce((sum, c) => sum + c.rankings.length, 0)
    + uncategorizedRankings.length;

  const siteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: settings?.siteName ?? "BuscasAmpla",
    url: "/",
    potentialAction: {
      "@type": "SearchAction",
      target: "/busca?q={search_term_string}",
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(siteJsonLd) }}
      />

      {/* Hero */}
      <section className="bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 text-white">
        <div className="max-w-5xl mx-auto px-4 py-16 md:py-24 text-center">
          {topBanner ? (
            <>
              <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight">
                {topBanner.title}
              </h1>
              {topBanner.subtitle && (
                <p className="mt-4 text-lg md:text-xl text-blue-100 max-w-2xl mx-auto">
                  {topBanner.subtitle}
                </p>
              )}
              {topBanner.linkUrl && (
                <a
                  href={topBanner.linkUrl}
                  className="inline-block mt-6 bg-white text-blue-700 font-bold px-8 py-3 rounded-full hover:bg-blue-50 transition-colors shadow-lg"
                >
                  {topBanner.linkLabel || "Saiba mais"}
                </a>
              )}
            </>
          ) : (
            <>
              <div className="inline-block bg-white/10 text-blue-100 text-sm font-medium px-4 py-1.5 rounded-full mb-5">
                Comparativos imparciais · Atualizado em 2026
              </div>
              <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight">
                Os melhores produtos,<br className="hidden md:block" /> comparados pra você
              </h1>
              <p className="mt-5 text-lg md:text-xl text-blue-100 max-w-2xl mx-auto">
                Listas Top 10 com prós, contras, preços e onde comprar — tudo em um só lugar.
              </p>
              {categoriesWithContent.length > 0 && (
                <div className="mt-8 flex flex-wrap justify-center gap-3">
                  {categoriesWithContent.slice(0, 5).map((c) => (
                    <Link
                      key={c.id}
                      href={`/categorias/${c.slug}`}
                      className="bg-white/15 hover:bg-white/25 text-white text-sm font-medium px-4 py-2 rounded-full transition-colors border border-white/20"
                    >
                      {c.name}
                    </Link>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* Seções por categoria */}
      {categoriesWithContent.length > 0 ? (
        <div className="max-w-6xl mx-auto px-4">
          {categoriesWithContent.map((category, idx) => (
            <section
              key={category.id}
              className={`py-12 ${idx > 0 ? "border-t border-gray-200" : "pt-14"}`}
            >
              <div className="flex items-start justify-between mb-6 gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{category.name}</h2>
                  {category.description && (
                    <p className="text-sm text-gray-500 mt-1 max-w-xl">{category.description}</p>
                  )}
                </div>
                <Link
                  href={`/categorias/${category.slug}`}
                  className="shrink-0 text-sm text-blue-600 hover:text-blue-800 font-semibold hover:underline mt-1"
                >
                  Ver todos →
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {category.rankings.map((r) => (
                  <RankingCard key={r.id} ranking={r} />
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : totalRankings === 0 ? (
        <div className="max-w-6xl mx-auto px-4 py-20 text-center text-gray-400">
          Nenhum ranking publicado ainda.
        </div>
      ) : null}

      {/* Rankings sem categoria */}
      {uncategorizedRankings.length > 0 && (
        <section className={`max-w-6xl mx-auto px-4 py-12 ${categoriesWithContent.length > 0 ? "border-t border-gray-200" : ""}`}>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Outros rankings</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {uncategorizedRankings.map((r) => (
              <RankingCard key={r.id} ranking={r} />
            ))}
          </div>
        </section>
      )}

      {/* CTA final */}
      {categoriesWithContent.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 py-10 pb-16">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-center text-white">
            <h2 className="text-2xl font-bold">Explore por categoria</h2>
            <p className="text-blue-100 mt-2">Eletrodomésticos, eletrônicos, cozinha e muito mais.</p>
            <Link
              href="/categorias"
              className="inline-block mt-5 bg-white text-blue-700 font-bold px-6 py-2.5 rounded-full hover:bg-blue-50 transition-colors"
            >
              Ver todas as categorias
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
```

---

### Task 3: Rewrite `app/(public)/page.tsx` as thin wrapper

**Files:**
- Modify: `app/(public)/page.tsx` (full replacement)

- [ ] **Step 1: Replace file contents**

Overwrite `app/(public)/page.tsx` with:

```tsx
export { default } from "@/components/public/HomePageContent";

export const dynamic = "force-dynamic";
```

Notes:
- `export { default } from` is legal in Next.js App Router page files. Next.js only requires a default export; route-level config (`dynamic`, `metadata`) can coexist.
- No metadata override needed here — root layout's `metadata` already handles title/description.

---

### Task 4: Create `/inicio` mirror route

**Files:**
- Create: `app/(public)/inicio/page.tsx`

- [ ] **Step 1: Create directory and file**

Write to `app/(public)/inicio/page.tsx`:

```tsx
import type { Metadata } from "next";

export { default } from "@/components/public/HomePageContent";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};
```

Notes:
- `alternates.canonical: "/"` resolves against `metadataBase` from root layout to `https://buscasampla.com.br/` — signals to Google that `/` is the canonical version of this mirror.
- No separate title/description: the root layout's defaults apply.

---

### Task 5: Local verification

- [ ] **Step 1: Type check / build**

Run:
```bash
npm run build
```

Expected: build succeeds with no TypeScript errors. If it fails on the `export { default } from` pattern, fall back to an explicit import:

```tsx
import HomePageContent from "@/components/public/HomePageContent";
export default HomePageContent;
export const dynamic = "force-dynamic";
```

(And the analogous change for `/inicio/page.tsx`.)

- [ ] **Step 2: Start dev server**

Run (background):
```bash
npm run dev
```

Wait for "Ready" message.

- [ ] **Step 3: Fetch `/` and `/inicio`**

Run:
```bash
curl -s http://localhost:3000/ | grep -c 'Os melhores produtos'
curl -s http://localhost:3000/inicio | grep -c 'Os melhores produtos'
```

Expected: both return `1` (same hero text rendered).

- [ ] **Step 4: Check canonical on `/inicio`**

Run:
```bash
curl -s http://localhost:3000/inicio | grep -o '<link rel="canonical"[^>]*>'
```

Expected: output contains `href="http://localhost:3000/"` (or the env-configured base URL).

- [ ] **Step 5: Check icon link on both routes**

Run:
```bash
curl -s http://localhost:3000/ | grep -o 'rel="icon"[^>]*'
curl -s http://localhost:3000/inicio | grep -o 'rel="icon"[^>]*'
```

Expected: both output a `rel="icon"` tag pointing to `/icon.jpg` (with Next.js cache-busting query param).

- [ ] **Step 6: Check sitemap does not include `/inicio`**

Run:
```bash
curl -s http://localhost:3000/sitemap.xml | grep -c '/inicio'
```

Expected: `0`.

- [ ] **Step 7: Stop dev server**

Stop the background dev server process.

---

### Task 6: Ship

- [ ] **Step 1: Stage changes**

Run:
```bash
git status
```

Verify staged/unstaged changes match expectation:
- Renamed: `app/ampla.jpg` → `app/icon.jpg`
- Deleted: `app/favicon.ico`
- New: `components/public/HomePageContent.tsx`
- New: `app/(public)/inicio/page.tsx`
- Modified: `app/(public)/page.tsx`
- New: `docs/superpowers/specs/2026-04-11-block1-favicon-inicio-mirror-design.md`
- New: `docs/superpowers/plans/2026-04-11-block1-favicon-inicio-mirror.md`

- [ ] **Step 2: Commit**

Run (HEREDOC):
```bash
git add app/icon.jpg app/favicon.ico components/public/HomePageContent.tsx app/\(public\)/page.tsx app/\(public\)/inicio/page.tsx docs/superpowers/specs/2026-04-11-block1-favicon-inicio-mirror-design.md docs/superpowers/plans/2026-04-11-block1-favicon-inicio-mirror.md
git commit -m "$(cat <<'EOF'
feat(public): espelho /inicio da home para Google Ads + novo favicon

- Extrai HomePageContent para componente server compartilhado
- / e /inicio renderizam o mesmo conteúdo; /inicio tem canonical /
- Troca favicon para logo A azul (app/icon.jpg), remove favicon.ico antigo

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>
EOF
)"
```

- [ ] **Step 3: Push**

Run:
```bash
git push
```

Expected: push succeeds to `origin/main`.

---

## Self-Review

**Spec coverage:**
- Favicon rename + delete → Task 1 ✓
- `HomePageContent` extraction → Task 2 ✓
- `page.tsx` thin wrapper → Task 3 ✓
- `/inicio` route with canonical → Task 4 ✓
- Sitemap not modified (already correct) → documented in File Structure ✓
- Manual verification → Task 5 ✓
- Commit + push → Task 6 ✓

**Placeholder scan:** No TBD/TODO. Every code step has full code. ✓

**Type consistency:** `HomePageContent` is the single name used in all tasks. ✓
