import type { NextAuthConfig } from "next-auth";

/**
 * Config edge-safe do Auth.js (sem Prisma / sem bcryptjs).
 * Usada pelo middleware. O provider Credentials de verdade
 * vive em lib/auth.ts e roda em Node runtime.
 */
export const authConfig = {
  providers: [],
  pages: {
    signIn: "/admin/login",
  },
  session: { strategy: "jwt" },
  callbacks: {
    authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user;
      const isAdmin = request.nextUrl.pathname.startsWith("/admin");
      const isLogin = request.nextUrl.pathname === "/admin/login";
      if (isAdmin && !isLogin && !isLoggedIn) return false;
      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role;
      }
      return token;
    },
    session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        (session.user as { role?: string }).role = token.role as string;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
