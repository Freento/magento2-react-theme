const GRAPHQL_URL = '/graphql';

const ROUTE_FIELDS = `__typename
    ... on CategoryInterface { id name url_path url_suffix }
    ... on ProductInterface { sku name }
    ... on CmsPage { identifier title }`;

// The suffix rides along so a miss can be retried with it: Magento's `route`
// wants the full request path, but authors reasonably type "/women".
const QUERY = `query editorResolveRoute($url: String!) {
  route(url: $url) { ${ROUTE_FIELDS} }
  storeConfig { category_url_suffix }
}`;

const RETRY_QUERY = `query editorResolveRouteSuffixed($url: String!) {
  route(url: $url) { ${ROUTE_FIELDS} }
}`;

/**
 * Trims whatever an author pasted down to a request path Magento understands:
 * a full URL, a leading slash or a bare path all reduce to the same thing.
 */
const toRequestPath = (input) => {
  const raw = String(input || '').trim();
  if (!raw) return '';
  const withoutOrigin = raw.replace(/^[a-z]+:\/\/[^/]+/i, '');
  return withoutOrigin.split(/[?#]/)[0].replace(/^\/+/, '');
};

/**
 * Asks Magento what lives at a storefront URL.
 *
 * Only the URL is resolved here — what goes on the page is ours. Magento answers
 * with the entity type, its id and its canonical path, which is what the route
 * document has to be keyed on so the storefront finds it again.
 *
 * @param {string} input   Whatever the author typed.
 * @returns {Promise<{type: string, id: number, title: string, path: string} | {error: string}>}
 */
export async function resolveRoute(input) {
  const requestPath = toRequestPath(input);
  if (!requestPath) return { error: 'Enter a URL' };

  const ask = async (query, url) => {
    const res = await fetch(GRAPHQL_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables: { url } }),
    });
    return res.json();
  };

  let route;
  try {
    const payload = await ask(QUERY, requestPath);
    route = payload?.data?.route;
    const suffix = payload?.data?.storeConfig?.category_url_suffix || '';
    if (!route && suffix && !requestPath.endsWith(suffix)) {
      const retried = await ask(RETRY_QUERY, `${requestPath}${suffix}`);
      route = retried?.data?.route;
    }
  } catch (err) {
    return { error: `Could not reach Magento — ${err.message}` };
  }

  if (!route) return { error: `Magento has no page at /${requestPath}` };

  // The inline fragment only fills these in for a category, so their presence
  // is the test — no need to enumerate Magento's concrete type names.
  if (route.url_path != null && route.id != null) {
    return {
      type: 'category',
      id: route.id,
      title: route.name || requestPath,
      path: `/${route.url_path}${route.url_suffix || ''}`,
    };
  }

  const what = route.__typename === 'CmsPage' ? 'a CMS page' : 'a product page';
  return { error: `That URL is ${what} — only category pages are supported so far` };
}
