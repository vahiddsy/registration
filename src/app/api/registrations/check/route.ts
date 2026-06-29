import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { findRegistrationByNationalId } from '@/repositories/registration-repository';

const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;

export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret });
  if (!token?.sub) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const nationalId = searchParams.get('nationalId');
  if (!nationalId || !/^\d{10}$/.test(nationalId)) {
    return NextResponse.json({ error: 'Invalid national ID' }, { status: 400 });
  }

  const registration = await findRegistrationByNationalId(nationalId);
  if (registration) {
    return NextResponse.json({
      exists: true,
      registration: {
        nationalId: registration.nationalId,
        firstName: registration.firstName,
        lastName: registration.lastName,
        operatorName: registration.operator.fullname,
        createdAt: registration.createdAt,
      },
    });
  }

  return NextResponse.json({ exists: false });
}
