"use client";

import { openCookieBanner } from "@/lib/cookie-consent";

export function ManageCookiesButton() {
  return (
    <button
      type="button"
      onClick={openCookieBanner}
      className="hover:text-blue-600 transition-colors"
    >
      Gerenciar cookies
    </button>
  );
}
