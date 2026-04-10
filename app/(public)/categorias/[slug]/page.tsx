import { notFound } from "next/navigation";
import Link from "next/link";
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
    title: cat.metaTitle || `Top 10 de ${cat.name} — Os melhores de 2026`,
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
          items: {
            where: { order: 1 },
            take: 1,
            select: { product: { select: { imageUrl: true } } },
          },
        },
      },
    },
  });

  if (!category || category.status !== "PUBLISHED") notFound();

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Hero da categoria */}
      <section className="bg-gradient-to-br from-blue-700 to-indigo-700 text-white">
        <div className="max-w-5xl mx-auto px-4 py-14 md:py-20">
          <nav className="text-xs text-blue-200 mb-5">
            <Link href="/" className="hover:text-white">Início</Link>{" "}›{" "}
            <Link href="/categorias" className="hover:text-white">Categorias</Link>{" "}›{" "}
            <span className="text-white">{category.name}</span>
          </nav>
          <div className="inline-block bg-white/15 text-blue-100 text-xs font-semibold px-3 py-1 rounded-full mb-4 uppercase tracking-wide">
            {category.rankings.length} {category.rankings.length === 1 ? "ranking" : "rankings"} disponíveis
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight">
            Top 10 de {category.name}
          </h1>
          {category.description && (
            <p className="mt-4 text-lg text-blue-100 max-w-2xl">{category.description}</p>
          )}
        </div>
      </section>

      {/* Conteúdo */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        {category.rankings.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-2xl font-bold mb-2">Em breve</p>
            <p>Estamos preparando rankings para essa categoria.</p>
          </div>
        ) : (
          <>
            <h2 className="text-xl font-bold text-gray-800 mb-6">
              Todos os rankings em <span className="text-blue-600">{category.name}</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {category.rankings.map((r) => (
                <RankingCard key={r.id} ranking={r} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
