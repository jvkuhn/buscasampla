import Script from "next/script";

/**
 * Meta Pixel sem gate de consentimento.
 *
 * Uso restrito as paginas de grupo (/<slug>), que sao destino de trafego pago:
 * elas redirecionam pro WhatsApp em 250ms, entao ninguem chega a clicar
 * "Aceitar" no banner de cookies — com gate, o pixel nunca dispararia e a
 * campanha rodaria sem conversao nenhuma. O resto do site continua usando o
 * MetaPixelGate, que respeita o consentimento.
 *
 * O id e validado como numerico em validations.ts antes de chegar aqui, porque
 * abaixo ele e interpolado dentro de uma string JS inline.
 */
export function MetaPixel({ pixelId, lead = false }: { pixelId: string; lead?: boolean }) {
  return (
    <>
      <Script id="meta-pixel" strategy="afterInteractive">
        {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
document,'script','https://connect.facebook.net/en_US/fbevents.js');
fbq('init','${pixelId}');fbq('track','PageView');${lead ? `fbq('track','Lead');` : ""}`}
      </Script>

      {/* Fallback pra quem bloqueia JS. Como e <img>, o img-src do CSP ja cobre. */}
      <noscript>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          height="1"
          width="1"
          style={{ display: "none" }}
          alt=""
          src={`https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`}
        />
      </noscript>
    </>
  );
}
