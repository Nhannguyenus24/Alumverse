/**
 * Decode JWT payload without verification (for reading claims on client).
 * Do not use for security decisions; backend validates the token.
 * @param {string} token - JWT access token
 * @returns {{ sub?: number, email?: string, studentId?: string, avatarUrl?: string } | null}
 */
function decodeJwtPayload(token) {
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
      studentId: parsed.studentId,
      avatarUrl: parsed.avatar ?? parsed.avatarUrl,
      role: parsed.role,
      organizationId: parsed.organizationId != null ? Number(parsed.organizationId) : undefined,
      exp: parsed.exp,
    };
  } catch {
    return null;
  }
}

/**
 * Build auth user from access token (for store).
 * @param {string} token - JWT access token
 * @returns {{ id: number, email?: string, studentId?: string, avatarUrl?: string } | null}
 */
export function userFromAccessToken(token) {
  if (!token) return null;
  const payload = decodeJwtPayload(token);
  if (!payload || payload.sub == null) return null;
  return {
    id: payload.sub,
    email: payload.email,
    studentId: payload.studentId,
    avatarUrl: payload.avatarUrl,
    role: payload.role,
    organizationId: payload.organizationId,
  };
}

/**
 * Check if token is expired
 * @param {string} token - JWT access token
 * @returns {boolean} true if token is expired, false otherwise
 */
/** Skew (seconds) so we refresh slightly before true expiry and avoid race with the server clock. */
export function isTokenExpired(token, skewSeconds = 60) {
  if (!token) return true;
  const payload = decodeJwtPayload(token);
  if (!payload || !payload.exp) return true;
  const skewMs = Math.max(0, skewSeconds) * 1000;
  return Date.now() >= payload.exp * 1000 - skewMs;
}

/**
 * Get seconds until token expires
 * @param {string} token - JWT access token
 * @returns {number} seconds until expiration, 0 if already expired or invalid
 */
export function getSecondsUntilExpire(token) {
  if (!token) return 0;
  const payload = decodeJwtPayload(token);
  if (!payload || !payload.exp) return 0;
  const secondsUntilExpire = Math.floor(payload.exp - Date.now() / 1000);
  return Math.max(0, secondsUntilExpire);
}

