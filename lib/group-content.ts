import type { WhatsAppGroup } from "@prisma/client";
import type { Offer } from "@/components/public/OfferCard";

export interface Benefit {
  title: string;
  description: string;
}

const BENEFICIOS_PADRAO: Benefit[] = [
  { title: "Ofertas todo dia", description: "Achadinhos e promoções dos marketplaces, direto no seu WhatsApp" },
  { title: "Descontos de verdade", description: "Produtos escolhidos a dedo, com desconto que vale a pena" },
  { title: "Cupons da comunidade", description: "Códigos que só quem está no grupo recebe" },
  { title: "Sem spam", description: "Só oferta. Ninguém fica conversando no grupo" },
];

/**
 * Conteudo da landing com os padroes aplicados.
 *
 * Um grupo recem-criado no admin tem so nome e link — os campos de texto sao
 * opcionais de proposito, pra a pagina ja funcionar antes de alguem escrever
 * copy. Editar depois melhora a conversao; nao editar nao quebra nada.
 */
export function groupContent(grupo: WhatsAppGroup) {
  const beneficios = Array.isArray(grupo.benefits)
    ? (grupo.benefits as unknown as Benefit[]).filter((b) => b?.title)
    : [];

  return {
    headline: grupo.headline?.trim() || `Ofertas de ${grupo.name.toLowerCase()} todo dia no seu WhatsApp`,
    subheadline:
      grupo.subheadline?.trim() ||
      "Entre no grupo e receba os melhores preços antes de todo mundo.",
    ctaText: grupo.ctaText?.trim() || "ENTRAR NO GRUPO GRÁTIS",
    benefits: beneficios.length > 0 ? beneficios : BENEFICIOS_PADRAO,
  };
}

/** Formata o contador de membros do jeito que se le em anuncio: 1.2 mil, 25 mil. */
export function formatMembers(n: number): string {
  if (n < 1000) return String(n);
  const mil = n / 1000;
  return `${mil >= 10 ? Math.round(mil) : mil.toFixed(1).replace(".0", "").replace(".", ",")} mil`;
}

/** Ofertas salvas no grupo, ja filtradas contra item quebrado. */
export function groupOffers(grupo: WhatsAppGroup): Offer[] {
  if (!Array.isArray(grupo.offers)) return [];
  return (grupo.offers as unknown as Offer[]).filter((o) => o?.url);
}
