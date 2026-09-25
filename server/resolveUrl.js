import { resolveUrlRewrite } from './resolveUrlRewrite.js';

/**
 * Resolves a storefront path to its catalog entity, server-side only — the
 * browser never issues a resolve request of its own.
 *
 * Every path goes through a `url_rewrite` lookup in the Magento DB, so
 * categories, products, CMS pages and redirects all resolve the same way.
 *
 * @param {string} pathname
 * @returns {Promise<{path: string, data: object|null}|null>}
 */
export async function resolveUrl(pathname) {
  return resolveUrlRewrite(pathname).catch(() => null);
}

/**
 * Flattens a resolved URL into the router state hint consumed by entry-server.
 *
 * @param {{path: string, data: object|null}|null} resolvedUrl
 * @returns {object|null}
 */
export function toRouteHint(resolvedUrl) {
  return resolvedUrl?.data ? { ...resolvedUrl.data, path: resolvedUrl.path } : null;
}