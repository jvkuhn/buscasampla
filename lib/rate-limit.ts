/**
 * Rate limiter in-memory pra brute-force em login.
 *
 * Storage: Map em memória, scopado por instância serverless. Na Vercel, cada
 * instância tem seu próprio Map, mas:
 * - Vercel roteia por afinidade; mesmo IP/usuário costuma cair na mesma instância
 * - Brute-force geralmente vem de uma única origem, então mesmo split entre
 *   instâncias ainda reduz muito a taxa efetiva
 * - Para um site com 1-2 admins, é proporcional ao risco
 *
 * Se no futuro tiver muito tráfego ou atacantes distribuídos, migrar pra Upstash
 * Redis ou Vercel KV (mesma API, só trocar o storage).
 */

type Attempt = {
  count: number;
  firstFailAt: number;
  blockedUntil?: number;
};

const attempts = new Map<string, Attempt>();

const WINDOW_MS = 5 * 60 * 1000; // 5 minutos
const MAX_ATTEMPTS = 5; // 5 falhas na janela
const BLOCK_MS = 15 * 60 * 1000; // 15 minutos de bloqueio

/**
 * Limpa entradas velhas quando o Map passa de 1000 keys, pra não vazar memória
 * em um processo long-running. Chamada dentro de checkRateLimit().
 */
function sweepIfNeeded(now: number) {
  if (attempts.size < 1000) return;
  for (const [key, entry] of attempts.entries()) {
    const expired =
      (entry.blockedUntil && now > entry.blockedUntil) ||
      (!entry.blockedUntil && now - entry.firstFailAt > WINDOW_MS);
    if (expired) attempts.delete(key);
  }
}

/**
 * Verifica se a chave (ex: email normalizado) está bloqueada.
 * Retorna { allowed: false, retryAfterSec } se bloqueado.
 */
export function checkRateLimit(
  key: string
): { allowed: true } | { allowed: false; retryAfterSec: number } {
  const now = Date.now();
  sweepIfNeeded(now);

  const entry = attempts.get(key);
  if (!entry) return { allowed: true };

  // Expirou bloqueio → limpa e libera
  if (entry.blockedUntil && now > entry.blockedUntil) {
    attempts.delete(key);
    return { allowed: true };
  }

  // Dentro de bloqueio ativo
  if (entry.blockedUntil && now <= entry.blockedUntil) {
    return {
      allowed: false,
      retryAfterSec: Math.ceil((entry.blockedUntil - now) / 1000),
    };
  }

  // Janela de contagem expirou sem atingir o limite → limpa e libera
  if (now - entry.firstFailAt > WINDOW_MS) {
    attempts.delete(key);
    return { allowed: true };
  }

  return { allowed: true };
}

/**
 * Registra uma tentativa com falha. Quando atinge MAX_ATTEMPTS na janela,
 * coloca a chave em bloqueio por BLOCK_MS.
 */
export function recordFailedAttempt(key: string): void {
  const now = Date.now();
  const entry = attempts.get(key);

  if (!entry) {
    attempts.set(key, { count: 1, firstFailAt: now });
    return;
  }

  // Se a janela já passou, reinicia a contagem
  if (now - entry.firstFailAt > WINDOW_MS && !entry.blockedUntil) {
    attempts.set(key, { count: 1, firstFailAt: now });
    return;
  }

  entry.count += 1;
  if (entry.count >= MAX_ATTEMPTS) {
    entry.blockedUntil = now + BLOCK_MS;
    console.warn(`[rate-limit] key bloqueada por ${BLOCK_MS / 1000}s: ${key}`);
  }
}

/**
 * Limpa o estado da chave após um sucesso. Chama quando o login passa.
 */
export function clearRateLimit(key: string): void {
  attempts.delete(key);
}
