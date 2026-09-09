"use client";

import Script from "next/script";
import { useCookieConsent } from "@/lib/cookie-consent";
import { pixelSnippet } from "@/lib/pixel-snippet";

/**
 * Meta Pixel gateado por consentimento, igual ao GTMGate (LGPD Art. 7º + 8º).
 * Usado no site normal. Paginas de grupo usam o MetaPixel direto — o porque
 * esta documentado la.
 *
 * Aqui o next/script e o certo: a decisao depende do consentimento lido no
 * cliente, entao nao ha como sair no HTML do servidor de qualquer forma.
 *
 * So monta se houver metaPixelId em Configuracoes; com o campo vazio, nada
 * carrega.
 */
export function MetaPixelGate({ pixelId }: { pixelId: string }) {
  const { consent, hasLoaded } = useCookieConsent();

  if (!hasLoaded) return null;
  if (consent !== "accepted") return null;

  return (
    <Script id="meta-pixel" strategy="afterInteractive">
      {pixelSnippet(pixelId, false)}
    </Script>
  );
}
