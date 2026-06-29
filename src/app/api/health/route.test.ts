import { describe, it, expect } from 'vitest';

describe('health API', () => {
  it('returns ok', async () => {
    const { GET } = await import('./route');
    const response = await GET();
    const data = await response.json();
    expect(data).toEqual({ ok: true });
  });
});
