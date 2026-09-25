// Magento customer tokens are JWTs; both ends read their expiry — the browser to
// give the cookie a matching Max-Age, the server to skip a token Magento will ignore.
const decodePayload = (token) => {
  const segment = typeof token === 'string' ? token.split('.')[1] : null;
  if (!segment) return null;
  const b64 = segment.replace(/-/g, '+').replace(/_/g, '/');
  // JWT segments drop base64 padding; atob insists on it. Node has a global atob.
  const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4);
  const json = typeof atob === 'function'
    ? atob(padded)
    : Buffer.from(padded, 'base64').toString('binary');
  return JSON.parse(json);
};

// Milliseconds since epoch, or null when the token carries no usable `exp`.
export function jwtExpiresAt(token) {
  try {
    const exp = decodePayload(token)?.exp;
    return typeof exp === 'number' ? exp * 1000 : null;
  } catch {
    return null;
  }
}

// Unusable: not a JWT we can read, or past its own expiry. No `exp` — let Magento judge.
export function isJwtExpired(token) {
  let payload;
  try {
    payload = decodePayload(token);
  } catch {
    return true;
  }
  if (!payload) return true;
  if (typeof payload.exp !== 'number') return false;
  return payload.exp * 1000 <= Date.now();
}