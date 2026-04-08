import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { RankingItem } from "@/components/public/RankingItem";
import type { Metadata } from "next";

export async function generateMetadata(
  props: PageProps<"/ranking/[slug]">
): Promise<Metadata> {
  const { slug } = await props.params;
  const r = await db.ranking.findUnique({ where: { slug } });
  if (!r) return {};
  return {
    title: r.metaTitle || r.title,
    description: r.metaDesc || r.subtitle || undefined,
    alternates: { canonical: `/ranking/${r.slug}` },
    openGraph: {
      title: r.ogTitle || r.metaTitle || r.title,
      description: r.ogDesc || r.metaDesc || r.subtitle || undefined,
      images: r.ogImageUrl || r.coverUrl ? [r.ogImageUrl || r.coverUrl!] : undefined,
      type: "article",
    },
  };
}

export default async function RankingPage(props: PageProps<"/ranking/[slug]">) {
  const { slug } = await props.params;

  const ranking = await db.ranking.findUnique({
    where: { slug },
    include: {
      category: true,
      faqs: { orderBy: { order: "asc" } },
      items: {
        orderBy: { order: "asc" },
        include: {
          product: {
            include: {
              affiliateLinks: { orderBy: { createdAt: "asc" } },
            },
          },
        },
      },
    },
  });

  if (!ranking || ranking.status !== "PUBLISHED") notFound();

  // JSON-LD ItemList
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: ranking.title,
    description: ranking.metaDesc || ranking.subtitle || undefined,
    itemListElement: ranking.items.map((it) => ({
      "@type": "ListItem",
      position: it.order,
      name: it.product.name,
      url: `/produto/${it.product.slug}`,
      image: it.product.imageUrl || undefined,
    })),
  };

  const faqJsonLd = ranking.faqs.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: ranking.faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  } : null;

  return (
    <article className="bg-gray-50">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {faqJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
      )}

      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <nav className="text-xs text-gray-500 mb-4">
            <a href="/" className="hover:text-blue-600">Início</a>
            {ranking.category && (
              <>
                {" "}›{" "}
                <a href={`/categorias/${ranking.category.slug}`} className="hover:text-blue-600">
                  {ranking.category.name}
                </a>
              </>
            )}
          </nav>
          <h1 className="text-3xl md:text-5xl font-bold text-gray-900 tracking-tight">
            {ranking.title}
          </h1>
          {ranking.subtitle && (
            <p className="mt-3 text-lg text-gray-600">{ranking.subtitle}</p>
          )}
          {ranking.coverUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={ranking.coverUrl}
              alt={ranking.title}
              className="w-full aspect-[16/9] object-cover rounded-2xl mt-6"
            />
          )}
        </div>
      </header>

      {/* Introdução */}
      {ranking.intro && (
        <div className="max-w-3xl mx-auto px-4 py-10">
          <div className="prose prose-gray max-w-none whitespace-pre-wrap text-gray-700 leading-relaxed">
            {ranking.intro}
          </div>
        </div>
      )}

      {/* Itens */}
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {ranking.items.map((item) => (
          <RankingItem
            key={item.id}
            position={item.order}
            product={{
              slug: item.product.slug,
              name: item.product.name,
              shortDesc: item.product.shortDesc,
              imageUrl: item.product.imageUrl,
              currentPrice: item.product.currentPrice,
              oldPrice: item.product.oldPrice,
              rating: item.product.rating,
              pros: item.product.pros,
              cons: item.product.cons,
              badge: item.product.badge,
              brand: item.product.brand,
              affiliateLinks: item.product.affiliateLinks,
            }}
          />
        ))}
      </div>

      {/* Conclusão */}
      {ranking.conclusion && (
        <div className="max-w-3xl mx-auto px-4 py-10">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Conclusão</h2>
          <div className="prose prose-gray max-w-none whitespace-pre-wrap text-gray-700 leading-relaxed">
            {ranking.conclusion}
          </div>
        </div>
      )}

      {/* FAQ */}
      {ranking.faqs.length > 0 && (
        <div className="max-w-3xl mx-auto px-4 py-10">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Perguntas frequentes</h2>
          <div className="space-y-3">
            {ranking.faqs.map((f) => (
              <details
                key={f.id}
                className="bg-white border border-gray-200 rounded-xl p-5 group"
              >
                <summary className="font-semibold text-gray-900 cursor-pointer list-none flex justify-between items-center">
                  {f.question}
                  <span className="text-gray-400 group-open:rotate-45 transition-transform">+</span>
                </summary>
                <p className="mt-3 text-gray-600 whitespace-pre-wrap">{f.answer}</p>
              </details>
            ))}
          </div>
        </div>
      )}
    </article>
  );
}
