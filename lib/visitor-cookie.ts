/**
 * Gera ou le o visitorId do cookie "bs-vid".
 * Cookie first-party analitico — UUID anonimo para agrupar page views por visitante.
 * Sem dados pessoais, sem compartilhamento com terceiros.
 */

const COOKIE_NAME = "bs-vid";
const MAX_AGE = 60 * 60 * 24 * 365; // 1 ano em segundos

export function getOrCreateVisitorId(): string {
  if (typeof document === "undefined") return "";

  // Tenta ler cookie existente
  const match = document.cookie.match(new RegExp(`(?:^|; )${COOKIE_NAME}=([^;]*)`));
  if (match) return decodeURIComponent(match[1]);

  // Gera novo UUID
  const id = crypto.randomUUID();
  document.cookie = `${COOKIE_NAME}=${id}; path=/; max-age=${MAX_AGE}; SameSite=Lax`;
  return id;
}
