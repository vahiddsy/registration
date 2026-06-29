import { randomBytes } from 'crypto';

export function createCsrfToken() {
  return randomBytes(24).toString('hex');
}

export function getCsrfTokenFromRequest(req: Request) {
  return req.headers.get('x-csrf-token') ?? req.headers.get('x-xsrf-token');
}

export function verifyCsrf(req: Request) {
  if (process.env.NODE_ENV !== 'production') return true;

  const headerToken = getCsrfTokenFromRequest(req);
  const cookieHeader = req.headers.get('cookie') ?? '';
  const cookieToken = cookieHeader.split(';').map((entry) => entry.trim()).find((entry) => entry.startsWith('csrf-token='))?.split('=')[1];

  return Boolean(headerToken && cookieToken && headerToken === cookieToken);
}
