import Link from "next/link";
import { BADGE_LABELS, PLATFORM_DISPLAY } from "@/lib/constants";
import { AffiliateLink } from "./AffiliateLink";

const BADGE_COLORS: Record<string, string> = {
  MELHOR_ESCOLHA: "bg-green-500 text-white",
  CUSTO_BENEFICIO: "bg-blue-500 text-white",
  MAIS_VENDIDO: "bg-orange-500 text-white",
  PREMIUM: "bg-purple-500 text-white",
  RECOMENDADO: "bg-teal-500 text-white",
  BOM_E_BARATO: "bg-yellow-400 text-yellow-900",
};

interface Props {
  position: number;
  product: {
    slug: string;
    name: string;
    shortDesc: string | null;
    imageUrl: string | null;
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

  const [primaryLink, ...otherLinks] = product.affiliateLinks;

  return (
    <article
      id={`item-${position}`}
      className="bg-white border border-gray-200 rounded-2xl overflow-hidden scroll-mt-24 shadow-sm hover:shadow-md transition-shadow"
    >
      {/* Badge de posição e destaque */}
      <div className="flex items-center gap-3 px-5 pt-4 pb-0">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 text-white flex items-center justify-center text-lg font-extrabold shadow shrink-0">
          {position}
        </div>
        {product.badge && (
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${BADGE_COLORS[product.badge]}`}>
            {BADGE_LABELS[product.badge]}
          </span>
        )}
      </div>

      <div className="flex flex-col md:flex-row gap-5 p-5 pt-3">
        {/* Imagem */}
        <div className="flex-shrink-0 flex items-start justify-center md:justify-start">
          {product.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-44 h-44 object-contain rounded-xl bg-gray-50 border border-gray-100"
            />
          ) : (
            <div className="w-44 h-44 bg-gray-100 rounded-xl flex items-center justify-center text-gray-300 text-4xl font-bold">
              #{position}
            </div>
          )}
        </div>

        {/* Conteúdo */}
        <div className="flex-1 min-w-0 flex flex-col gap-3">
          {/* Cabeçalho */}
          <div>
            {product.brand && (
              <p className="text-xs text-gray-400 uppercase tracking-wider font-medium">{product.brand}</p>
            )}
            <h3 className="text-xl font-bold text-gray-900 leading-snug mt-0.5">
              <Link href={`/produto/${product.slug}`} className="hover:text-blue-600 transition-colors">
                {product.name}
              </Link>
            </h3>
            {rating != null && (
              <div className="flex items-center gap-1 mt-1.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <span key={s} className={s <= Math.round(rating) ? "text-amber-400" : "text-gray-200"}>★</span>
                ))}
                <span className="text-sm font-semibold text-gray-700 ml-1">{rating.toFixed(1)}</span>
                <span className="text-xs text-gray-400">/ 5</span>
              </div>
            )}
            {product.shortDesc && (
              <p className="text-sm text-gray-600 mt-2 leading-relaxed">{product.shortDesc}</p>
            )}
          </div>

          {/* Prós e contras */}
          {(product.pros.length > 0 || product.cons.length > 0) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              {product.pros.length > 0 && (
                <div className="bg-green-50 rounded-lg p-3">
                  <p className="font-bold text-green-700 text-xs uppercase tracking-wide mb-1.5">Prós</p>
                  <ul className="space-y-1">
                    {product.pros.map((p, i) => (
                      <li key={i} className="text-gray-700 flex gap-1.5 items-start">
                        <span className="text-green-500 shrink-0 mt-0.5">✓</span>{p}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {product.cons.length > 0 && (
                <div className="bg-red-50 rounded-lg p-3">
                  <p className="font-bold text-red-700 text-xs uppercase tracking-wide mb-1.5">Contras</p>
                  <ul className="space-y-1">
                    {product.cons.map((c, i) => (
                      <li key={i} className="text-gray-700 flex gap-1.5 items-start">
                        <span className="text-red-400 shrink-0 mt-0.5">✗</span>{c}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Preço + CTAs */}
          <div className="mt-auto pt-3 border-t border-gray-100">
            {/* Botão principal */}
            {primaryLink && (
              <AffiliateLink
                href={primaryLink.url}
                platform={primaryLink.platform}
                productName={product.name}
                className="flex items-center justify-center gap-2 w-full bg-green-500 hover:bg-green-600 active:bg-green-700 text-white font-bold py-3.5 px-6 rounded-xl text-base transition-colors shadow-sm"
              >
                <span>🛒</span>
                <span>Comprar agora</span>
                <span className="text-green-200 mx-1">·</span>
                <span className="font-medium">{PLATFORM_DISPLAY[primaryLink.platform] || primaryLink.platform}</span>
              </AffiliateLink>
            )}

            {/* Links secundários */}
            {otherLinks.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {otherLinks.map((link) => (
                  <AffiliateLink
                    key={link.id}
                    href={link.url}
                    platform={link.platform}
                    productName={product.name}
                    className="flex-1 min-w-[120px] text-center text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 py-2 px-3 rounded-lg transition-colors"
                  >
                    {PLATFORM_DISPLAY[link.platform] || link.platform} →
                  </AffiliateLink>
                ))}
              </div>
            )}

            {/* Ver análise */}
            <Link
              href={`/produto/${product.slug}`}
              className="block text-center text-sm text-gray-400 hover:text-blue-600 mt-2 transition-colors"
            >
              Ver análise completa →
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
