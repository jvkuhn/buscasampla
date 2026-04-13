import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { PLATFORM_DISPLAY } from "@/lib/constants";
import { AffiliateLink } from "@/components/public/AffiliateLink";
import { AffiliateDisclosure } from "@/components/public/AffiliateDisclosure";
import { PageViewTracker } from "@/components/public/PageViewTracker";
import { safeJsonLd } from "@/lib/utils";
import type { Metadata } from "next";
import type { Badge } from "@prisma/client";

const PLATFORM_COLORS: Record<string, string> = {
  amazon: "bg-orange-400 hover:bg-orange-500",
  mercadolivre: "bg-yellow-400 hover:bg-yellow-500 text-yellow-900",
  shopee: "bg-orange-500 hover:bg-orange-600",
  magalu: "bg-blue-500 hover:bg-blue-600",
  americanas: "bg-red-500 hover:bg-red-600",
};

const BADGE_CONFIG: Record<Badge, { label: string; className: string; icon: string }> = {
  MELHOR_ESCOLHA: {
    label: "Melhor Escolha",
    className: "bg-emerald-500 text-white",
    icon: "🏆",
  },
  RECOMENDADO: {
    label: "Recomendado",
    className: "bg-blue-500 text-white",
    icon: "⭐",
  },
  MAIS_VENDIDO: {
    label: "Mais Vendido",
    className: "bg-amber-400 text-amber-900",
    icon: "🔥",
  },
  CUSTO_BENEFICIO: {
    label: "Custo-Benefício",
    className: "bg-purple-500 text-white",
    icon: "💰",
  },
  PREMIUM: {
    label: "Premium",
    className: "bg-gradient-to-r from-yellow-400 to-amber-500 text-amber-900",
    icon: "👑",
  },
  BOM_E_BARATO: {
    label: "Bom e Barato",
    className: "bg-orange-500 text-white",
    icon: "💵",
  },
};

export async function generateMetadata(
  props: PageProps<"/produto/[slug]">
): Promise<Metadata> {
  const { slug } = await props.params;
  const p = await db.product.findUnique({
    where: { slug },
    include: { category: { select: { name: true } } },
  });
  if (!p) return {};

  const titleParts = [p.name];
  if (p.brand && !p.name.toLowerCase().includes(p.brand.toLowerCase())) {
    titleParts.unshift(p.brand);
  }
  const title = `${titleParts.join(" ")} — Avaliação e Onde Comprar`;

  const descParts: string[] = [];
  if (p.shortDesc) descParts.push(p.shortDesc);
  if (p.category?.name) descParts.push(`Categoria: ${p.category.name}.`);
  if (p.rating != null) descParts.push(`Avaliação ${Number(p.rating).toFixed(1)}/5.`);
  descParts.push("Veja prós, contras e onde comprar.");
  const description = descParts.join(" ").slice(0, 160);

  return {
    title,
    description,
    alternates: { canonical: `/produto/${p.slug}` },
    openGraph: {
      title: p.name,
      description,
      type: "article",
      images: p.imageUrl ? [{ url: p.imageUrl, alt: p.name }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: p.name,
      description,
      images: p.imageUrl ? [p.imageUrl] : undefined,
    },
  };
}

export default async function ProductPage(props: PageProps<"/produto/[slug]">) {
  const { slug } = await props.params;
  const product = await db.product.findUnique({
    where: { slug },
    include: {
      category: true,
      affiliateLinks: { orderBy: { createdAt: "asc" } },
      rankingItems: {
        include: {
          ranking: {
            include: {
              faqs: { orderBy: { order: "asc" } },
              items: {
                orderBy: { order: "asc" },
                include: {
                  product: {
                    select: {
                      id: true,
                      slug: true,
                      name: true,
                      imageUrl: true,
                      badge: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!product || product.status !== "PUBLISHED") notFound();

  const rating = product.rating != null ? Number(product.rating) : null;
  const [primaryLink, ...otherLinks] = product.affiliateLinks;
  const badgeInfo = product.badge ? BADGE_CONFIG[product.badge] : null;

  // Ranking primário = o mais recentemente atualizado entre os rankings onde o produto aparece.
  // Quase todos os produtos aparecem em apenas 1 ranking; esse é um tie-break seguro.
  const primaryRankingItem =
    product.rankingItems.length > 0
      ? [...product.rankingItems].sort(
          (a, b) => b.ranking.updatedAt.getTime() - a.ranking.updatedAt.getTime()
        )[0]
      : null;
  const primaryRanking = primaryRankingItem?.ranking;
  const positionInRanking = primaryRankingItem?.order;
  const otherItemsInRanking =
    primaryRanking?.items.filter((it) => it.product.id !== product.id) ?? [];
  const rankingFaqs = primaryRanking?.faqs ?? [];

  // Primeiros 3 prós para a seção "Por que recomendamos"
  const topPros = product.pros.slice(0, 3);

  // Review body sintético a partir dos campos editoriais disponíveis.
  // Usado dentro do Product JSON-LD como "review" — enriquece sinalização para o Google.
  const reviewBodyParts: string[] = [];
  if (product.shortDesc) reviewBodyParts.push(product.shortDesc);
  if (product.pros.length > 0) {
    reviewBodyParts.push("Pontos positivos: " + product.pros.slice(0, 3).join("; ") + ".");
  }
  if (product.cons.length > 0) {
    reviewBodyParts.push("Pontos a considerar: " + product.cons.slice(0, 2).join("; ") + ".");
  }
  const reviewBody = reviewBodyParts.join(" ");

  // JSON-LD Product SEM offers. Não temos preço visível ao usuário, e o Google Ads
  // desoptimiza produtos com offers sem price. Mantemos campos livres de preço:
  // name, description, image, sku, brand, category, aggregateRating, review.
  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.shortDesc || product.longDesc || undefined,
    image: product.imageUrl || undefined,
    sku: product.slug,
    brand: product.brand ? { "@type": "Brand", name: product.brand } : undefined,
    category: product.category?.name,
    aggregateRating:
      rating != null
        ? {
            "@type": "AggregateRating",
            ratingValue: rating.toFixed(1),
            bestRating: "5",
            worstRating: "1",
            ratingCount: 1,
          }
        : undefined,
    review:
      rating != null && reviewBody
        ? {
            "@type": "Review",
            author: { "@type": "Organization", name: "BuscasAmpla Editorial" },
            reviewRating: {
              "@type": "Rating",
              ratingValue: rating.toFixed(1),
              bestRating: "5",
              worstRating: "1",
            },
            reviewBody,
            ...(primaryRankingItem
              ? {
                  itemReviewed: {
                    "@type": "Product",
                    name: product.name,
                  },
                }
              : {}),
          }
        : undefined,
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Início", item: "/" },
      ...(product.category
        ? [
            {
              "@type": "ListItem",
              position: 2,
              name: product.category.name,
              item: `/categorias/${product.category.slug}`,
            },
          ]
        : []),
      {
        "@type": "ListItem",
        position: product.category ? 3 : 2,
        name: product.name,
        item: `/produto/${product.slug}`,
      },
    ],
  };

  // FAQPage JSON-LD herda as FAQs do ranking primário.
  // Observação SEO: desde 2023 o Google só exibe rich results de FAQPage para sites
  // autoritativos de governo/saúde. Emitimos mesmo assim porque ajuda interpretação
  // de tópico e é low-cost insurance caso as regras mudem.
  const faqJsonLd =
    rankingFaqs.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: rankingFaqs.map((f) => ({
            "@type": "Question",
            name: f.question,
            acceptedAnswer: { "@type": "Answer", text: f.answer },
          })),
        }
      : null;

  return (
    <div className="bg-gray-50 min-h-screen">
      <PageViewTracker pageType="PRODUCT" slug={slug} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(productJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbJsonLd) }}
      />
      {faqJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: safeJsonLd(faqJsonLd) }}
        />
      )}

      <div className="max-w-5xl mx-auto px-4 py-10">
        {/* Breadcrumb */}
        <nav className="text-xs text-gray-500 mb-4">
          <Link href="/" className="hover:text-blue-600">Início</Link>
          {product.category && (
            <>
              {" "}›{" "}
              <Link href={`/categorias/${product.category.slug}`} className="hover:text-blue-600">
                {product.category.name}
              </Link>
            </>
          )}
          {" "}›{" "}<span className="text-gray-700">{product.name}</span>
        </nav>

        {/* Chip: posição no ranking */}
        {primaryRanking && positionInRanking && (
          <Link
            href={`/ranking/${primaryRanking.slug}`}
            className="inline-flex items-center gap-2 mb-6 bg-white border border-blue-200 hover:border-blue-400 rounded-full px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50 transition-colors shadow-sm"
          >
            <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
              {positionInRanking}
            </span>
            <span>
              Nº {positionInRanking} em{" "}
              <span className="underline decoration-blue-200 underline-offset-2">
                {primaryRanking.title}
              </span>
            </span>
          </Link>
        )}

        {/* Card principal */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="grid md:grid-cols-2 gap-0">
            {/* Imagem */}
            <div className="bg-gray-50 flex items-center justify-center p-8 min-h-72 border-b md:border-b-0 md:border-r border-gray-100 relative">
              {badgeInfo && (
                <div
                  className={`absolute top-4 left-4 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-extrabold shadow-md ${badgeInfo.className}`}
                >
                  <span>{badgeInfo.icon}</span>
                  <span className="uppercase tracking-wide">{badgeInfo.label}</span>
                </div>
              )}
              {product.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="max-h-80 max-w-full object-contain"
                />
              ) : (
                <div className="h-64 w-full bg-gray-100 rounded-xl" />
              )}
            </div>

            {/* Info + CTAs */}
            <div className="p-7 flex flex-col gap-4">
              {product.brand && (
                <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">{product.brand}</p>
              )}
              <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 leading-tight">
                {product.name}
              </h1>

              {/* Rating */}
              {rating != null && (
                <div className="flex items-center gap-2">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <span key={s} className={`text-xl ${s <= Math.round(rating) ? "text-amber-400" : "text-gray-200"}`}>★</span>
                    ))}
                  </div>
                  <span className="font-bold text-gray-800">{rating.toFixed(1)}</span>
                  <span className="text-sm text-gray-400">/ 5</span>
                </div>
              )}

              {product.shortDesc && (
                <p className="text-gray-600 leading-relaxed">{product.shortDesc}</p>
              )}

              {/* CTAs */}
              <div className="flex flex-col gap-2.5">
                {primaryLink && (
                  <AffiliateLink
                    href={primaryLink.url}
                    platform={primaryLink.platform}
                    productName={product.name}
                    productId={product.id}
                    className={`flex items-center justify-center gap-2 w-full font-bold py-4 px-6 rounded-xl text-lg text-white transition-colors shadow-md ${PLATFORM_COLORS[primaryLink.platform] ?? "bg-green-500 hover:bg-green-600"}`}
                  >
                    <span>🛒</span>
                    <span>Comprar agora</span>
                    <span className="opacity-70 font-normal text-sm">
                      · {PLATFORM_DISPLAY[primaryLink.platform] || primaryLink.platform}
                    </span>
                  </AffiliateLink>
                )}

                {otherLinks.map((link) => (
                  <AffiliateLink
                    key={link.id}
                    href={link.url}
                    platform={link.platform}
                    productName={product.name}
                    productId={product.id}
                    className={`flex items-center justify-center gap-2 w-full font-semibold py-3 px-6 rounded-xl text-base transition-colors ${PLATFORM_COLORS[link.platform] ?? "bg-gray-100 hover:bg-gray-200 text-gray-800"}`}
                  >
                    Ver no {PLATFORM_DISPLAY[link.platform] || link.platform}
                    <span>→</span>
                  </AffiliateLink>
                ))}

                {product.affiliateLinks.length === 0 && (
                  <p className="text-sm text-gray-400 text-center py-2">Nenhum link de compra disponível.</p>
                )}
              </div>

              <p className="text-xs text-gray-400 text-center">
                Você será redirecionado para o site da loja parceira.
              </p>
            </div>
          </div>
        </div>

        {/* Por que recomendamos */}
        {topPros.length > 0 && (
          <div className="mt-6 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-7">
            <h2 className="text-lg font-bold text-blue-900 mb-4 flex items-center gap-2">
              <span>💡</span> Por que recomendamos este produto
            </h2>
            <ul className="space-y-3">
              {topPros.map((p, i) => (
                <li key={i} className="flex gap-3 items-start text-gray-800">
                  <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <span className="leading-relaxed">{p}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Prós e Contras */}
        {(product.pros.length > 0 || product.cons.length > 0) && (
          <div className="grid md:grid-cols-2 gap-4 mt-6">
            {product.pros.length > 0 && (
              <div className="bg-white border border-green-200 rounded-2xl p-6">
                <h3 className="font-bold text-green-800 mb-3 flex items-center gap-2">
                  <span className="text-green-500">✓</span> Prós
                </h3>
                <ul className="space-y-2 text-sm text-gray-700">
                  {product.pros.map((p, i) => (
                    <li key={i} className="flex gap-2 items-start">
                      <span className="text-green-500 shrink-0 mt-0.5">✓</span>{p}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {product.cons.length > 0 && (
              <div className="bg-white border border-red-200 rounded-2xl p-6">
                <h3 className="font-bold text-red-800 mb-3 flex items-center gap-2">
                  <span className="text-red-400">✗</span> Contras
                </h3>
                <ul className="space-y-2 text-sm text-gray-700">
                  {product.cons.map((c, i) => (
                    <li key={i} className="flex gap-2 items-start">
                      <span className="text-red-400 shrink-0 mt-0.5">✗</span>{c}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Descrição longa */}
        {product.longDesc && (
          <div className="bg-white rounded-2xl border border-gray-200 p-7 mt-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Sobre este produto</h2>
            <div className="prose prose-gray max-w-none whitespace-pre-wrap text-gray-700 leading-relaxed text-sm">
              {product.longDesc}
            </div>
          </div>
        )}

        {/* Outros do ranking */}
        {otherItemsInRanking.length > 0 && primaryRanking && (
          <div className="mt-10">
            <div className="flex items-end justify-between gap-4 mb-5">
              <h2 className="text-xl font-bold text-gray-900">
                Compare com outros da lista
              </h2>
              <Link
                href={`/ranking/${primaryRanking.slug}`}
                className="shrink-0 text-sm text-blue-600 hover:text-blue-800 font-semibold hover:underline"
              >
                Ver ranking completo →
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {otherItemsInRanking.map((it) => {
                const otherBadge = it.product.badge ? BADGE_CONFIG[it.product.badge] : null;
                return (
                  <Link
                    key={it.id}
                    href={`/produto/${it.product.slug}`}
                    className="group bg-white border border-gray-200 rounded-xl overflow-hidden hover:border-blue-400 hover:shadow-md transition-all"
                  >
                    <div className="bg-gray-50 aspect-square flex items-center justify-center p-4 relative">
                      <span className="absolute top-2 left-2 bg-gray-900/80 text-white text-[10px] font-bold rounded-full w-6 h-6 flex items-center justify-center">
                        {it.order}
                      </span>
                      {otherBadge && (
                        <span
                          className={`absolute top-2 right-2 rounded-full px-1.5 py-0.5 text-[9px] font-bold ${otherBadge.className}`}
                          title={otherBadge.label}
                        >
                          {otherBadge.icon}
                        </span>
                      )}
                      {it.product.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={it.product.imageUrl}
                          alt={it.product.name}
                          className="max-h-32 max-w-full object-contain group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <div className="w-full h-24 bg-gray-100 rounded" />
                      )}
                    </div>
                    <div className="p-3">
                      <p className="text-xs font-semibold text-gray-800 line-clamp-2 group-hover:text-blue-700">
                        {it.product.name}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* FAQs do ranking */}
        {rankingFaqs.length > 0 && primaryRanking && (
          <div className="mt-10">
            <div className="flex items-end justify-between gap-4 mb-5">
              <h2 className="text-xl font-bold text-gray-900">Perguntas frequentes</h2>
              <span className="text-xs text-gray-400">
                da lista {primaryRanking.title}
              </span>
            </div>
            <div className="space-y-3">
              {rankingFaqs.map((f) => (
                <details
                  key={f.id}
                  className="bg-white border border-gray-200 rounded-xl p-5 group"
                >
                  <summary className="font-semibold text-gray-900 cursor-pointer list-none flex justify-between items-center gap-4">
                    <span>{f.question}</span>
                    <span className="text-gray-400 group-open:rotate-45 transition-transform shrink-0">+</span>
                  </summary>
                  <p className="mt-3 text-gray-600 whitespace-pre-wrap">{f.answer}</p>
                </details>
              ))}
            </div>
          </div>
        )}

        {/* CTA flutuante repetida ao final */}
        {primaryLink && (
          <div className="mt-8 bg-gradient-to-r from-green-500 to-green-600 rounded-2xl p-6 text-center text-white shadow-lg">
            <p className="font-bold text-lg mb-1">Gostou? Aproveite enquanto tem estoque!</p>
            <p className="text-green-100 text-sm mb-4">Clique e confira a oferta na loja parceira.</p>
            <AffiliateLink
              href={primaryLink.url}
              platform={primaryLink.platform}
              productName={product.name}
              productId={product.id}
              className="inline-flex items-center gap-2 bg-white text-green-700 font-extrabold py-3 px-8 rounded-full hover:bg-green-50 transition-colors text-lg shadow"
            >
              🛒 Comprar agora
            </AffiliateLink>
          </div>
        )}

        {/* Disclosure de afiliado (discreto, ao fim da pagina) */}
        <AffiliateDisclosure />
      </div>
    </div>
  );
}
