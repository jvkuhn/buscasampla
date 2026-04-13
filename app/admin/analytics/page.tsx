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
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );
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

  const maxDayTotal = Math.max(
    ...dailyStats.map((d) => d.views + d.clicks),
    1
  );
  const maxPageViews = topPages[0]?.views || 1;
  const maxReferrerCount = topReferrers[0]?.count || 1;

  const overviewCards = [
    { label: "Views (30d)", value: viewCounts.month, color: "text-blue-600" },
    {
      label: "Visitantes únicos (30d)",
      value: uniqueVisitors.month,
      color: "text-indigo-600",
    },
    {
      label: "Cliques (30d)",
      value: conversion.clicks,
      color: "text-green-600",
    },
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
          <div
            key={card.label}
            className="bg-white rounded-xl border border-gray-200 p-6"
          >
            <p className="text-sm text-gray-500">{card.label}</p>
            <p className={`text-3xl font-bold mt-1 ${card.color}`}>
              {card.value}
            </p>
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
              <span className="w-3 h-3 rounded bg-blue-500 inline-block" />{" "}
              Views
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-green-500 inline-block" />{" "}
              Cliques
            </span>
          </div>
          <div className="space-y-2">
            {dailyStats.map((d) => (
              <div key={d.day} className="flex items-center gap-3">
                <span className="text-xs text-gray-500 w-12 shrink-0">
                  {d.day}
                </span>
                <div className="flex-1 flex flex-col gap-1">
                  <div className="bg-gray-100 rounded-full h-4 overflow-hidden">
                    <div
                      className="bg-blue-500 h-4 rounded-full"
                      style={{
                        width: `${(d.views / maxDayTotal) * 100}%`,
                      }}
                    />
                  </div>
                  <div className="bg-gray-100 rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-green-500 h-3 rounded-full"
                      style={{
                        width: `${(d.clicks / maxDayTotal) * 100}%`,
                      }}
                    />
                  </div>
                </div>
                <div className="text-right shrink-0 w-20">
                  <span className="text-xs text-blue-600 font-medium">
                    {d.views}v
                  </span>{" "}
                  <span className="text-xs text-green-600 font-medium">
                    {d.clicks}c
                  </span>
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
                  <th className="pb-2 text-gray-500 font-medium text-right">
                    Views
                  </th>
                  <th className="pb-2 text-gray-500 font-medium text-right">
                    Únicos
                  </th>
                  <th className="pb-2 text-gray-500 font-medium text-right">
                    Cliques
                  </th>
                  <th className="pb-2 text-gray-500 font-medium text-right">
                    Conv. %
                  </th>
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
                    <tr
                      key={`${page.pageType}-${page.slug}`}
                      className="border-b border-gray-50 hover:bg-gray-50"
                    >
                      <td className="py-2 text-gray-400">{i + 1}</td>
                      <td className="py-2 text-gray-900 font-medium max-w-xs truncate">
                        <Link
                          href={pageHref}
                          className="hover:text-blue-600 hover:underline"
                          target="_blank"
                        >
                          {page.slug}
                        </Link>
                      </td>
                      <td className="py-2">
                        <span
                          className={`text-xs font-semibold px-2 py-0.5 rounded-full ${typeConfig.color}`}
                        >
                          {typeConfig.label}
                        </span>
                      </td>
                      <td className="py-2 text-right font-bold text-gray-900">
                        {page.views}
                      </td>
                      <td className="py-2 text-right text-gray-600">
                        {page.uniqueVisitors}
                      </td>
                      <td className="py-2 text-right text-green-600 font-medium">
                        {page.clicks}
                      </td>
                      <td className="py-2 text-right text-amber-600 font-medium">
                        {page.conversionRate.toFixed(1)}%
                      </td>
                      <td className="py-2 pl-3">
                        <div className="bg-gray-100 rounded-full h-4 overflow-hidden">
                          <div
                            className="bg-blue-500 h-4 rounded-full"
                            style={{
                              width: `${(page.views / maxPageViews) * 100}%`,
                            }}
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
            <h2 className="text-sm font-semibold text-gray-900 mb-4">
              Top Referrers (30 dias)
            </h2>
            <div className="space-y-2">
              {topReferrers.map((ref, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 w-5 shrink-0">
                    {i + 1}
                  </span>
                  <span className="text-sm text-gray-800 flex-1 truncate">
                    {ref.referrer}
                  </span>
                  <div className="w-24 bg-gray-100 rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-indigo-500 h-3 rounded-full"
                      style={{
                        width: `${(ref.count / maxReferrerCount) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-700 w-10 text-right">
                    {ref.count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Dispositivos */}
        {devices.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">
              Dispositivos (30 dias)
            </h2>
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
          <h2 className="text-sm font-semibold text-gray-900 mb-4">
            Campanhas UTM (30 dias)
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left">
                  <th className="pb-2 text-gray-500 font-medium">Source</th>
                  <th className="pb-2 text-gray-500 font-medium">Medium</th>
                  <th className="pb-2 text-gray-500 font-medium">Campaign</th>
                  <th className="pb-2 text-gray-500 font-medium text-right">
                    Views
                  </th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((c, i) => (
                  <tr
                    key={i}
                    className="border-b border-gray-50 hover:bg-gray-50"
                  >
                    <td className="py-2 text-gray-900 font-medium">
                      {c.source}
                    </td>
                    <td className="py-2 text-gray-600">{c.medium || "—"}</td>
                    <td className="py-2 text-gray-600">
                      {c.campaign || "—"}
                    </td>
                    <td className="py-2 text-right font-bold text-gray-900">
                      {c.views}
                    </td>
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
          <p>
            Nenhum page view registrado ainda. Os dados aparecem aqui assim que
            visitantes acessarem rankings, produtos ou categorias.
          </p>
        </div>
      )}
    </div>
  );
}
