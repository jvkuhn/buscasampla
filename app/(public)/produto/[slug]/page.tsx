import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/utils";
import type { Metadata } from "next";

const PLATFORM_DISPLAY: Record<string, string> = {
  amazon: "Amazon",
  mercadolivre: "Mercado Livre",
  shopee: "Shopee",
  magalu: "Magalu",
  americanas: "Americanas",
};

const PLATFORM_COLORS: Record<string, string> = {
  amazon: "bg-orange-400 hover:bg-orange-500",
  mercadolivre: "bg-yellow-400 hover:bg-yellow-500 text-yellow-900",
  shopee: "bg-orange-500 hover:bg-orange-600",
  magalu: "bg-blue-500 hover:bg-blue-600",
  americanas: "bg-red-500 hover:bg-red-600",
};

export async function generateMetadata(
  props: PageProps<"/produto/[slug]">
): Promise<Metadata> {
  const { slug } = await props.params;
  const p = await db.product.findUnique({ where: { slug } });
  if (!p) return {};
  return {
    title: p.name,
    description: p.shortDesc || undefined,
    alternates: { canonical: `/produto/${p.slug}` },
    openGraph: {
      title: p.name,
      description: p.shortDesc || undefined,
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
    },
  });

  if (!product || product.status !== "PUBLISHED") notFound();

  const rating = product.rating != null ? Number(product.rating) : null;
  const currentPrice = product.currentPrice != null ? Number(product.currentPrice) : null;
  const oldPrice = product.oldPrice != null ? Number(product.oldPrice) : null;
  const discountPct =
    currentPrice && oldPrice && oldPrice > currentPrice
      ? Math.round((1 - currentPrice / oldPrice) * 100)
      : null;

  const [primaryLink, ...otherLinks] = product.affiliateLinks;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.shortDesc || product.longDesc || undefined,
    image: product.imageUrl || undefined,
    brand: product.brand ? { "@type": "Brand", name: product.brand } : undefined,
    aggregateRating: rating
      ? { "@type": "AggregateRating", ratingValue: rating, ratingCount: 1 }
      : undefined,
    offers: currentPrice
      ? {
          "@type": "Offer",
          price: currentPrice,
          priceCurrency: "BRL",
          availability: "https://schema.org/InStock",
        }
      : undefined,
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="max-w-5xl mx-auto px-4 py-10">
        {/* Breadcrumb */}
        <nav className="text-xs text-gray-500 mb-6">
          <a href="/" className="hover:text-blue-600">Início</a>
          {product.category && (
            <>
              {" "}›{" "}
              <a href={`/categorias/${product.category.slug}`} className="hover:text-blue-600">
                {product.category.name}
              </a>
            </>
          )}
          {" "}›{" "}<span className="text-gray-700">{product.name}</span>
        </nav>

        {/* Card principal */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="grid md:grid-cols-2 gap-0">
            {/* Imagem */}
            <div className="bg-gray-50 flex items-center justify-center p-8 min-h-72 border-b md:border-b-0 md:border-r border-gray-100">
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

              {/* Preço */}
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                {oldPrice != null && (
                  <p className="text-sm text-gray-400 line-through">{formatPrice(oldPrice)}</p>
                )}
                <div className="flex items-baseline gap-3 flex-wrap">
                  {currentPrice != null ? (
                    <span className="text-4xl font-extrabold text-gray-900">
                      {formatPrice(currentPrice)}
                    </span>
                  ) : (
                    <span className="text-gray-400 text-lg">Consulte o preço</span>
                  )}
                  {discountPct && (
                    <span className="bg-red-500 text-white text-sm font-bold px-2.5 py-0.5 rounded-full">
                      -{discountPct}% OFF
                    </span>
                  )}
                </div>
                {product.priceRange && (
                  <p className="text-sm text-gray-500 mt-1">{product.priceRange}</p>
                )}
                {product.affiliateLinks.length > 1 && (
                  <p className="text-xs text-gray-400 mt-2">
                    Disponível em {product.affiliateLinks.length} lojas
                  </p>
                )}
              </div>

              {/* CTAs */}
              <div className="flex flex-col gap-2.5">
                {primaryLink && (
                  <a
                    href={primaryLink.url}
                    target="_blank"
                    rel="noopener noreferrer sponsored nofollow"
                    className={`flex items-center justify-center gap-2 w-full font-bold py-4 px-6 rounded-xl text-lg text-white transition-colors shadow-md ${PLATFORM_COLORS[primaryLink.platform] ?? "bg-green-500 hover:bg-green-600"}`}
                  >
                    <span>🛒</span>
                    <span>Comprar agora</span>
                    <span className="opacity-70 font-normal text-sm">
                      · {PLATFORM_DISPLAY[primaryLink.platform] || primaryLink.platform}
                    </span>
                  </a>
                )}

                {otherLinks.map((link) => (
                  <a
                    key={link.id}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer sponsored nofollow"
                    className={`flex items-center justify-center gap-2 w-full font-semibold py-3 px-6 rounded-xl text-base transition-colors ${PLATFORM_COLORS[link.platform] ?? "bg-gray-100 hover:bg-gray-200 text-gray-800"}`}
                  >
                    Ver no {PLATFORM_DISPLAY[link.platform] || link.platform}
                    <span>→</span>
                  </a>
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

        {/* CTA flutuante repetida ao final */}
        {primaryLink && (
          <div className="mt-8 bg-gradient-to-r from-green-500 to-green-600 rounded-2xl p-6 text-center text-white shadow-lg">
            <p className="font-bold text-lg mb-1">Gostou? Aproveite enquanto tem estoque!</p>
            <p className="text-green-100 text-sm mb-4">Preços podem mudar a qualquer momento.</p>
            <a
              href={primaryLink.url}
              target="_blank"
              rel="noopener noreferrer sponsored nofollow"
              className="inline-flex items-center gap-2 bg-white text-green-700 font-extrabold py-3 px-8 rounded-full hover:bg-green-50 transition-colors text-lg shadow"
            >
              🛒 Comprar agora
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
