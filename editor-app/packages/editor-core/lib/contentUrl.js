/* global __STATIC_BASE__ */
// Set by the storefront's vite.config.js from STATIC_BASE. Missing in the
// editor build, which serves these files from the root.
const BASE = typeof __STATIC_BASE__ === 'string' ? __STATIC_BASE__ : '/';

/**
 * URL of an image picked in the editor. Theme images (`/images/...`) and
 * uploads (`/uploads/...`) follow the build's prefix; anything else is returned
 * as is. The content itself keeps the unprefixed path.
 *
 * @param {string} url
 * @returns {string}
 */
export const contentUrl = (url) =>
  typeof url === 'string' && /^\/(?:images|uploads)\//.test(url) ? BASE + url.slice(1) : url;
