import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { searchRegistrationData } from '@/services/registration-service';

const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;

export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret });
  if (!token?.sub) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const query = searchParams.get('q') ?? '';
  const registrations = await searchRegistrationData(query, { role: token.role as string, operatorId: token.sub });
  return NextResponse.json(registrations);
}
