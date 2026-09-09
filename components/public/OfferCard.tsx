import Image from "next/image";

export interface Offer {
  url: string;
  title?: string;
  oldPrice?: string;
  newPrice?: string;
}

function toNumber(v?: string) {
  if (!v) return null;
  const n = Number(v.replace(/[^\d,.-]/g, "").replace(/\./g, "").replace(",", "."));
  return Number.isFinite(n) && n > 0 ? n : null;
}

function brl(v: string) {
  const n = toNumber(v);
  return n == null ? v : n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/**
 * Card de oferta da landing do grupo.
 *
 * Imagens enviadas pelo dono do grupo — e o que ele posta la dentro, mostrado
 * antes da pessoa decidir entrar. Titulo e precos sao opcionais: sem eles o card
 * fica so com a foto, que ja funciona como prova.
 */
export function OfferCard({ offer, priority = false }: { offer: Offer; priority?: boolean }) {
  const de = toNumber(offer.oldPrice);
  const por = toNumber(offer.newPrice);
  const desconto = de && por && de > por ? Math.round((1 - por / de) * 100) : null;

  return (
    <div className="w-[164px] shrink-0 overflow-hidden rounded-2xl border border-[#31281f] bg-[#1c1611] shadow-xl xl:w-[192px]">
      <div className="relative aspect-square bg-white">
        <Image
          src={offer.url}
          alt={offer.title ?? ""}
          fill
          sizes="(min-width: 1280px) 192px, 164px"
          priority={priority}
          className="object-contain p-2"
        />
        {desconto != null && (
          <span className="absolute left-2 top-2 rounded-md bg-[#e5484d] px-1.5 py-0.5 text-[11px] font-bold text-white">
            -{desconto}%
          </span>
        )}
      </div>

      {(offer.title || offer.newPrice) && (
        <div className="p-3">
          {offer.title && (
            <p className="line-clamp-2 text-xs leading-snug text-[#cdc2b6]">{offer.title}</p>
          )}
          {offer.oldPrice && (
            <p className="mt-1 text-[11px] text-[#7d7268] line-through">{brl(offer.oldPrice)}</p>
          )}
          {offer.newPrice && (
            <p className="text-base font-extrabold text-[#ffc94d]">{brl(offer.newPrice)}</p>
          )}
        </div>
      )}
    </div>
  );
}
