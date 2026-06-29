import { afterEach, describe, expect, it, vi } from 'vitest';
import { verifyCsrf } from './csrf';

describe('CSRF verification', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('allows non-production requests without a token', () => {
    vi.stubEnv('NODE_ENV', 'development');

    const req = new Request('https://example.com');

    expect(verifyCsrf(req)).toBe(true);
  });

  it('accepts matching production header and cookie tokens', () => {
    vi.stubEnv('NODE_ENV', 'production');

    const req = new Request('https://example.com', {
      headers: {
        cookie: 'csrf-token=token-123',
        'x-csrf-token': 'token-123',
      },
    });

    expect(verifyCsrf(req)).toBe(true);
  });

  it('rejects missing or mismatched production tokens', () => {
    vi.stubEnv('NODE_ENV', 'production');

    const missing = new Request('https://example.com');
    const mismatched = new Request('https://example.com', {
      headers: {
        cookie: 'csrf-token=cookie-token',
        'x-csrf-token': 'header-token',
      },
    });

    expect(verifyCsrf(missing)).toBe(false);
    expect(verifyCsrf(mismatched)).toBe(false);
  });
});
