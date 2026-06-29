import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { registerPerson, getAllRegistrations, getRegistrationsForOperator, RegistrationAlreadyExistsError } from '@/services/registration-service';
import { verifyCsrf } from '@/utils/csrf';

const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;

export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret });
  if (!token?.sub) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!verifyCsrf(req)) return NextResponse.json({ error: 'Invalid CSRF token' }, { status: 403 });

  const body = await req.json();
  try {
    const result = await registerPerson({
      firstName: body.firstName,
      lastName: body.lastName,
      nationalId: body.nationalId,
      operatorId: token.sub,
    });
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof RegistrationAlreadyExistsError) {
      return NextResponse.json({ error: error.message, details: error.details }, { status: 409 });
    }
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret });
  if (!token?.sub) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (token.role === 'ADMIN') {
    const registrations = await getAllRegistrations();
    return NextResponse.json(registrations);
  }
  const registrations = await getRegistrationsForOperator(token.sub);
  return NextResponse.json(registrations);
}
