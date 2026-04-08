import Link from "next/link";
import { db } from "@/lib/db";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Todas as categorias",
  description: "Navegue por todas as categorias de produtos comparados e ranqueados.",
};

export default async function CategoriesIndexPage() {
  const categories = await db.category.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { order: "asc" },
    include: { _count: { select: { rankings: true } } },
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Categorias</h1>
      <p className="text-gray-600 mb-8">Escolha uma categoria para ver os rankings.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((c) => (
          <Link
            key={c.id}
            href={`/categorias/${c.slug}`}
            className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md hover:border-blue-500 transition-all"
          >
            <h2 className="font-semibold text-gray-900">{c.name}</h2>
            {c.description && (
              <p className="text-sm text-gray-500 mt-1 line-clamp-2">{c.description}</p>
            )}
            <p className="text-xs text-blue-600 mt-3 font-medium">
              {c._count.rankings} ranking{c._count.rankings !== 1 ? "s" : ""}
            </p>
          </Link>
        ))}
        {categories.length === 0 && (
          <p className="col-span-full text-center text-gray-400 py-12">
            Nenhuma categoria cadastrada.
          </p>
        )}
      </div>
    </div>
  );
}
