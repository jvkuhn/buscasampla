import Link from "next/link";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/admin/PageHeader";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Dashboard — Admin" };

export default async function AdminDashboard() {
  const [rankings, products, categories, pendingRankings, pendingProducts] = await Promise.all([
    db.ranking.count(),
    db.product.count(),
    db.category.count(),
    db.ranking.count({ where: { status: "DRAFT" } }),
    db.product.count({ where: { status: "DRAFT" } }),
  ]);

  const stats = [
    { label: "Rankings publicados", value: rankings - pendingRankings, total: rankings, color: "blue" },
    { label: "Produtos publicados", value: products - pendingProducts, total: products, color: "green" },
    { label: "Categorias", value: categories, color: "purple" },
  ];

  return (
    <div>
      <PageHeader title="Dashboard" description="Visão geral do site" />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-6">
            <p className="text-sm text-gray-500">{s.label}</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{s.value}</p>
            {s.total !== undefined && s.total !== s.value && (
              <p className="text-xs text-gray-400 mt-1">{s.total - s.value} rascunhos</p>
            )}
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Ações rápidas</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { href: "/admin/rankings/novo", label: "Novo ranking" },
            { href: "/admin/produtos/novo", label: "Novo produto" },
            { href: "/admin/categorias/nova", label: "Nova categoria" },
            { href: "/admin/banners/novo", label: "Novo banner" },
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
