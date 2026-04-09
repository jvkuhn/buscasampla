import Link from "next/link";
import { db } from "@/lib/db";
import { RankingCard } from "@/components/public/RankingCard";

export default async function HomePage() {
  const [categoriesWithRankings, uncategorizedRankings, topBanner, settings] = await Promise.all([
    db.category.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { order: "asc" },
      include: {
        rankings: {
          where: { status: "PUBLISHED" },
          orderBy: { updatedAt: "desc" },
          take: 3,
          include: {
            category: { select: { name: true } },
            _count: { select: { items: true } },
          },
        },
      },
    }),
    db.ranking.findMany({
      where: { status: "PUBLISHED", categoryId: null },
      orderBy: { updatedAt: "desc" },
      take: 6,
      include: {
        category: { select: { name: true } },
        _count: { select: { items: true } },
      },
    }),
    db.banner.findFirst({
      where: { active: true, position: "home_top" },
      orderBy: { order: "asc" },
    }),
    db.siteSettings.findUnique({ where: { id: "default" } }),
  ]);

  const categoriesWithContent = categoriesWithRankings.filter((c) => c.rankings.length > 0);
  const totalRankings = categoriesWithRankings.reduce((sum, c) => sum + c.rankings.length, 0)
    + uncategorizedRankings.length;

  const siteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: settings?.siteName ?? "BuscasAmpla",
    url: "/",
    potentialAction: {
      "@type": "SearchAction",
      target: "/busca?q={search_term_string}",
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(siteJsonLd) }}
      />

      {/* Hero */}
      <section className="bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 text-white">
        <div className="max-w-5xl mx-auto px-4 py-16 md:py-24 text-center">
          {topBanner ? (
            <>
              <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight">
                {topBanner.title}
              </h1>
              {topBanner.subtitle && (
                <p className="mt-4 text-lg md:text-xl text-blue-100 max-w-2xl mx-auto">
                  {topBanner.subtitle}
                </p>
              )}
              {topBanner.linkUrl && (
                <a
                  href={topBanner.linkUrl}
                  className="inline-block mt-6 bg-white text-blue-700 font-bold px-8 py-3 rounded-full hover:bg-blue-50 transition-colors shadow-lg"
                >
                  {topBanner.linkLabel || "Saiba mais"}
                </a>
              )}
            </>
          ) : (
            <>
              <div className="inline-block bg-white/10 text-blue-100 text-sm font-medium px-4 py-1.5 rounded-full mb-5">
                Comparativos imparciais · Atualizado em 2026
              </div>
              <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight">
                Os melhores produtos,<br className="hidden md:block" /> comparados pra você
              </h1>
              <p className="mt-5 text-lg md:text-xl text-blue-100 max-w-2xl mx-auto">
                Listas Top 10 com prós, contras, preços e onde comprar — tudo em um só lugar.
              </p>
              {categoriesWithContent.length > 0 && (
                <div className="mt-8 flex flex-wrap justify-center gap-3">
                  {categoriesWithContent.slice(0, 5).map((c) => (
                    <Link
                      key={c.id}
                      href={`/categorias/${c.slug}`}
                      className="bg-white/15 hover:bg-white/25 text-white text-sm font-medium px-4 py-2 rounded-full transition-colors border border-white/20"
                    >
                      {c.name}
                    </Link>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* Seções por categoria */}
      {categoriesWithContent.length > 0 ? (
        <div className="max-w-6xl mx-auto px-4">
          {categoriesWithContent.map((category, idx) => (
            <section
              key={category.id}
              className={`py-12 ${idx > 0 ? "border-t border-gray-200" : "pt-14"}`}
            >
              <div className="flex items-start justify-between mb-6 gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{category.name}</h2>
                  {category.description && (
                    <p className="text-sm text-gray-500 mt-1 max-w-xl">{category.description}</p>
                  )}
                </div>
                <Link
                  href={`/categorias/${category.slug}`}
                  className="shrink-0 text-sm text-blue-600 hover:text-blue-800 font-semibold hover:underline mt-1"
                >
                  Ver todos →
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {category.rankings.map((r) => (
                  <RankingCard key={r.id} ranking={r} />
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : totalRankings === 0 ? (
        <div className="max-w-6xl mx-auto px-4 py-20 text-center text-gray-400">
          Nenhum ranking publicado ainda.
        </div>
      ) : null}

      {/* Rankings sem categoria */}
      {uncategorizedRankings.length > 0 && (
        <section className={`max-w-6xl mx-auto px-4 py-12 ${categoriesWithContent.length > 0 ? "border-t border-gray-200" : ""}`}>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Outros rankings</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {uncategorizedRankings.map((r) => (
              <RankingCard key={r.id} ranking={r} />
            ))}
          </div>
        </section>
      )}

      {/* CTA final */}
      {categoriesWithContent.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 py-10 pb-16">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-center text-white">
            <h2 className="text-2xl font-bold">Explore por categoria</h2>
            <p className="text-blue-100 mt-2">Eletrodomésticos, eletrônicos, cozinha e muito mais.</p>
            <Link
              href="/categorias"
              className="inline-block mt-5 bg-white text-blue-700 font-bold px-6 py-2.5 rounded-full hover:bg-blue-50 transition-colors"
            >
              Ver todas as categorias
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
