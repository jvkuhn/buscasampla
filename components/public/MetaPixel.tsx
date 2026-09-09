/**
 * Snippet do Meta Pixel. O id chega validado como numerico por validations.ts,
 * porque entra interpolado numa string JS.
 */
export function pixelSnippet(pixelId: string, lead: boolean) {
  return `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
document,'script','https://connect.facebook.net/en_US/fbevents.js');
fbq('init','${pixelId}');fbq('track','PageView');${lead ? `fbq('track','Lead');` : ""}`;
}

/**
 * Meta Pixel renderizado direto no HTML do servidor, sem gate de consentimento.
 *
 * Inline de proposito, em vez de next/script: o next/script so injeta o pixel
 * depois da hidratacao do React, e a pagina de grupo redireciona pro WhatsApp
 * em 700ms. Verificado em producao — com next/script o HTML saia sem nenhum
 * <script> de pixel e sem o <noscript>, so com uma referencia de client
 * component. Inline, o navegador executa assim que le a tag.
 *
 * Uso restrito as paginas de grupo (/<slug>), que sao destino de trafego pago:
 * com gate de consentimento o visitante de anuncio redireciona antes de poder
 * clicar "Aceitar", e a campanha rodaria sem conversao nenhuma. O resto do site
 * usa MetaPixelGate, que respeita o consentimento.
 */
export function MetaPixel({ pixelId, lead = false }: { pixelId: string; lead?: boolean }) {
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: pixelSnippet(pixelId, lead) }} />

      {/* Fallback pra quem bloqueia JS. Sendo <img>, o img-src do CSP ja cobre. */}
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
