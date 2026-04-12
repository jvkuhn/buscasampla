import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { db } from "@/lib/db";
import { z } from "zod";
import { authConfig } from "@/lib/auth.config";
import { checkRateLimit, recordFailedAttempt, clearRateLimit } from "@/lib/rate-limit";

const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(6),
});

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;
        const key = email.toLowerCase();

        // Bloqueio por brute-force. Se a chave está bloqueada, log server-side
        // e retorna null (usuário vê mensagem genérica de credenciais inválidas).
        const limit = checkRateLimit(key);
        if (!limit.allowed) {
          console.warn(
            `[auth] login bloqueado por rate-limit: ${key} (retryAfter=${limit.retryAfterSec}s)`
          );
          return null;
        }

        const user = await db.user.findUnique({ where: { email } });
        if (!user) {
          recordFailedAttempt(key);
          return null;
        }

        const valid = await compare(password, user.password);
        if (!valid) {
          recordFailedAttempt(key);
          return null;
        }

        // Sucesso — limpa histórico de tentativas
        clearRateLimit(key);
        return { id: user.id, name: user.name, email: user.email, role: user.role };
      },
    }),
  ],
});
