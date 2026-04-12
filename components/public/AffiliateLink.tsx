"use client";

interface Props {
  href: string;
  platform: string;
  productName: string;
  productId?: string;
  className?: string;
  children: React.ReactNode;
}

export function AffiliateLink({ href, platform, productName, productId, className, children }: Props) {
  function handleClick() {
    if (typeof window === "undefined") return;

    // Evento GTM (dataLayer)
    if (window.dataLayer) {
      window.dataLayer.push({
        event: "affiliate_click",
        affiliate_platform: platform,
        affiliate_product: productName,
        affiliate_url: href,
      });
    }

    // Evento GA4 via gtag — rastreio de conversão de clique
    if (window.gtag) {
      window.gtag("event", "affiliate_click", {
        event_category: "affiliate",
        event_label: productName,
        affiliate_platform: platform,
        affiliate_url: href,
      });
    }

    // Registra clique no banco de dados (fire-and-forget)
    fetch("/api/clicks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, productName, platform, url: href }),
    }).catch(() => {});
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer sponsored nofollow"
      onClick={handleClick}
      className={className}
    >
      {children}
    </a>
  );
}
