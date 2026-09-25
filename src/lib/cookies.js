// Cookie plumbing shared by the browser and the SSR server.
// Prefixed because Magento sets its own `customer_token` cookie and the storefront
// can sit on the same domain.
export const TOKEN_COOKIE = 'storefront_customer_token';

const isBrowser = typeof document !== 'undefined';

// `document.cookie` and Node's `Cookie:` header share one format, so one parser
// serves both sides.
export function readCookieFrom(header, name) {
  if (!header) return null;
  for (const part of header.split(';')) {
    const eq = part.indexOf('=');
    if (eq === -1) continue;
    if (part.slice(0, eq).trim() !== name) continue;
    const value = part.slice(eq + 1).trim();
    if (!value) return null;
    try { return decodeURIComponent(value); } catch { return value; }
  }
  return null;
}

export const readCookie = (name) => (isBrowser ? readCookieFrom(document.cookie, name) : null);

const attributes = () => {
  const secure = isBrowser && window.location.protocol === 'https:' ? '; Secure' : '';
  return `; Path=/; SameSite=Lax${secure}`;
};

// False when the browser silently dropped the write (cookies disabled, jar full).
// Assigning to `document.cookie` never throws, so reading it back is the only check.
export function writeCookie(name, value, { maxAgeMs } = {}) {
  if (!isBrowser || !value) return false;
  const maxAge = typeof maxAgeMs === 'number' ? `; Max-Age=${Math.floor(maxAgeMs / 1000)}` : '';
  try {
    document.cookie = `${name}=${encodeURIComponent(value)}${attributes()}${maxAge}`;
  } catch {
    return false;
  }
  return readCookie(name) === value;
}

export function deleteCookie(name) {
  if (!isBrowser) return;
  try {
    document.cookie = `${name}=${attributes()}; Max-Age=0`;
  } catch {}
}