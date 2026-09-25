// The customer token reaches the server as a cookie and nowhere else.
// Names and parsing are shared with the client so the two cannot drift apart.
import { TOKEN_COOKIE, readCookieFrom } from '../src/lib/cookies.js';
import { isJwtExpired } from '../src/lib/jwt.js';

// Magento answers a catalog query carrying a dead token like a guest — 200, no error —
// so a rejected token is invisible to the render, and marking that page personalized
// would leave the browser trusting guest prices it never re-fetches. The token is a
// JWT, so check its expiry here and render as a guest once it has passed.
export function readCustomerTokenCookie(req) {
  const value = readCookieFrom(req.headers?.cookie, TOKEN_COOKIE);
  return value && !isJwtExpired(value) ? value : null;
}