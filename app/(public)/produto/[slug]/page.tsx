import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/utils";
import type { Metadata } from "next";

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
    offers: product.currentPrice
      ? {
          "@type": "Offer",
          price: Number(product.currentPrice),
          priceCurrency: "BRL",
          availability: "https://schema.org/InStock",
        }
      : undefined,
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <nav className="text-xs text-gray-500 mb-4">
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

      <div className="grid md:grid-cols-2 gap-8">
        <div className="bg-white rounded-2xl border border-gray-200 p-6 flex items-center justify-center">
          {product.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={product.imageUrl} alt={product.name} className="max-h-96 object-contain" />
          ) : (
            <div className="h-96 w-full bg-gray-100 rounded-lg" />
          )}
        </div>

        <div>
          {product.brand && (
            <p className="text-sm text-gray-500 uppercase tracking-wide">{product.brand}</p>
          )}
          <h1 className="text-3xl font-bold text-gray-900 mt-1">{product.name}</h1>

          {rating != null && (
            <div className="flex items-center gap-1 mt-3">
              <span className="text-amber-500 text-lg">★</span>
              <span className="font-semibold text-gray-700">{rating.toFixed(1)}</span>
              <span className="text-sm text-gray-400">/ 5</span>
            </div>
          )}

          {product.shortDesc && (
            <p className="text-gray-600 mt-4">{product.shortDesc}</p>
          )}

          <div className="mt-6 border-t border-gray-200 pt-6">
            {product.oldPrice != null && (
              <p className="text-gray-400 line-through">
                {formatPrice(Number(product.oldPrice))}
              </p>
            )}
            {product.currentPrice != null && (
              <p className="text-4xl font-bold text-gray-900">
                {formatPrice(Number(product.currentPrice))}
              </p>
            )}
            {product.priceRange && (
              <p className="text-sm text-gray-500 mt-1">{product.priceRange}</p>
            )}
          </div>

          <div className="mt-6 space-y-2">
            {product.affiliateLinks.map((link) => (
              <a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer sponsored nofollow"
                className="block w-full text-center bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
              >
                {link.label || `Comprar na ${link.platform}`}
              </a>
            ))}
            {product.affiliateLinks.length === 0 && (
              <p className="text-sm text-gray-400">Nenhum link de compra disponível.</p>
            )}
          </div>
        </div>
      </div>

      {(product.pros.length > 0 || product.cons.length > 0) && (
        <div className="grid md:grid-cols-2 gap-4 mt-10">
          {product.pros.length > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-5">
              <h3 className="font-semibold text-green-800 mb-3">Prós</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                {product.pros.map((p, i) => (
                  <li key={i} className="flex gap-2"><span className="text-green-600">✓</span>{p}</li>
                ))}
              </ul>
            </div>
          )}
          {product.cons.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-5">
              <h3 className="font-semibold text-red-800 mb-3">Contras</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                {product.cons.map((c, i) => (
                  <li key={i} className="flex gap-2"><span className="text-red-600">✗</span>{c}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {product.longDesc && (
        <div className="mt-10 max-w-3xl">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Sobre este produto</h2>
          <div className="prose prose-gray whitespace-pre-wrap text-gray-700 leading-relaxed">
            {product.longDesc}
          </div>
        </div>
      )}
    </div>
  );
}
