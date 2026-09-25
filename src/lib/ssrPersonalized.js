// Whether the server rendered this document as the signed-in customer. It decides
// one thing: can the hydrated cache be trusted for prices, or must the catalog be
// re-fetched. False for guests, a rejected token, and prerendered pages — one shared
// document can never be personal.
//
// Only the hydrated cache is in question; anything fetched after boot went through
// the browser's own link, which attaches the token.
const personalized = typeof window !== 'undefined'
  ? Boolean(window.__INITIAL_DATA__?.personalized)
  : false;

export const isSsrPersonalized = () => personalized;