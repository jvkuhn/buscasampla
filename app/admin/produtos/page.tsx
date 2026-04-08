import Link from "next/link";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/admin/PageHeader";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { deleteProduct } from "@/lib/actions/products";
import { formatPrice } from "@/lib/utils";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Produtos — Admin" };

const BADGE_LABELS: Record<string, string> = {
  BEST_VALUE: "Custo-benefício",
  BEST_SELLER: "Mais vendido",
  PREMIUM: "Premium",
  CHEAPEST: "Mais barato",
};

export default async function ProductsPage() {
  const products = await db.product.findMany({
    orderBy: { createdAt: "desc" },
    include: { category: { select: { name: true } } },
  });

  return (
    <div>
      <PageHeader
        title="Produtos"
        action={{ href: "/admin/produtos/novo", label: "+ Novo produto" }}
      />

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Produto</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Categoria</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Preço</th>
              <th className="px-4 py-3 text-center font-medium text-gray-600">Nota</th>
              <th className="px-4 py-3 text-center font-medium text-gray-600">Status</th>
              <th className="px-4 py-3 text-right font-medium text-gray-600">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {products.map((p) => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-900">{p.name}</div>
                  {p.badge && (
                    <span className="text-xs text-blue-600 font-medium">
                      {BADGE_LABELS[p.badge]}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs">{p.category?.name ?? "—"}</td>
                <td className="px-4 py-3 text-gray-700">
                  {p.currentPrice ? formatPrice(Number(p.currentPrice)) : "—"}
                </td>
                <td className="px-4 py-3 text-center text-gray-600">
                  {p.rating ? `${p.rating}/5` : "—"}
                </td>
                <td className="px-4 py-3 text-center">
                  <span
                    className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                      p.status === "PUBLISHED"
                        ? "bg-green-100 text-green-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {p.status === "PUBLISHED" ? "Publicado" : "Rascunho"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right space-x-3">
                  <Link
                    href={`/admin/produtos/${p.id}`}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Editar
                  </Link>
                  <DeleteButton action={deleteProduct} id={p.id} />
                </td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                  Nenhum produto cadastrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
