import Script from "next/script";

const GA_ID = "G-SVG1QR1DD1";

/**
 * Carrega o gtag.js do Google Analytics 4 diretamente.
 * Dispara page_view automático e permite eventos via gtag().
 */
export function GoogleAnalyticsScript() {
  return (
    <>
      <Script
        id="ga-script"
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
      />
      <Script
        id="ga-init"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GA_ID}');`,
        }}
      />
    </>
  );
}
