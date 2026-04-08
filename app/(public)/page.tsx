import Link from "next/link";
import { db } from "@/lib/db";
import { RankingCard } from "@/components/public/RankingCard";

export default async function HomePage() {
  const [rankings, categories, topBanner] = await Promise.all([
    db.ranking.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { updatedAt: "desc" },
      take: 9,
      include: {
        category: { select: { name: true } },
        _count: { select: { items: true } },
      },
    }),
    db.category.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { order: "asc" },
      take: 12,
    }),
    db.banner.findFirst({
      where: { active: true, position: "home_top" },
      orderBy: { order: "asc" },
    }),
  ]);

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-blue-600 to-blue-800 text-white">
        <div className="max-w-6xl mx-auto px-4 py-16 md:py-24 text-center">
          {topBanner ? (
            <>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight">{topBanner.title}</h1>
              {topBanner.subtitle && (
                <p className="mt-4 text-lg md:text-xl text-blue-100 max-w-2xl mx-auto">
                  {topBanner.subtitle}
                </p>
              )}
              {topBanner.linkUrl && (
                <a
                  href={topBanner.linkUrl}
                  className="inline-block mt-6 bg-white text-blue-700 font-semibold px-6 py-3 rounded-full hover:bg-blue-50"
                >
                  {topBanner.linkLabel || "Saiba mais"}
                </a>
              )}
            </>
          ) : (
            <>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                Os melhores produtos, comparados e ranqueados
              </h1>
              <p className="mt-4 text-lg md:text-xl text-blue-100 max-w-2xl mx-auto">
                Listas Top 10 imparciais com prós, contras, preço e onde comprar.
              </p>
            </>
          )}
        </div>
      </section>

      {/* Categorias */}
      {categories.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Navegue por categoria</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {categories.map((c) => (
              <Link
                key={c.id}
                href={`/categorias/${c.slug}`}
                className="bg-white border border-gray-200 rounded-lg px-4 py-3 text-center text-sm font-medium text-gray-700 hover:border-blue-500 hover:text-blue-600 transition-colors"
              >
                {c.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Rankings em destaque */}
      <section className="max-w-6xl mx-auto px-4 py-12">
        <div className="flex items-end justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Rankings mais recentes</h2>
        </div>

        {rankings.length === 0 ? (
          <div className="bg-gray-50 border border-dashed border-gray-300 rounded-xl p-12 text-center text-gray-500">
            Nenhum ranking publicado ainda. Acesse o painel admin para criar o primeiro.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {rankings.map((r) => (
              <RankingCard key={r.id} ranking={r} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
