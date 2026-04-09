"use client";

interface Props {
  href: string;
  platform: string;
  productName: string;
  className?: string;
  children: React.ReactNode;
}

export function AffiliateLink({ href, platform, productName, className, children }: Props) {
  function handleClick() {
    if (typeof window !== "undefined" && window.dataLayer) {
      window.dataLayer.push({
        event: "affiliate_click",
        affiliate_platform: platform,
        affiliate_product: productName,
        affiliate_url: href,
      });
    }
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
