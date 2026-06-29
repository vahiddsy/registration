import NextAuth, { type DefaultSession, type NextAuthOptions } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { checkRateLimit, clearRateLimit } from '@/lib/rate-limit';
import type { UserRole } from '@/types/auth';

type CustomSessionUser = DefaultSession['user'] & {
  id: string;
  fullname: string;
  username: string;
  role: UserRole;
  active: boolean;
  forcePasswordChange: boolean;
};

declare module 'next-auth' {
  interface Session {
    user: CustomSessionUser;
  }

  interface User {
    fullname: string;
    username: string;
    role: UserRole;
    active: boolean;
    forcePasswordChange: boolean;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: UserRole;
    fullname: string;
    username: string;
    active: boolean;
    forcePasswordChange: boolean;
  }
}

const credentialsSchema = z.object({
  username: z.string().trim().min(1),
  password: z.string().min(1),
});

export const authSecret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET ?? 'dev-secret';

function authDebug(message: string, details?: Record<string, unknown>) {
  if (process.env.AUTH_DEBUG !== 'true') return;
  console.log(`[auth] ${message}`, details ?? '');
}

function getRequestHeader(request: unknown, name: string) {
  const headers = (request as { headers?: Headers | Record<string, string | string[] | undefined> } | undefined)?.headers;
  if (!headers) return null;

  if (typeof (headers as Headers).get === 'function') {
    return (headers as Headers).get(name);
  }

  const value = (headers as Record<string, string | string[] | undefined>)[name.toLowerCase()] ?? (headers as Record<string, string | string[] | undefined>)[name];
  return Array.isArray(value) ? value[0] : value ?? null;
}

export const authConfig = {
  secret: authSecret,
  debug: process.env.AUTH_DEBUG === 'true',
  logger: {
    error(code, metadata) {
      console.log('[next-auth][error]', code, metadata ?? '');
    },
    warn(code) {
      console.log('[next-auth][warn]', code);
    },
    debug(code, metadata) {
      if (process.env.AUTH_DEBUG !== 'true') return;
      console.log('[next-auth][debug]', code, metadata ?? '');
    },
  },
  session: { strategy: 'jwt' as const },
  pages: { signIn: '/login' },
  providers: [
    Credentials({
      name: 'Credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials, request) {
        try {
          const parsed = credentialsSchema.safeParse(credentials);
          if (!parsed.success) {
            authDebug('credentials parse failed', {
              issues: parsed.error.issues.map((issue) => ({ path: issue.path, message: issue.message })),
            });
            return null;
          }

          const forwarded = getRequestHeader(request, 'x-forwarded-for')?.split(',')[0] ?? getRequestHeader(request, 'x-real-ip') ?? 'unknown';
          const rateKey = `${forwarded}:${parsed.data.username.toLowerCase()}`;
          authDebug('authorize started', {
            username: parsed.data.username,
            forwarded,
            databaseUrl: process.env.DATABASE_URL,
            nodeEnv: process.env.NODE_ENV,
          });

          if (!checkRateLimit(rateKey, { maxRequests: 5, windowMs: 15 * 60 * 1000 })) {
            authDebug('rate limit blocked', { username: parsed.data.username, forwarded });
            return null;
          }

          const user = await prisma.user.findUnique({ where: { username: parsed.data.username } });

          if (!user) {
            authDebug('user not found', { username: parsed.data.username });
            return null;
          }

          if (!user.active) {
            authDebug('user inactive', { username: user.username, role: user.role });
            return null;
          }

          const valid = await bcrypt.compare(parsed.data.password, user.passwordHash);
          if (!valid) {
            authDebug('password mismatch', { username: user.username, role: user.role });
            return null;
          }

          clearRateLimit(rateKey);
          await prisma.user.update({ where: { id: user.id }, data: { lastLogin: new Date() } });
          authDebug('authorize succeeded', { username: user.username, role: user.role, active: user.active });

          return {
            id: user.id,
            fullname: user.fullname,
            username: user.username,
            role: user.role as UserRole,
            active: user.active,
            forcePasswordChange: user.forcePasswordChange,
          };
        } catch (error) {
          authDebug('authorize crashed', {
            error: error instanceof Error ? error.message : String(error),
          });
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role as UserRole;
        token.fullname = user.fullname as string;
        token.username = user.username as string;
        token.active = user.active as boolean;
        token.forcePasswordChange = user.forcePasswordChange as boolean;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub as string;
        session.user.role = token.role as UserRole;
        session.user.fullname = token.fullname as string;
        session.user.username = token.username as string;
        session.user.active = token.active as boolean;
        session.user.forcePasswordChange = token.forcePasswordChange as boolean;
      }
      return session;
    },
  },
} satisfies NextAuthOptions;

export const { handlers, signIn, signOut, auth } = NextAuth(authConfig);
