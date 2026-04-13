import { db } from "@/lib/db";

// ─── Tipos de retorno ────────────────────────────────────────────────────────

interface PeriodCounts {
  today: number;
  week: number;
  month: number;
}

interface DayStat {
  day: string; // "DD/MM"
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
    const [dA, mA] = a.day.split("/").map(Number);
    const [dB, mB] = b.day.split("/").map(Number);
    return mB - mA || dB - dA;
  });
}

export async function getTopPages(start30d: Date): Promise<PageStat[]> {
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

  // Mapear slugs de produtos → productId
  const productSlugs = viewGroups
    .filter((g) => g.pageType === "PRODUCT")
    .map((g) => g.slug);
  const productsForSlugs =
    productSlugs.length > 0
      ? await db.product.findMany({
          where: { slug: { in: productSlugs } },
          select: { id: true, slug: true },
        })
      : [];
  const slugToProductId = new Map<string, string>();
  for (const p of productsForSlugs) {
    slugToProductId.set(p.slug, p.id);
  }

  // Mapear slugs de rankings → productIds dos itens
  const rankingSlugs = viewGroups
    .filter((g) => g.pageType === "RANKING")
    .map((g) => g.slug);
  const rankingsForSlugs =
    rankingSlugs.length > 0
      ? await db.ranking.findMany({
          where: { slug: { in: rankingSlugs } },
          select: { slug: true, items: { select: { productId: true } } },
        })
      : [];
  const rankingToProductIds = new Map<string, string[]>();
  for (const r of rankingsForSlugs) {
    rankingToProductIds.set(
      r.slug,
      r.items.map((i) => i.productId)
    );
  }

  // Mapear slugs de categorias → productIds
  const categorySlugs = viewGroups
    .filter((g) => g.pageType === "CATEGORY")
    .map((g) => g.slug);
  const categoriesForSlugs =
    categorySlugs.length > 0
      ? await db.category.findMany({
          where: { slug: { in: categorySlugs } },
          select: { slug: true, products: { select: { id: true } } },
        })
      : [];
  const categoryToProductIds = new Map<string, string[]>();
  for (const c of categoriesForSlugs) {
    categoryToProductIds.set(
      c.slug,
      c.products.map((p) => p.id)
    );
  }

  // Montar resultado
  const results: PageStat[] = viewGroups.map((group) => {
    const views = group._count.id;
    const uniqueVisitors =
      uniqueMap.get(`${group.pageType}:${group.slug}`) ?? 0;

    let clicks = 0;
    if (group.pageType === "PRODUCT") {
      const productId = slugToProductId.get(group.slug);
      clicks = productId ? (productClickMap.get(productId) ?? 0) : 0;
    } else if (group.pageType === "RANKING") {
      const productIds = rankingToProductIds.get(group.slug) ?? [];
      clicks = productIds.reduce(
        (sum, pid) => sum + (productClickMap.get(pid) ?? 0),
        0
      );
    } else if (group.pageType === "CATEGORY") {
      const productIds = categoryToProductIds.get(group.slug) ?? [];
      clicks = productIds.reduce(
        (sum, pid) => sum + (productClickMap.get(pid) ?? 0),
        0
      );
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

export async function getTopReferrers(
  start30d: Date
): Promise<ReferrerStat[]> {
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

export async function getDeviceDistribution(
  start30d: Date
): Promise<DeviceStat[]> {
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

export async function getTopCampaigns(
  start30d: Date
): Promise<CampaignStat[]> {
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

export async function getOverallConversion(
  start30d: Date
): Promise<ConversionStat> {
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
