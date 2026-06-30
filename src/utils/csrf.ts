import { randomBytes } from 'crypto';

export function createCsrfToken() {
  return randomBytes(24).toString('hex');
}

export function getCsrfTokenFromRequest(req: Request) {
  return req.headers.get('x-csrf-token') ?? req.headers.get('x-xsrf-token');
}
