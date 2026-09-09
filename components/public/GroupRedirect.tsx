"use client";

import { useEffect } from "react";

interface Props {
  slug: string;
  inviteUrl: string;
}

/**
 * Redireciona pro convite do grupo assim que a pagina monta.
 *
 * Nao grava nada no banco de proposito: com trafego pago, uma escrita por
 * clique acordaria o Neon o dia inteiro. O evento vai pro dataLayer do GTM,
 * que ja esta no layout — de la ele alimenta a conversao do Google Ads e,
 * quando houver Pixel ID configurado, o evento Lead da Meta.
 */
export function GroupRedirect({ slug, inviteUrl }: Props) {
  useEffect(() => {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: "grupo_whatsapp_clique",
      grupo_slug: slug,
      // Preserva a origem do anuncio: e o unico jeito de saber qual campanha
      // trouxe a pessoa, ja que o WhatsApp nao repassa referrer.
      utm_source: new URLSearchParams(window.location.search).get("utm_source"),
      utm_campaign: new URLSearchParams(window.location.search).get("utm_campaign"),
    });

    // 250ms dao tempo do GTM despachar o evento antes da navegacao. Sem isso o
    // browser cancela a requisicao do pixel e o clique some do relatorio.
    const t = setTimeout(() => window.location.replace(inviteUrl), 250);
    return () => clearTimeout(t);
  }, [slug, inviteUrl]);

  return null;
}
