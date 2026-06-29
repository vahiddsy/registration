import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

export async function POST() {
  const existing = await prisma.user.findUnique({ where: { username: 'admin' } });
  if (!existing) {
    const passwordHash = await bcrypt.hash('admin123', 10);
    await prisma.user.create({
      data: {
        fullname: 'System Administrator',
        username: 'admin',
        passwordHash,
        role: 'ADMIN',
        active: true,
        forcePasswordChange: true,
      },
    });
  }
  return NextResponse.json({ ok: true });
}
