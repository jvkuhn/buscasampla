"use client";

import Script from "next/script";
import { useCookieConsent } from "@/lib/cookie-consent";

/**
 * Meta Pixel, gateado por consentimento igual ao GTMGate (LGPD Art. 7º + 8º).
 *
 * Só monta se houver um metaPixelId configurado em Configurações. Enquanto o
 * campo estiver vazio, nada é carregado — é assim que o pixel fica "pronto e
 * desligado" até existir uma conta no Gerenciador de Eventos.
 *
 * O id é validado como numérico em validations.ts antes de chegar aqui, porque
 * abaixo ele é interpolado dentro de uma string JS inline.
 */
export function MetaPixelGate({ pixelId }: { pixelId: string }) {
  const { consent, hasLoaded } = useCookieConsent();

  if (!hasLoaded) return null;
  if (consent !== "accepted") return null;

  return (
    <Script id="meta-pixel" strategy="afterInteractive">
      {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
document,'script','https://connect.facebook.net/en_US/fbevents.js');
fbq('init','${pixelId}');fbq('track','PageView');`}
    </Script>
  );
}
