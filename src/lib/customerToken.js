// The customer token lives in exactly one place: a cookie — that is the only way
// the SSR server can see it and render the catalog with the customer's prices.
// Not httpOnly: authLink reads it for every GraphQL call, same exposure localStorage had.
import { TOKEN_COOKIE, readCookie, writeCookie, deleteCookie } from './cookies';
import { jwtExpiresAt, isJwtExpired } from './jwt';

const isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined';

export const readCustomerToken = () => readCookie(TOKEN_COOKIE);

// False means the browser refused the cookie — with nothing behind it, that is a
// failed sign-in, so callers must surface it.
export const writeCustomerToken = (token) => {
  if (!token) return false;
  // Match the cookie's life to the token's own; without Max-Age it would be a
  // session cookie and sign the customer out on every browser close.
  const expiresAt = jwtExpiresAt(token);
  if (expiresAt === null) return writeCookie(TOKEN_COOKIE, token);
  const maxAgeMs = expiresAt - Date.now();
  if (maxAgeMs <= 0) return false;
  return writeCookie(TOKEN_COOKIE, token, { maxAgeMs });
};

export const clearCustomerToken = () => deleteCookie(TOKEN_COOKIE);

// Sessions from before the move still hold the token in localStorage. Move it over,
// dropping the old copy only once the cookie is verifiably in place. Safe to delete
// a release later, when every old token has expired anyway.
const LEGACY_TOKEN_KEY = 'customerToken';

export const migrateLegacyCustomerToken = () => {
  if (!isBrowser) return;
  if (readCustomerToken()) {
    try { localStorage.removeItem(LEGACY_TOKEN_KEY); } catch {}
    return;
  }

  let legacy = null;
  try { legacy = localStorage.getItem(LEGACY_TOKEN_KEY); } catch { return; }
  if (!legacy) return;

  if (isJwtExpired(legacy) || writeCustomerToken(legacy)) {
    try { localStorage.removeItem(LEGACY_TOKEN_KEY); } catch {}
  }
};