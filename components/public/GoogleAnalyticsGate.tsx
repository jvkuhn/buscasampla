"use client";

import { useCookieConsent } from "@/lib/cookie-consent";
import { GoogleAnalyticsScript } from "@/components/public/GoogleAnalytics";

/**
 * Client wrapper que gateia o Google Analytics por consentimento de cookies.
 * Só carrega o gtag.js depois que o usuário aceita cookies (LGPD).
 */
export function GoogleAnalyticsGate() {
  const { consent, hasLoaded } = useCookieConsent();

  if (!hasLoaded) return null;
  if (consent !== "accepted") return null;

  return <GoogleAnalyticsScript />;
}
