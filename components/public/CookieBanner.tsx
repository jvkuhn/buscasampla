"use client";

import Link from "next/link";
import { useCookieConsent } from "@/lib/cookie-consent";

export function CookieBanner() {
  const { consent, hasLoaded, accept, reject } = useCookieConsent();

  // Não renderiza nada até o estado do localStorage ser lido — evita
  // flash do banner em visitantes recorrentes.
  if (!hasLoaded) return null;

  // Usuário já decidiu em visita anterior.
  if (consent !== null) return null;

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Consentimento de cookies"
      className="fixed inset-x-0 bottom-0 z-50 p-4 md:inset-x-auto md:right-4 md:bottom-4 md:max-w-md"
    >
      <div className="rounded-xl border border-gray-200 bg-white shadow-lg p-5">
        <p className="text-sm text-gray-700 leading-relaxed">
          Usamos cookies para analisar a audiência e melhorar sua experiência. Você pode aceitar ou recusar.{" "}
          <Link
            href="/p/politica-de-cookies"
            className="underline hover:text-blue-600"
          >
            Saiba mais
          </Link>
          .
        </p>
        <div className="mt-4 flex items-center gap-2 justify-end">
          <button
            type="button"
            onClick={reject}
            className="px-4 py-2 rounded-lg text-sm font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
          >
            Recusar
          </button>
          <button
            type="button"
            onClick={accept}
            autoFocus
            className="px-4 py-2 rounded-lg text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-colors"
          >
            Aceitar
          </button>
        </div>
      </div>
    </div>
  );
}
