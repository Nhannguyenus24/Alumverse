/**
 * Decode JWT payload without verification (for reading claims on client).
 * Do not use for security decisions; backend validates the token.
 * @param {string} token - JWT access token
 * @returns {{ sub?: number, email?: string, userName?: string, avatarUrl?: string } | null}
 */
export function decodeJwtPayload(token) {
  if (!token || typeof token !== 'string') return null;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = parts[1];
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    const parsed = JSON.parse(decoded);
    return {
      sub: parsed.sub != null ? Number(parsed.sub) : undefined,
      email: parsed.email,
      userName: parsed.username ?? parsed.userName,
      avatarUrl: parsed.avatar ?? parsed.avatarUrl,
      role: parsed.role,
    };
  } catch {
    return null;
  }
}

/**
 * Build auth user from access token (for store).
 * @param {string} token - JWT access token
 * @returns {{ id: number, email?: string, userName?: string, avatarUrl?: string } | null}
 */
export function userFromAccessToken(token) {
  if (!token) return null;
  const payload = decodeJwtPayload(token);
  if (!payload || payload.sub == null) return null;
  return {
    id: payload.sub,
    email: payload.email,
    userName: payload.userName,
    avatarUrl: payload.avatarUrl,
    role: payload.role,
  };
}
