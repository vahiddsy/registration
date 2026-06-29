import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { createManagedUser, getUsers, UserAlreadyExistsError } from '@/services/user-service';

export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET });
  if (!token || token.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const users = await getUsers();
  return NextResponse.json(users);
}

export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET });
  if (!token || token.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const body = await req.json();
  try {
    const user = await createManagedUser(body);
    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    if (error instanceof UserAlreadyExistsError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    const message = error instanceof Error ? error.message : 'Invalid user data';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
