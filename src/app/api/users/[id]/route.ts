import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { CannotDeleteSelfError, deleteManagedUser, updateManagedUser, UserAlreadyExistsError, UserNotFoundError } from '@/services/user-service';

const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = await getToken({ req, secret });
  if (!token || token.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { id } = await params;
  const body = await req.json();
  try {
    const user = await updateManagedUser(id, body);
    return NextResponse.json(user);
  } catch (error) {
    if (error instanceof UserAlreadyExistsError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    if (error instanceof UserNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    const message = error instanceof Error ? error.message : 'Invalid user data';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = await getToken({ req, secret });
  if (!token || token.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { id } = await params;
  try {
    const result = await deleteManagedUser(id, token.sub as string);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof CannotDeleteSelfError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (error instanceof UserNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    const message = error instanceof Error ? error.message : 'Unable to delete user';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
