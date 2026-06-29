import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { removeRegistration } from '@/services/registration-service';

const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = await getToken({ req, secret });
  if (!token?.sub || token.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    await removeRegistration(id);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Registration not found' }, { status: 404 });
  }
}
