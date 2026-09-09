import Image from "next/image";
import { formatPrice } from "@/lib/utils";

export interface Offer {
  id: string;
  name: string;
  imageUrl: string | null;
  currentPrice: string | null;
  oldPrice: string | null;
}

/**
 * Card de oferta usado como prova social na landing do grupo.
 *
 * Sao produtos reais do catalogo, com o de/por real — nao print montado. E o
 * que a pessoa vai receber se entrar, mostrado antes de ela decidir.
 */
export function OfferCard({ offer }: { offer: Offer }) {
  const desconto =
    offer.oldPrice && offer.currentPrice
      ? Math.round((1 - Number(offer.currentPrice) / Number(offer.oldPrice)) * 100)
      : null;

  return (
    <div className="w-[150px] shrink-0 overflow-hidden rounded-xl border border-[#31281f] bg-[#1c1611] shadow-lg">
      <div className="relative aspect-square bg-white">
        {offer.imageUrl && (
          <Image
            src={offer.imageUrl}
            alt=""
            fill
            sizes="150px"
            className="object-contain p-2"
          />
        )}
        {desconto != null && desconto > 0 && (
          <span className="absolute left-1.5 top-1.5 rounded-md bg-[#e5484d] px-1.5 py-0.5 text-[10px] font-bold text-white">
            -{desconto}%
          </span>
        )}
      </div>

      <div className="p-2.5">
        <p className="line-clamp-2 text-[11px] leading-snug text-[#cdc2b6]">{offer.name}</p>
        {offer.oldPrice && (
          <p className="mt-1 text-[10px] text-[#7d7268] line-through">
            {formatPrice(offer.oldPrice)}
          </p>
        )}
        {offer.currentPrice && (
          <p className="text-sm font-extrabold text-[#ffc94d]">
            {formatPrice(offer.currentPrice)}
          </p>
        )}
      </div>
    </div>
  );
}
