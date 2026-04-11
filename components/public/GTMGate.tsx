"use client";

import { useCookieConsent } from "@/lib/cookie-consent";
import { GTMHead } from "@/components/public/GoogleTagManager";

/**
 * Client wrapper que gateia o GTMHead por consentimento de cookies.
 * Só monta o <Script> do Google Tag Manager depois que o usuário
 * clica "Aceitar" no banner. Satisfaz LGPD Art. 7º + 8º.
 */
export function GTMGate({ gtmId }: { gtmId: string }) {
  const { consent, hasLoaded } = useCookieConsent();

  // Aguarda o hook ler o localStorage — não carrega GTM sem saber a preferência.
  if (!hasLoaded) return null;
  if (consent !== "accepted") return null;

  return <GTMHead gtmId={gtmId} />;
}
