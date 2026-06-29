import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import { getToken } from 'next-auth/jwt';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET });
  if (!token?.sub) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { password } = await req.json();
  if (!password || password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.update({
    where: { id: token.sub },
    data: { passwordHash, forcePasswordChange: false },
  });

  return NextResponse.json({ ok: true });
}
