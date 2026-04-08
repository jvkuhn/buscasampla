import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { RankingCard } from "@/components/public/RankingCard";
import type { Metadata } from "next";

export async function generateMetadata(
  props: PageProps<"/categorias/[slug]">
): Promise<Metadata> {
  const { slug } = await props.params;
  const cat = await db.category.findUnique({ where: { slug } });
  if (!cat) return {};
  return {
    title: cat.metaTitle || cat.name,
    description: cat.metaDesc || cat.description || undefined,
    alternates: { canonical: `/categorias/${cat.slug}` },
  };
}

export default async function CategoryPage(props: PageProps<"/categorias/[slug]">) {
  const { slug } = await props.params;
  const category = await db.category.findUnique({
    where: { slug },
    include: {
      rankings: {
        where: { status: "PUBLISHED" },
        orderBy: { updatedAt: "desc" },
        include: {
          category: { select: { name: true } },
          _count: { select: { items: true } },
        },
      },
    },
  });

  if (!category || category.status !== "PUBLISHED") notFound();

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <nav className="text-xs text-gray-500 mb-4">
        <a href="/" className="hover:text-blue-600">Início</a> ›{" "}
        <a href="/categorias" className="hover:text-blue-600">Categorias</a> ›{" "}
        <span className="text-gray-700">{category.name}</span>
      </nav>

      <h1 className="text-3xl md:text-4xl font-bold text-gray-900">{category.name}</h1>
      {category.description && (
        <p className="text-gray-600 mt-3 max-w-2xl">{category.description}</p>
      )}

      <div className="mt-10">
        <h2 className="text-xl font-semibold text-gray-900 mb-5">Rankings em {category.name}</h2>

        {category.rankings.length === 0 ? (
          <p className="text-gray-400">Nenhum ranking publicado nesta categoria.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {category.rankings.map((r) => (
              <RankingCard key={r.id} ranking={r} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
