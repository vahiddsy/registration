import { describe, expect, it } from 'vitest';
import { checkRateLimit, clearRateLimit } from './rate-limit';

describe('rate limit', () => {
  it('blocks requests after the configured limit', () => {
    const key = 'rate-limit:test-blocks';
    clearRateLimit(key);

    expect(checkRateLimit(key, { maxRequests: 2, windowMs: 60_000 })).toBe(true);
    expect(checkRateLimit(key, { maxRequests: 2, windowMs: 60_000 })).toBe(true);
    expect(checkRateLimit(key, { maxRequests: 2, windowMs: 60_000 })).toBe(false);
  });

  it('allows requests again after clearing the key', () => {
    const key = 'rate-limit:test-clears';
    clearRateLimit(key);

    expect(checkRateLimit(key, { maxRequests: 1, windowMs: 60_000 })).toBe(true);
    expect(checkRateLimit(key, { maxRequests: 1, windowMs: 60_000 })).toBe(false);

    clearRateLimit(key);
    expect(checkRateLimit(key, { maxRequests: 1, windowMs: 60_000 })).toBe(true);
  });
});
