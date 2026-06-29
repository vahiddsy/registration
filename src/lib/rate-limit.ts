const loginAttempts = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(key: string, options: { maxRequests: number; windowMs: number }) {
  const now = Date.now();
  const entry = loginAttempts.get(key);

  if (!entry || entry.resetAt <= now) {
    loginAttempts.set(key, { count: 1, resetAt: now + options.windowMs });
    return true;
  }

  if (entry.count >= options.maxRequests) {
    return false;
  }

  entry.count += 1;
  loginAttempts.set(key, entry);
  return true;
}

export function clearRateLimit(key: string) {
  loginAttempts.delete(key);
}
