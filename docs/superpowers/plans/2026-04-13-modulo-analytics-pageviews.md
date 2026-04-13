# Modulo de Analytics: Page Views + Conversao — Plano de Implementacao

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adicionar rastreio proprio de page views nas paginas de ranking, produto e categoria, com dashboard de conversao no admin.

**Architecture:** Componente client-side (`PageViewTracker`) coleta dados e faz POST fire-and-forget para `/api/pageviews`, que persiste na tabela `PageView`. O dashboard existente ganha cards de views/conversao, e uma nova pagina `/admin/analytics` mostra analise completa (referrers, devices, UTMs, conversao por pagina).

**Tech Stack:** Next.js 16 (App Router), Prisma 6 (PostgreSQL), React 19, Tailwind CSS 4

**Spec:** `docs/superpowers/specs/2026-04-13-modulo-analytics-pageviews-design.md`

---

## File Structure

```
NOVOS:
  lib/visitor-cookie.ts                  — gera/le cookie bs-vid (client-side util)
  components/public/PageViewTracker.tsx   — componente "use client" de coleta
  app/api/pageviews/route.ts             — endpoint POST publico
  lib/analytics.ts                       — queries centralizadas de analytics
  app/admin/analytics/page.tsx           — pagina dedicada de analytics

MODIFICADOS:
  prisma/schema.prisma                   — adicionar PageView, PageType, DeviceType
  app/(public)/ranking/[slug]/page.tsx   — adicionar <PageViewTracker>
  app/(public)/produto/[slug]/page.tsx   — adicionar <PageViewTracker>
  app/(public)/categorias/[slug]/page.tsx — adicionar <PageViewTracker>
  components/admin/AdminSidebar.tsx      — adicionar link "Analytics"
  app/admin/(dashboard)/page.tsx         — adicionar cards de views + conversao
```

---

### Task 1: Schema Prisma — adicionar PageView, PageType, DeviceType

**Files:**
- Modify: `prisma/schema.prisma:199-211` (adicionar depois do ClickLog)

- [ ] **Step 1: Adicionar enums e model ao schema**

Abrir `prisma/schema.prisma` e adicionar DEPOIS do model `ClickLog` (apos a linha 211):

```prisma
// ─── Page Views (Analytics) ─────────────────────────────────────────────────

enum PageType {
  RANKING
  PRODUCT
  CATEGORY
}

enum DeviceType {
  DESKTOP
  MOBILE
  TABLET
}

model PageView {
  id          String     @id @default(cuid())
  path        String     @db.VarChar(500)
  pageType    PageType
  slug        String     @db.VarChar(200)
  visitorId   String     @db.VarChar(36)
  referrer    String?    @db.VarChar(2000)
  utmSource   String?    @db.VarChar(200)
  utmMedium   String?    @db.VarChar(200)
  utmCampaign String?    @db.VarChar(200)
  deviceType  DeviceType @default(DESKTOP)
  createdAt   DateTime   @default(now())

  @@index([createdAt])
  @@index([slug, pageType])
  @@index([visitorId])
}
```

- [ ] **Step 2: Gerar migration**

Run: `npx prisma migrate dev --name add-pageview-analytics`
Expected: Migration criada e aplicada com sucesso. Output contem "Your database is now in sync with your schema."

- [ ] **Step 3: Verificar que o Prisma Client foi regenerado**

Run: `npx prisma generate`
Expected: "Generated Prisma Client" sem erros.

- [ ] **Step 4: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat(analytics): add PageView model with PageType and DeviceType enums"
```

---

### Task 2: Utilitario de cookie — lib/visitor-cookie.ts

**Files:**
- Create: `lib/visitor-cookie.ts`

- [ ] **Step 1: Criar o utilitario**

Criar `lib/visitor-cookie.ts`:

```typescript
/**
 * Gera ou le o visitorId do cookie "bs-vid".
 * Cookie first-party analitico — UUID anonimo para agrupar page views por visitante.
 * Sem dados pessoais, sem compartilhamento com terceiros.
 */

const COOKIE_NAME = "bs-vid";
const MAX_AGE = 60 * 60 * 24 * 365; // 1 ano em segundos

export function getOrCreateVisitorId(): string {
  if (typeof document === "undefined") return "";

  // Tenta ler cookie existente
  const match = document.cookie.match(new RegExp(`(?:^|; )${COOKIE_NAME}=([^;]*)`));
  if (match) return decodeURIComponent(match[1]);

  // Gera novo UUID
  const id = crypto.randomUUID();
  document.cookie = `${COOKIE_NAME}=${id}; path=/; max-age=${MAX_AGE}; SameSite=Lax`;
  return id;
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/visitor-cookie.ts
git commit -m "feat(analytics): add visitor cookie utility (bs-vid)"
```

---

### Task 3: Componente PageViewTracker

**Files:**
- Create: `components/public/PageViewTracker.tsx`

- [ ] **Step 1: Criar o componente**

Criar `components/public/PageViewTracker.tsx`:

```tsx
"use client";

import { useEffect } from "react";
import { getOrCreateVisitorId } from "@/lib/visitor-cookie";

interface Props {
  pageType: "RANKING" | "PRODUCT" | "CATEGORY";
  slug: string;
}

function detectDeviceType(): "DESKTOP" | "MOBILE" | "TABLET" {
  const ua = navigator.userAgent;
  if (/Tablet|iPad/i.test(ua)) return "TABLET";
  if (/Mobi|Android/i.test(ua)) return "MOBILE";
  return "DESKTOP";
}

function getUtmParam(params: URLSearchParams, key: string): string | null {
  const val = params.get(key);
  return val && val.trim() ? val.trim() : null;
}

export function PageViewTracker({ pageType, slug }: Props) {
  useEffect(() => {
    const visitorId = getOrCreateVisitorId();
    if (!visitorId) return;

    const params = new URLSearchParams(window.location.search);

    fetch("/api/pageviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path: window.location.pathname,
        pageType,
        slug,
        visitorId,
        referrer: document.referrer || null,
        utmSource: getUtmParam(params, "utm_source"),
        utmMedium: getUtmParam(params, "utm_medium"),
        utmCampaign: getUtmParam(params, "utm_campaign"),
        deviceType: detectDeviceType(),
      }),
    }).catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}
```

- [ ] **Step 2: Commit**

```bash
git add components/public/PageViewTracker.tsx
git commit -m "feat(analytics): add PageViewTracker client component"
```

---

### Task 4: Endpoint POST /api/pageviews

**Files:**
- Create: `app/api/pageviews/route.ts`

- [ ] **Step 1: Criar o endpoint**

Criar `app/api/pageviews/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

const VALID_PAGE_TYPES = ["RANKING", "PRODUCT", "CATEGORY"] as const;
const VALID_DEVICE_TYPES = ["DESKTOP", "MOBILE", "TABLET"] as const;

/**
 * POST /api/pageviews — registra page view.
 * Endpoint publico (fire-and-forget do lado do cliente).
 * Mesmo padrao do POST /api/clicks.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const pageType = VALID_PAGE_TYPES.includes(body.pageType) ? body.pageType : null;
    if (!pageType) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    const deviceType = VALID_DEVICE_TYPES.includes(body.deviceType)
      ? body.deviceType
      : "DESKTOP";

    const path = typeof body.path === "string" ? body.path.slice(0, 500) : "";
    const slug = typeof body.slug === "string" ? body.slug.slice(0, 200) : "";
    const visitorId = typeof body.visitorId === "string" ? body.visitorId.slice(0, 36) : "";

    if (!path || !slug || !visitorId) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    const referrer = typeof body.referrer === "string" ? body.referrer.slice(0, 2000) : null;
    const utmSource = typeof body.utmSource === "string" ? body.utmSource.slice(0, 200) : null;
    const utmMedium = typeof body.utmMedium === "string" ? body.utmMedium.slice(0, 200) : null;
    const utmCampaign = typeof body.utmCampaign === "string" ? body.utmCampaign.slice(0, 200) : null;

    await db.pageView.create({
      data: {
        path,
        pageType,
        slug,
        visitorId,
        referrer,
        utmSource,
        utmMedium,
        utmCampaign,
        deviceType,
      },
    });

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
```

- [ ] **Step 2: Verificar que compila**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: sem erros relacionados a `app/api/pageviews/route.ts`

- [ ] **Step 3: Commit**

```bash
git add app/api/pageviews/route.ts
git commit -m "feat(analytics): add POST /api/pageviews endpoint"
```

---

### Task 5: Inserir PageViewTracker nas 3 paginas-alvo

**Files:**
- Modify: `app/(public)/ranking/[slug]/page.tsx`
- Modify: `app/(public)/produto/[slug]/page.tsx`
- Modify: `app/(public)/categorias/[slug]/page.tsx`

- [ ] **Step 1: Adicionar ao ranking page**

Em `app/(public)/ranking/[slug]/page.tsx`:

Adicionar import no topo (junto com os outros imports):
```typescript
import { PageViewTracker } from "@/components/public/PageViewTracker";
```

Adicionar o componente como primeiro filho dentro do `<article>`, ANTES dos `<script>` de JSON-LD (linha ~124):
```tsx
  return (
    <article className="bg-gray-50">
      <PageViewTracker pageType="RANKING" slug={slug} />
      <script
        type="application/ld+json"
```

- [ ] **Step 2: Adicionar ao produto page**

Em `app/(public)/produto/[slug]/page.tsx`:

Adicionar import no topo:
```typescript
import { PageViewTracker } from "@/components/public/PageViewTracker";
```

Adicionar o componente como primeiro filho dentro da `<div className="bg-gray-50 min-h-screen">` (linha ~250):
```tsx
  return (
    <div className="bg-gray-50 min-h-screen">
      <PageViewTracker pageType="PRODUCT" slug={slug} />
      <script
        type="application/ld+json"
```

- [ ] **Step 3: Adicionar a categoria page**

Em `app/(public)/categorias/[slug]/page.tsx`:

Adicionar import no topo:
```typescript
import { PageViewTracker } from "@/components/public/PageViewTracker";
```

Adicionar o componente como primeiro filho dentro da `<div className="bg-gray-50 min-h-screen">` (linha ~107):
```tsx
  return (
    <div className="bg-gray-50 min-h-screen">
      <PageViewTracker pageType="CATEGORY" slug={slug} />
      <script
        type="application/ld+json"
```

- [ ] **Step 4: Verificar que compila**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: sem erros

- [ ] **Step 5: Commit**

```bash
git add app/(public)/ranking/[slug]/page.tsx app/(public)/produto/[slug]/page.tsx app/(public)/categorias/[slug]/page.tsx
git commit -m "feat(analytics): add PageViewTracker to ranking, product, and category pages"
```

---

### Task 6: Modulo de queries — lib/analytics.ts

**Files:**
- Create: `lib/analytics.ts`

- [ ] **Step 1: Criar o modulo de queries**

Criar `lib/analytics.ts`:

```typescript
import { db } from "@/lib/db";

// ─── Tipos de retorno ────────────────────────────────────────────────────────

interface PeriodCounts {
  today: number;
  week: number;
  month: number;
}

interface DayStat {
  day: string;      // "DD/MM"
  views: number;
  clicks: number;
}

interface PageStat {
  slug: string;
  pageType: string;
  views: number;
  uniqueVisitors: number;
  clicks: number;
  conversionRate: number;
}

interface ReferrerStat {
  referrer: string;
  count: number;
}

interface DeviceStat {
  deviceType: string;
  count: number;
  percentage: number;
}

interface CampaignStat {
  source: string;
  medium: string;
  campaign: string;
  views: number;
}

interface ConversionStat {
  views: number;
  clicks: number;
  rate: number;
}

// ─── Queries ─────────────────────────────────────────────────────────────────

export async function getPageViewCounts(
  startOfToday: Date,
  start7d: Date,
  start30d: Date
): Promise<PeriodCounts> {
  const [today, week, month] = await Promise.all([
    db.pageView.count({ where: { createdAt: { gte: startOfToday } } }),
    db.pageView.count({ where: { createdAt: { gte: start7d } } }),
    db.pageView.count({ where: { createdAt: { gte: start30d } } }),
  ]);
  return { today, week, month };
}

export async function getUniqueVisitorCounts(
  startOfToday: Date,
  start7d: Date,
  start30d: Date
): Promise<PeriodCounts> {
  const [todayRows, weekRows, monthRows] = await Promise.all([
    db.pageView.groupBy({
      by: ["visitorId"],
      where: { createdAt: { gte: startOfToday } },
    }),
    db.pageView.groupBy({
      by: ["visitorId"],
      where: { createdAt: { gte: start7d } },
    }),
    db.pageView.groupBy({
      by: ["visitorId"],
      where: { createdAt: { gte: start30d } },
    }),
  ]);
  return {
    today: todayRows.length,
    week: weekRows.length,
    month: monthRows.length,
  };
}

export async function getViewsAndClicksByDay(
  start30d: Date
): Promise<DayStat[]> {
  const [viewsByDay, clicksByDay] = await Promise.all([
    db.$queryRaw<{ day: string; count: bigint }[]>`
      SELECT DATE("createdAt") as day, COUNT(*)::bigint as count
      FROM "PageView"
      WHERE "createdAt" >= ${start30d}
      GROUP BY DATE("createdAt")
      ORDER BY day DESC
    `,
    db.$queryRaw<{ day: string; count: bigint }[]>`
      SELECT DATE("createdAt") as day, COUNT(*)::bigint as count
      FROM "ClickLog"
      WHERE "createdAt" >= ${start30d}
      GROUP BY DATE("createdAt")
      ORDER BY day DESC
    `,
  ]);

  // Merge por dia
  const dayMap = new Map<string, DayStat>();

  for (const row of viewsByDay) {
    const key = new Date(row.day).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
    });
    dayMap.set(key, { day: key, views: Number(row.count), clicks: 0 });
  }

  for (const row of clicksByDay) {
    const key = new Date(row.day).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
    });
    const existing = dayMap.get(key);
    if (existing) {
      existing.clicks = Number(row.count);
    } else {
      dayMap.set(key, { day: key, views: 0, clicks: Number(row.count) });
    }
  }

  return [...dayMap.values()].sort((a, b) => {
    // Ordena por data decrescente (DD/MM → comparacao reversa)
    const [dA, mA] = a.day.split("/").map(Number);
    const [dB, mB] = b.day.split("/").map(Number);
    return mB - mA || dB - dA;
  });
}

export async function getTopPages(start30d: Date): Promise<PageStat[]> {
  // Views agrupadas por slug+pageType
  const viewGroups = await db.pageView.groupBy({
    by: ["slug", "pageType"],
    _count: { id: true },
    where: { createdAt: { gte: start30d } },
    orderBy: { _count: { id: "desc" } },
  });

  // Visitantes unicos por slug+pageType
  const uniqueVisitorRows = await db.$queryRaw<
    { slug: string; pageType: string; unique_visitors: bigint }[]
  >`
    SELECT slug, "pageType"::text as "pageType", COUNT(DISTINCT "visitorId")::bigint as unique_visitors
    FROM "PageView"
    WHERE "createdAt" >= ${start30d}
    GROUP BY slug, "pageType"
  `;
  const uniqueMap = new Map<string, number>();
  for (const row of uniqueVisitorRows) {
    uniqueMap.set(`${row.pageType}:${row.slug}`, Number(row.unique_visitors));
  }

  // Para paginas de PRODUCT, cliques sao diretos (ClickLog tem productId).
  // Para RANKING, precisamos somar cliques dos produtos pertencentes ao ranking.
  // Para CATEGORY, somamos cliques de todos os produtos daquela categoria.

  // Cliques por produto (ultimos 30d)
  const clicksByProduct = await db.clickLog.groupBy({
    by: ["productId"],
    _count: { id: true },
    where: { createdAt: { gte: start30d }, productId: { not: null } },
  });
  const productClickMap = new Map<string, number>();
  for (const row of clicksByProduct) {
    if (row.productId) {
      productClickMap.set(row.productId, row._count.id);
    }
  }

  // Buscar slugs de produtos para mapear slug → productId
  const productSlugs = viewGroups
    .filter((g) => g.pageType === "PRODUCT")
    .map((g) => g.slug);
  const productsForSlugs = productSlugs.length > 0
    ? await db.product.findMany({
        where: { slug: { in: productSlugs } },
        select: { id: true, slug: true },
      })
    : [];
  const slugToProductId = new Map<string, string>();
  for (const p of productsForSlugs) {
    slugToProductId.set(p.slug, p.id);
  }

  // Buscar slugs de rankings para mapear ranking → productIds
  const rankingSlugs = viewGroups
    .filter((g) => g.pageType === "RANKING")
    .map((g) => g.slug);
  const rankingsForSlugs = rankingSlugs.length > 0
    ? await db.ranking.findMany({
        where: { slug: { in: rankingSlugs } },
        select: { slug: true, items: { select: { productId: true } } },
      })
    : [];
  const rankingToProductIds = new Map<string, string[]>();
  for (const r of rankingsForSlugs) {
    rankingToProductIds.set(r.slug, r.items.map((i) => i.productId));
  }

  // Buscar slugs de categorias para mapear categoria → productIds
  const categorySlugs = viewGroups
    .filter((g) => g.pageType === "CATEGORY")
    .map((g) => g.slug);
  const categoriesForSlugs = categorySlugs.length > 0
    ? await db.category.findMany({
        where: { slug: { in: categorySlugs } },
        select: { slug: true, products: { select: { id: true } } },
      })
    : [];
  const categoryToProductIds = new Map<string, string[]>();
  for (const c of categoriesForSlugs) {
    categoryToProductIds.set(c.slug, c.products.map((p) => p.id));
  }

  // Montar resultado
  const results: PageStat[] = viewGroups.map((group) => {
    const views = group._count.id;
    const uniqueVisitors = uniqueMap.get(`${group.pageType}:${group.slug}`) ?? 0;

    let clicks = 0;
    if (group.pageType === "PRODUCT") {
      const productId = slugToProductId.get(group.slug);
      clicks = productId ? (productClickMap.get(productId) ?? 0) : 0;
    } else if (group.pageType === "RANKING") {
      const productIds = rankingToProductIds.get(group.slug) ?? [];
      clicks = productIds.reduce((sum, pid) => sum + (productClickMap.get(pid) ?? 0), 0);
    } else if (group.pageType === "CATEGORY") {
      const productIds = categoryToProductIds.get(group.slug) ?? [];
      clicks = productIds.reduce((sum, pid) => sum + (productClickMap.get(pid) ?? 0), 0);
    }

    const conversionRate = views > 0 ? (clicks / views) * 100 : 0;

    return {
      slug: group.slug,
      pageType: group.pageType,
      views,
      uniqueVisitors,
      clicks,
      conversionRate,
    };
  });

  return results;
}

export async function getTopReferrers(start30d: Date): Promise<ReferrerStat[]> {
  const rows = await db.pageView.groupBy({
    by: ["referrer"],
    _count: { id: true },
    where: { createdAt: { gte: start30d } },
    orderBy: { _count: { id: "desc" } },
    take: 20,
  });

  return rows.map((row) => {
    let label = "Acesso direto";
    if (row.referrer) {
      try {
        label = new URL(row.referrer).hostname;
      } catch {
        label = row.referrer.slice(0, 50);
      }
    }
    return { referrer: label, count: row._count.id };
  });
}

export async function getDeviceDistribution(start30d: Date): Promise<DeviceStat[]> {
  const rows = await db.pageView.groupBy({
    by: ["deviceType"],
    _count: { id: true },
    where: { createdAt: { gte: start30d } },
    orderBy: { _count: { id: "desc" } },
  });

  const total = rows.reduce((sum, r) => sum + r._count.id, 0) || 1;

  return rows.map((row) => ({
    deviceType: row.deviceType,
    count: row._count.id,
    percentage: Math.round((row._count.id / total) * 100),
  }));
}

export async function getTopCampaigns(start30d: Date): Promise<CampaignStat[]> {
  const rows = await db.pageView.groupBy({
    by: ["utmSource", "utmMedium", "utmCampaign"],
    _count: { id: true },
    where: {
      createdAt: { gte: start30d },
      utmSource: { not: null },
    },
    orderBy: { _count: { id: "desc" } },
    take: 20,
  });

  return rows.map((row) => ({
    source: row.utmSource ?? "",
    medium: row.utmMedium ?? "",
    campaign: row.utmCampaign ?? "",
    views: row._count.id,
  }));
}

export async function getOverallConversion(start30d: Date): Promise<ConversionStat> {
  const [views, clicks] = await Promise.all([
    db.pageView.count({ where: { createdAt: { gte: start30d } } }),
    db.clickLog.count({ where: { createdAt: { gte: start30d } } }),
  ]);

  return {
    views,
    clicks,
    rate: views > 0 ? (clicks / views) * 100 : 0,
  };
}
```

- [ ] **Step 2: Verificar que compila**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: sem erros

- [ ] **Step 3: Commit**

```bash
git add lib/analytics.ts
git commit -m "feat(analytics): add centralized analytics query module"
```

---

### Task 7: Atualizar dashboard existente — cards de views + conversao

**Files:**
- Modify: `app/admin/(dashboard)/page.tsx`

- [ ] **Step 1: Adicionar imports e queries de page views**

Em `app/admin/(dashboard)/page.tsx`, adicionar import no topo:
```typescript
import { getOverallConversion } from "@/lib/analytics";
```

Dentro da funcao `AdminDashboard`, adicionar ao `Promise.all` existente (que ja tem 10 itens) mais 4 queries:
```typescript
  const [
    rankings,
    products,
    categories,
    pendingRankings,
    pendingProducts,
    clicksToday,
    clicks7d,
    clicks30d,
    clicksByProduct,
    clicksByDay,
    viewsToday,
    views7d,
    views30d,
    conversion30d,
  ] = await Promise.all([
    db.ranking.count(),
    db.product.count(),
    db.category.count(),
    db.ranking.count({ where: { status: "DRAFT" } }),
    db.product.count({ where: { status: "DRAFT" } }),
    db.clickLog.count({ where: { createdAt: { gte: startOfToday } } }),
    db.clickLog.count({ where: { createdAt: { gte: start7d } } }),
    db.clickLog.count({ where: { createdAt: { gte: start30d } } }),
    db.clickLog.groupBy({
      by: ["productName", "productId", "platform"],
      _count: { id: true },
      where: { createdAt: { gte: start30d } },
      orderBy: { _count: { id: "desc" } },
    }),
    db.$queryRaw<{ day: string; count: bigint }[]>`
      SELECT DATE("createdAt") as day, COUNT(*)::bigint as count
      FROM "ClickLog"
      WHERE "createdAt" >= ${start30d}
      GROUP BY DATE("createdAt")
      ORDER BY day DESC
    `,
    db.pageView.count({ where: { createdAt: { gte: startOfToday } } }),
    db.pageView.count({ where: { createdAt: { gte: start7d } } }),
    db.pageView.count({ where: { createdAt: { gte: start30d } } }),
    getOverallConversion(start30d),
  ]);
```

- [ ] **Step 2: Adicionar arrays de stats de views**

Depois da definicao de `clickStats`, adicionar:
```typescript
  const viewStats = [
    { label: "Views hoje", value: viewsToday },
    { label: "Últimos 7 dias", value: views7d },
    { label: "Últimos 30 dias", value: views30d },
  ];
```

- [ ] **Step 3: Adicionar secao de Page Views na UI**

No JSX, DEPOIS da secao "Cards de conteudo" e ANTES da secao "Cards de cliques" (antes do `<h2>` "Cliques em Links de Afiliado"), adicionar:

```tsx
      {/* Cards de page views */}
      <h2 className="text-lg font-bold text-gray-900 mb-4">Page Views</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        {viewStats.map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-6">
            <p className="text-sm text-gray-500">{s.label}</p>
            <p className="text-3xl font-bold text-blue-600 mt-1">{s.value}</p>
          </div>
        ))}
      </div>
```

- [ ] **Step 4: Adicionar card de conversao junto aos cliques**

Alterar a secao de cliques para incluir o card de conversao. Mudar o grid de `sm:grid-cols-3` para `sm:grid-cols-4` e adicionar o card:

```tsx
      {/* Cards de cliques */}
      <h2 className="text-lg font-bold text-gray-900 mb-4">Cliques em Links de Afiliado</h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mb-8">
        {clickStats.map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-6">
            <p className="text-sm text-gray-500">{s.label}</p>
            <p className="text-3xl font-bold text-green-600 mt-1">{s.value}</p>
          </div>
        ))}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <p className="text-sm text-gray-500">Conversão (30d)</p>
          <p className="text-3xl font-bold text-amber-600 mt-1">
            {conversion30d.rate.toFixed(1)}%
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {conversion30d.clicks} cliques / {conversion30d.views} views
          </p>
        </div>
      </div>
```

- [ ] **Step 5: Adicionar link para analytics completo**

Antes da secao "Acoes rapidas", adicionar um link:

```tsx
      {/* Link para analytics completo */}
      <div className="mb-8 text-right">
        <Link
          href="/admin/analytics"
          className="text-sm text-blue-600 hover:text-blue-800 font-semibold hover:underline"
        >
          Ver analytics completo →
        </Link>
      </div>
```

- [ ] **Step 6: Verificar que compila**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: sem erros

- [ ] **Step 7: Commit**

```bash
git add app/admin/(dashboard)/page.tsx
git commit -m "feat(analytics): add page views and conversion cards to admin dashboard"
```

---

### Task 8: Pagina dedicada /admin/analytics

**Files:**
- Create: `app/admin/analytics/page.tsx`

- [ ] **Step 1: Criar a pagina**

Criar `app/admin/analytics/page.tsx`:

```tsx
import Link from "next/link";
import { PageHeader } from "@/components/admin/PageHeader";
import {
  getPageViewCounts,
  getUniqueVisitorCounts,
  getViewsAndClicksByDay,
  getTopPages,
  getTopReferrers,
  getDeviceDistribution,
  getTopCampaigns,
  getOverallConversion,
} from "@/lib/analytics";

import type { Metadata } from "next";

export const metadata: Metadata = { title: "Analytics — Admin" };

export const dynamic = "force-dynamic";

const PAGE_TYPE_LABELS: Record<string, { label: string; color: string }> = {
  RANKING: { label: "Ranking", color: "bg-blue-100 text-blue-700" },
  PRODUCT: { label: "Produto", color: "bg-green-100 text-green-700" },
  CATEGORY: { label: "Categoria", color: "bg-purple-100 text-purple-700" },
};

const DEVICE_LABELS: Record<string, string> = {
  DESKTOP: "Desktop",
  MOBILE: "Mobile",
  TABLET: "Tablet",
};

export default async function AnalyticsPage() {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const start7d = new Date(startOfToday.getTime() - 6 * 86_400_000);
  const start30d = new Date(startOfToday.getTime() - 29 * 86_400_000);

  const [
    viewCounts,
    uniqueVisitors,
    dailyStats,
    topPages,
    topReferrers,
    devices,
    campaigns,
    conversion,
  ] = await Promise.all([
    getPageViewCounts(startOfToday, start7d, start30d),
    getUniqueVisitorCounts(startOfToday, start7d, start30d),
    getViewsAndClicksByDay(start30d),
    getTopPages(start30d),
    getTopReferrers(start30d),
    getDeviceDistribution(start30d),
    getTopCampaigns(start30d),
    getOverallConversion(start30d),
  ]);

  const maxDayViews = Math.max(...dailyStats.map((d) => d.views), 1);
  const maxDayClicks = Math.max(...dailyStats.map((d) => d.clicks), 1);
  const maxDayTotal = Math.max(...dailyStats.map((d) => d.views + d.clicks), 1);
  const maxPageViews = topPages[0]?.views || 1;
  const maxReferrerCount = topReferrers[0]?.count || 1;

  const overviewCards = [
    { label: "Views (30d)", value: viewCounts.month, color: "text-blue-600" },
    { label: "Visitantes únicos (30d)", value: uniqueVisitors.month, color: "text-indigo-600" },
    { label: "Cliques (30d)", value: conversion.clicks, color: "text-green-600" },
    {
      label: "Conversão (30d)",
      value: `${conversion.rate.toFixed(1)}%`,
      color: "text-amber-600",
    },
  ];

  return (
    <div>
      <PageHeader
        title="Analytics"
        description="Page views, conversão, referrers e campanhas"
      />

      {/* Visao geral */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mb-8">
        {overviewCards.map((card) => (
          <div key={card.label} className="bg-white rounded-xl border border-gray-200 p-6">
            <p className="text-sm text-gray-500">{card.label}</p>
            <p className={`text-3xl font-bold mt-1 ${card.color}`}>{card.value}</p>
          </div>
        ))}
      </div>

      {/* Grafico diario: Views vs Cliques */}
      {dailyStats.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
          <h2 className="text-sm font-semibold text-gray-900 mb-1">
            Views vs Cliques por Dia (últimos 30 dias)
          </h2>
          <div className="flex gap-4 text-xs text-gray-500 mb-4">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-blue-500 inline-block" /> Views
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-green-500 inline-block" /> Cliques
            </span>
          </div>
          <div className="space-y-2">
            {dailyStats.map((d) => (
              <div key={d.day} className="flex items-center gap-3">
                <span className="text-xs text-gray-500 w-12 shrink-0">{d.day}</span>
                <div className="flex-1 flex flex-col gap-1">
                  <div className="bg-gray-100 rounded-full h-4 overflow-hidden">
                    <div
                      className="bg-blue-500 h-4 rounded-full"
                      style={{ width: `${(d.views / maxDayTotal) * 100}%` }}
                    />
                  </div>
                  <div className="bg-gray-100 rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-green-500 h-3 rounded-full"
                      style={{ width: `${(d.clicks / maxDayTotal) * 100}%` }}
                    />
                  </div>
                </div>
                <div className="text-right shrink-0 w-20">
                  <span className="text-xs text-blue-600 font-medium">{d.views}v</span>
                  {" "}
                  <span className="text-xs text-green-600 font-medium">{d.clicks}c</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top paginas */}
      {topPages.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">
            Top Páginas (últimos 30 dias) — {topPages.length} páginas
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left">
                  <th className="pb-2 text-gray-500 font-medium">#</th>
                  <th className="pb-2 text-gray-500 font-medium">Página</th>
                  <th className="pb-2 text-gray-500 font-medium">Tipo</th>
                  <th className="pb-2 text-gray-500 font-medium text-right">Views</th>
                  <th className="pb-2 text-gray-500 font-medium text-right">Únicos</th>
                  <th className="pb-2 text-gray-500 font-medium text-right">Cliques</th>
                  <th className="pb-2 text-gray-500 font-medium text-right">Conv. %</th>
                  <th className="pb-2 text-gray-500 font-medium w-36"></th>
                </tr>
              </thead>
              <tbody>
                {topPages.map((page, i) => {
                  const typeConfig = PAGE_TYPE_LABELS[page.pageType] || {
                    label: page.pageType,
                    color: "bg-gray-100 text-gray-700",
                  };
                  const pageHref =
                    page.pageType === "RANKING"
                      ? `/ranking/${page.slug}`
                      : page.pageType === "PRODUCT"
                        ? `/produto/${page.slug}`
                        : `/categorias/${page.slug}`;
                  return (
                    <tr key={`${page.pageType}-${page.slug}`} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-2 text-gray-400">{i + 1}</td>
                      <td className="py-2 text-gray-900 font-medium max-w-xs truncate">
                        <Link href={pageHref} className="hover:text-blue-600 hover:underline" target="_blank">
                          {page.slug}
                        </Link>
                      </td>
                      <td className="py-2">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${typeConfig.color}`}>
                          {typeConfig.label}
                        </span>
                      </td>
                      <td className="py-2 text-right font-bold text-gray-900">{page.views}</td>
                      <td className="py-2 text-right text-gray-600">{page.uniqueVisitors}</td>
                      <td className="py-2 text-right text-green-600 font-medium">{page.clicks}</td>
                      <td className="py-2 text-right text-amber-600 font-medium">
                        {page.conversionRate.toFixed(1)}%
                      </td>
                      <td className="py-2 pl-3">
                        <div className="bg-gray-100 rounded-full h-4 overflow-hidden">
                          <div
                            className="bg-blue-500 h-4 rounded-full"
                            style={{ width: `${(page.views / maxPageViews) * 100}%` }}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Top referrers + Dispositivos — lado a lado */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Referrers */}
        {topReferrers.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Top Referrers (30 dias)</h2>
            <div className="space-y-2">
              {topReferrers.map((ref, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 w-5 shrink-0">{i + 1}</span>
                  <span className="text-sm text-gray-800 flex-1 truncate">{ref.referrer}</span>
                  <div className="w-24 bg-gray-100 rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-indigo-500 h-3 rounded-full"
                      style={{ width: `${(ref.count / maxReferrerCount) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-700 w-10 text-right">{ref.count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Dispositivos */}
        {devices.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Dispositivos (30 dias)</h2>
            <div className="space-y-4">
              {devices.map((dev) => (
                <div key={dev.deviceType}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-800 font-medium">
                      {DEVICE_LABELS[dev.deviceType] || dev.deviceType}
                    </span>
                    <span className="text-gray-500">
                      {dev.count} ({dev.percentage}%)
                    </span>
                  </div>
                  <div className="bg-gray-100 rounded-full h-5 overflow-hidden">
                    <div
                      className="bg-purple-500 h-5 rounded-full"
                      style={{ width: `${dev.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Campanhas UTM */}
      {campaigns.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Campanhas UTM (30 dias)</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left">
                  <th className="pb-2 text-gray-500 font-medium">Source</th>
                  <th className="pb-2 text-gray-500 font-medium">Medium</th>
                  <th className="pb-2 text-gray-500 font-medium">Campaign</th>
                  <th className="pb-2 text-gray-500 font-medium text-right">Views</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((c, i) => (
                  <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-2 text-gray-900 font-medium">{c.source}</td>
                    <td className="py-2 text-gray-600">{c.medium || "—"}</td>
                    <td className="py-2 text-gray-600">{c.campaign || "—"}</td>
                    <td className="py-2 text-right font-bold text-gray-900">{c.views}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Sem dados */}
      {topPages.length === 0 && dailyStats.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8 text-center text-gray-400">
          <p>Nenhum page view registrado ainda. Os dados aparecem aqui assim que visitantes acessarem rankings, produtos ou categorias.</p>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verificar que compila**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: sem erros

- [ ] **Step 3: Commit**

```bash
git add app/admin/analytics/page.tsx
git commit -m "feat(analytics): add dedicated /admin/analytics page"
```

---

### Task 9: Adicionar link "Analytics" na sidebar do admin

**Files:**
- Modify: `components/admin/AdminSidebar.tsx`

- [ ] **Step 1: Adicionar item Analytics ao array navItems**

Em `components/admin/AdminSidebar.tsx`, adicionar o item "Analytics" ao array `navItems`, logo depois do item "Dashboard":

```typescript
const navItems = [
  { href: "/admin", label: "Dashboard", icon: "🏠" },
  { href: "/admin/analytics", label: "Analytics", icon: "📊" },
  { href: "/admin/rankings", label: "Rankings", icon: "🏆" },
  { href: "/admin/listaconfigurar", label: "Configurar Produtos", icon: "🔧" },
  { href: "/admin/produtos", label: "Produtos", icon: "📦" },
  { href: "/admin/categorias", label: "Categorias", icon: "🗂️" },
  { href: "/admin/banners", label: "Banners", icon: "🖼️" },
  { href: "/admin/paginas", label: "Páginas", icon: "📄" },
  { href: "/admin/linksmanuais", label: "Links Manuais", icon: "🔗" },
  { href: "/admin/configuracoes", label: "Configurações", icon: "⚙️" },
];
```

- [ ] **Step 2: Commit**

```bash
git add components/admin/AdminSidebar.tsx
git commit -m "feat(analytics): add Analytics link to admin sidebar"
```

---

### Task 10: Build final e teste manual

- [ ] **Step 1: Verificar que o projeto compila sem erros**

Run: `npx tsc --noEmit --pretty`
Expected: sem erros

- [ ] **Step 2: Rodar o dev server e testar**

Run: `npm run dev`

Testar no navegador:

1. Acesse uma pagina de ranking (ex: `http://localhost:3000/ranking/top10-air-fryer`)
   - Abra o DevTools → Network → procure uma request POST para `/api/pageviews` com status 201
   - Verifique nos cookies do navegador que `bs-vid` foi criado com um UUID

2. Acesse uma pagina de produto (ex: `http://localhost:3000/produto/nome-do-produto`)
   - Confirme outro POST para `/api/pageviews` com status 201

3. Acesse uma pagina de categoria (ex: `http://localhost:3000/categorias/cozinha`)
   - Confirme outro POST para `/api/pageviews` com status 201

4. Acesse o dashboard admin (`http://localhost:3000/admin`)
   - Confirme que os novos cards "Page Views" aparecem (com os numeros dos acessos que voce fez)
   - Confirme que o card "Conversao (30d)" aparece
   - Confirme que o link "Ver analytics completo →" aparece

5. Clique em "Ver analytics completo →" ou acesse `http://localhost:3000/admin/analytics`
   - Confirme que a pagina carrega com todas as secoes
   - Confirme que os dados que voce gerou nos passos 1-3 aparecem

6. Verifique a sidebar do admin — "Analytics" com icone 📊 deve aparecer como segundo item

- [ ] **Step 3: Commit final se houver ajustes**

Se algum ajuste foi necessario durante o teste, commitar.
