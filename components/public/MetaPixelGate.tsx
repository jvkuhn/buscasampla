"use client";

import { useCookieConsent } from "@/lib/cookie-consent";
import { MetaPixel } from "@/components/public/MetaPixel";

/**
 * Meta Pixel gateado por consentimento, igual ao GTMGate (LGPD Art. 7º + 8º).
 * Usado no site normal. Paginas de grupo usam o MetaPixel direto — o porque
 * esta documentado la.
 *
 * So monta se houver metaPixelId em Configuracoes; enquanto o campo estiver
 * vazio, nada carrega.
 */
export function MetaPixelGate({ pixelId }: { pixelId: string }) {
  const { consent, hasLoaded } = useCookieConsent();

  if (!hasLoaded) return null;
  if (consent !== "accepted") return null;

  return <MetaPixel pixelId={pixelId} />;
}
