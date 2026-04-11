"use client";

import { useEffect, useState } from "react";

export type ConsentState = "accepted" | "rejected" | null;

const STORAGE_KEY = "bs-consent";
const RESET_EVENT = "bs:consent-reset";
const UPDATE_EVENT = "bs:consent-update";

function readStorage(): ConsentState {
  if (typeof window === "undefined") return null;
  try {
    const v = window.localStorage.getItem(STORAGE_KEY);
    return v === "accepted" || v === "rejected" ? v : null;
  } catch {
    return null;
  }
}

function writeStorage(value: ConsentState) {
  if (typeof window === "undefined") return;
  try {
    if (value === null) {
      window.localStorage.removeItem(STORAGE_KEY);
    } else {
      window.localStorage.setItem(STORAGE_KEY, value);
    }
    window.dispatchEvent(new CustomEvent(UPDATE_EVENT));
  } catch {
    // modo privado, quota excedida, etc. — silenciosamente ignora
  }
}

/**
 * Hook reativo para o estado de consentimento de cookies.
 *
 * SSR-safe: durante o primeiro render (server + cliente), retorna
 * `consent: null` e `hasLoaded: false`. Só após o useEffect de
 * montagem é que o localStorage é lido — evitando mismatch de
 * hidratação e flashes do banner em visitantes recorrentes.
 *
 * Consumidores devem tratar `hasLoaded === false` como "carregando"
 * e não renderizar nada (ou um placeholder invisível).
 */
export function useCookieConsent(): {
  consent: ConsentState;
  hasLoaded: boolean;
  accept: () => void;
  reject: () => void;
} {
  const [consent, setConsent] = useState<ConsentState>(null);
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- leitura de localStorage na montagem é o padrão SSR-safe correto aqui
    setConsent(readStorage());
    setHasLoaded(true);

    const onUpdate = () => setConsent(readStorage());
    const onReset = () => setConsent(null);

    window.addEventListener(UPDATE_EVENT, onUpdate);
    window.addEventListener(RESET_EVENT, onReset);

    return () => {
      window.removeEventListener(UPDATE_EVENT, onUpdate);
      window.removeEventListener(RESET_EVENT, onReset);
    };
  }, []);

  return {
    consent,
    hasLoaded,
    accept: () => writeStorage("accepted"),
    reject: () => writeStorage("rejected"),
  };
}

/**
 * Limpa o consentimento armazenado e dispara o evento de reset,
 * fazendo o CookieBanner reaparecer para o usuário reescolher.
 * Chamado a partir do botão "Gerenciar cookies" no footer.
 */
export function openCookieBanner() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
  window.dispatchEvent(new CustomEvent(RESET_EVENT));
}
