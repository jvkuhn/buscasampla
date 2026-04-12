"use client";

import { useCookieConsent } from "@/lib/cookie-consent";
import { GTMNoScript } from "@/components/public/GoogleTagManager";

/**
 * Client wrapper que gateia o GTMNoScript por consentimento de cookies.
 * Só monta o <noscript> iframe do GTM depois que o usuário aceita cookies.
 * Satisfaz LGPD Art. 7º + 8º mesmo no edge case de JS desativado.
 */
export function GTMNoScriptGate({ gtmId }: { gtmId: string }) {
  const { consent, hasLoaded } = useCookieConsent();

  if (!hasLoaded) return null;
  if (consent !== "accepted") return null;

  return <GTMNoScript gtmId={gtmId} />;
}
