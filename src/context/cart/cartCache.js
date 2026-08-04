const CART_CACHE_KEY = (cartId) => `cartData:${cartId}`;
const CART_CACHE_TTL_MS = 30 * 60 * 1000;

export const readCartCache = (cartId) => {
  if (!cartId || typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(CART_CACHE_KEY(cartId));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.cart || !parsed?.at) return null;
    if (Date.now() - parsed.at > CART_CACHE_TTL_MS) {
      localStorage.removeItem(CART_CACHE_KEY(cartId));
      return null;
    }
    return parsed.cart;
  } catch { return null; }
};

export const writeCartCache = (cartId, cart) => {
  if (!cartId || !cart || typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(CART_CACHE_KEY(cartId), JSON.stringify({ at: Date.now(), cart }));
  } catch { }
};

export const clearCartCache = (cartId) => {
  if (!cartId || typeof localStorage === 'undefined') return;
  try { localStorage.removeItem(CART_CACHE_KEY(cartId)); } catch {}
};
