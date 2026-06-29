import NextAuth from 'next-auth';
import { authConfig } from '@/lib/auth';

const handler = NextAuth(authConfig);

export const GET = (req: Request, context: { params: Promise<{ nextauth: string[] }> }) => handler(req as never, context as never);
export const POST = (req: Request, context: { params: Promise<{ nextauth: string[] }> }) => handler(req as never, context as never);
