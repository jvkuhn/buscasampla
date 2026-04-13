import Link from "next/link";
import { db } from "@/lib/db";
import { getOverallConversion } from "@/lib/analytics";
import { PageHeader } from "@/components/admin/PageHeader";
import { PLATFORM_DISPLAY } from "@/lib/constants";

import type { Metadata } from "next";

export const metadata: Metadata = { title: "Dashboard — Admin" };

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const start7d = new Date(startOfToday.getTime() - 6 * 86_400_000);
  const start30d = new Date(startOfToday.getTime() - 29 * 86_400_000);

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

  // Agrupa cliques por produto (somando plataformas)
  const productMap = new Map<string, { name: string; total: number; platforms: Record<string, number> }>();
  for (const row of clicksByProduct) {
    const key = row.productId || row.productName;
    const existing = productMap.get(key);
    if (existing) {
      existing.total += row._count.id;
      existing.platforms[row.platform] = (existing.platforms[row.platform] || 0) + row._count.id;
    } else {
      productMap.set(key, {
        name: row.productName,
        total: row._count.id,
        platforms: { [row.platform]: row._count.id },
      });
    }
  }
  const productStats = [...productMap.values()].sort((a, b) => b.total - a.total);
  const maxProductClicks = productStats[0]?.total || 1;

  // Cliques por dia
  const dayStats = clicksByDay.map((r) => ({
    day: new Date(r.day).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
    count: Number(r.count),
  }));
  const maxDayClicks = Math.max(...dayStats.map((d) => d.count), 1);

  const contentStats = [
    { label: "Rankings publicados", value: rankings - pendingRankings, total: rankings, color: "blue" },
    { label: "Produtos publicados", value: products - pendingProducts, total: products, color: "green" },
    { label: "Categorias", value: categories, color: "purple" },
  ];

  const viewStats = [
    { label: "Views hoje", value: viewsToday },
    { label: "Últimos 7 dias", value: views7d },
    { label: "Últimos 30 dias", value: views30d },
  ];

  const clickStats = [
    { label: "Cliques hoje", value: clicksToday },
    { label: "Últimos 7 dias", value: clicks7d },
    { label: "Últimos 30 dias", value: clicks30d },
  ];

  return (
    <div>
      <PageHeader title="Dashboard" description="Visão geral do site" />

      {/* Cards de conteúdo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        {contentStats.map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-6">
            <p className="text-sm text-gray-500">{s.label}</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{s.value}</p>
            {s.total !== undefined && s.total !== s.value && (
              <p className="text-xs text-gray-400 mt-1">{s.total - s.value} rascunhos</p>
            )}
          </div>
        ))}
      </div>

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

      {/* Cliques por dia — últimos 30 dias */}
      {dayStats.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Cliques por Dia (últimos 30 dias)</h2>
          <div className="space-y-2">
            {dayStats.map((d) => (
              <div key={d.day} className="flex items-center gap-3">
                <span className="text-xs text-gray-500 w-12 shrink-0">{d.day}</span>
                <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
                  <div
                    className="bg-green-500 h-6 rounded-full transition-all"
                    style={{ width: `${(d.count / maxDayClicks) * 100}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-gray-700 w-10 text-right">{d.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Todos os produtos */}
      {productStats.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">
            Cliques por Produto (últimos 30 dias) — {productStats.length} produtos
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left">
                  <th className="pb-2 text-gray-500 font-medium">#</th>
                  <th className="pb-2 text-gray-500 font-medium">Produto</th>
                  <th className="pb-2 text-gray-500 font-medium">Plataformas</th>
                  <th className="pb-2 text-gray-500 font-medium text-right">Cliques</th>
                  <th className="pb-2 text-gray-500 font-medium w-48"></th>
                </tr>
              </thead>
              <tbody>
                {productStats.map((p, i) => (
                  <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-2 text-gray-400">{i + 1}</td>
                    <td className="py-2 text-gray-900 font-medium max-w-xs truncate">{p.name}</td>
                    <td className="py-2">
                      <div className="flex gap-1 flex-wrap">
                        {Object.entries(p.platforms)
                          .sort((a, b) => b[1] - a[1])
                          .map(([plat, count]) => (
                            <span
                              key={plat}
                              className="inline-flex items-center text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full"
                            >
                              {PLATFORM_DISPLAY[plat] || plat} ({count})
                            </span>
                          ))}
                      </div>
                    </td>
                    <td className="py-2 text-right font-bold text-gray-900">{p.total}</td>
                    <td className="py-2 pl-3">
                      <div className="bg-gray-100 rounded-full h-4 overflow-hidden">
                        <div
                          className="bg-blue-500 h-4 rounded-full"
                          style={{ width: `${(p.total / maxProductClicks) * 100}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Sem cliques ainda */}
      {productStats.length === 0 && dayStats.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8 text-center text-gray-400">
          <p>Nenhum clique registrado ainda. Os dados aparecem aqui assim que visitantes clicarem nos links de afiliado.</p>
        </div>
      )}

      {/* Link para analytics completo */}
      <div className="mb-8 text-right">
        <Link
          href="/admin/analytics"
          className="text-sm text-blue-600 hover:text-blue-800 font-semibold hover:underline"
        >
          Ver analytics completo →
        </Link>
      </div>

      {/* Ações rápidas */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Ações rápidas</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { href: "/admin/rankings/novo-top10", label: "Importar Top 10" },
            { href: "/admin/rankings/novo", label: "Novo ranking" },
            { href: "/admin/produtos/novo", label: "Novo produto" },
            { href: "/admin/categorias/nova", label: "Nova categoria" },
          ].map((a) => (
            <Link
              key={a.href}
              href={a.href}
              className="flex items-center justify-center py-3 px-4 rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 hover:border-blue-400 transition-colors font-medium"
            >
              {a.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
