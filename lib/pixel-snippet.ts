/**
 * Snippet do Meta Pixel. Vive numa lib, e nao junto do componente, porque a
 * landing do grupo e um Route Handler que monta HTML: importar de um .tsx
 * arrastaria React para uma rota que existe justamente para nao ter React.
 *
 * O id chega validado como numerico por validations.ts, porque entra
 * interpolado numa string JS.
 */
export function pixelSnippet(pixelId: string, lead: boolean) {
  return `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
document,'script','https://connect.facebook.net/en_US/fbevents.js');
fbq('init','${pixelId}');fbq('track','PageView');${lead ? `fbq('track','Lead');` : ""}`;
}
