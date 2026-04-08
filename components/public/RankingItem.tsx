import Link from "next/link";
import { formatPrice } from "@/lib/utils";

const BADGE_LABELS: Record<string, string> = {
  BEST_VALUE: "Melhor custo-benefício",
  BEST_SELLER: "Mais vendido",
  PREMIUM: "Premium",
  CHEAPEST: "Mais barato",
};

const BADGE_COLORS: Record<string, string> = {
  BEST_VALUE: "bg-green-100 text-green-700",
  BEST_SELLER: "bg-blue-100 text-blue-700",
  PREMIUM: "bg-purple-100 text-purple-700",
  CHEAPEST: "bg-yellow-100 text-yellow-700",
};

interface Props {
  position: number;
  product: {
    slug: string;
    name: string;
    shortDesc: string | null;
    imageUrl: string | null;
    currentPrice: unknown;
    oldPrice: unknown;
    rating: unknown;
    pros: string[];
    cons: string[];
    badge: string | null;
    brand: string | null;
    affiliateLinks: { id: string; platform: string; url: string; label: string | null }[];
  };
}

export function RankingItem({ position, product }: Props) {
  const rating = product.rating != null ? Number(product.rating) : null;

  return (
    <article
      id={`item-${position}`}
      className="bg-white border border-gray-200 rounded-2xl p-6 md:p-8 scroll-mt-24"
    >
      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-shrink-0 flex md:flex-col items-center md:items-start gap-4">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 text-white flex items-center justify-center text-2xl font-bold shadow">
            {position}
          </div>
          {product.badge && (
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${BADGE_COLORS[product.badge]}`}>
              {BADGE_LABELS[product.badge]}
            </span>
          )}
        </div>

        <div className="flex-shrink-0">
          {product.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-40 h-40 object-contain rounded-lg bg-gray-50"
            />
          ) : (
            <div className="w-40 h-40 bg-gray-100 rounded-lg" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          {product.brand && (
            <p className="text-xs text-gray-500 uppercase tracking-wide">{product.brand}</p>
          )}
          <h3 className="text-xl font-bold text-gray-900 mt-1">
            <Link href={`/produto/${product.slug}`} className="hover:text-blue-600">
              {product.name}
            </Link>
          </h3>

          {rating != null && (
            <div className="flex items-center gap-1 mt-2">
              <span className="text-amber-500">★</span>
              <span className="text-sm font-medium text-gray-700">{rating.toFixed(1)}</span>
              <span className="text-xs text-gray-400">/ 5</span>
            </div>
          )}

          {product.shortDesc && (
            <p className="text-sm text-gray-600 mt-3">{product.shortDesc}</p>
          )}

          {(product.pros.length > 0 || product.cons.length > 0) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 text-sm">
              {product.pros.length > 0 && (
                <div>
                  <p className="font-semibold text-green-700 text-xs uppercase mb-1">Prós</p>
                  <ul className="space-y-1">
                    {product.pros.map((p, i) => (
                      <li key={i} className="text-gray-600 flex gap-2">
                        <span className="text-green-600">✓</span>{p}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {product.cons.length > 0 && (
                <div>
                  <p className="font-semibold text-red-700 text-xs uppercase mb-1">Contras</p>
                  <ul className="space-y-1">
                    {product.cons.map((c, i) => (
                      <li key={i} className="text-gray-600 flex gap-2">
                        <span className="text-red-600">✗</span>{c}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          <div className="mt-5 flex flex-wrap items-end gap-4 border-t border-gray-100 pt-4">
            <div>
              {product.oldPrice != null && (
                <p className="text-sm text-gray-400 line-through">
                  {formatPrice(Number(product.oldPrice))}
                </p>
              )}
              {product.currentPrice != null && (
                <p className="text-2xl font-bold text-gray-900">
                  {formatPrice(Number(product.currentPrice))}
                </p>
              )}
            </div>

            <div className="flex flex-wrap gap-2 ml-auto">
              {product.affiliateLinks.map((link) => (
                <a
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer sponsored nofollow"
                  className="inline-flex items-center gap-1 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                >
                  {link.label || `Ver na ${link.platform}`}
                  <span aria-hidden>→</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
