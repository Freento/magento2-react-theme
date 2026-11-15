import { useQuery } from '@apollo/client';
import { useLocation } from 'react-router-dom';
import { RESOLVE_URL } from '../queries/url';

/**
 * Returns the catalog entity a storefront URL resolves to.
 *
 * A full page load carries the server's answer in
 * `window.__INITIAL_DATA__.resolvedUrl`, and a client-side navigation from one of
 * the app's own links (menu, product card, breadcrumb) carries it in the link's
 * router state. A plain link — one out of editor content — carries nothing, so
 * for that one the browser asks Magento's GraphQL `route` itself, and `loading`
 * is true until it answers.
 *
 * @param {string} urlPath
 * @returns {{data: object|null, loading: boolean}}
 */
const STORAGE_KEY = 'resolvedUrls';
const isBrowser = typeof window !== 'undefined';

const readStore = () => {
  try {
    return JSON.parse(window.sessionStorage.getItem(STORAGE_KEY) || '{}') || {};
  } catch {
    return {};
  }
};

const remember = (path, data) => {
  if (!isBrowser || !data) return;
  try {
    const store = readStore();
    if (store[path]) return;
    store[path] = data;
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    return;
  }
};

const recall = (path) => (isBrowser ? readStore()[path] || null : null);

const normalizeEntityType = (routeTypeEnum) => routeTypeEnum.toLowerCase().replace(/_/g, '-');

function shouldRetryWithHtmlSuffix(requestPath, skip, resolvedUrl) {
  if (skip) return false;
  if (!requestPath) return false;
  if (requestPath.endsWith('.html')) return false;
  if (resolvedUrl.loading) return false;

  return !resolvedUrl.data?.route;
}

function usePageFromGraphql(requestPath, skip) {
  const resolvedUrl = useQuery(RESOLVE_URL, {
    variables: { url: `/${requestPath}` },
    skip: skip || !requestPath,
    fetchPolicy: 'cache-first',
  });
  const retryWithHtmlSuffix = shouldRetryWithHtmlSuffix(requestPath, skip, resolvedUrl);
  const resolvedUrlWithHtml = useQuery(RESOLVE_URL, {
    variables: { url: `/${requestPath}.html` },
    skip: !retryWithHtmlSuffix,
    fetchPolicy: 'cache-first',
  });

  const route = resolvedUrl.data?.route || resolvedUrlWithHtml.data?.route;
  if (route) {
    return { loading: false, data: { ...route, type: normalizeEntityType(route.type) } };
  }

  return {
    loading: !skip && (resolvedUrl.loading || (retryWithHtmlSuffix && resolvedUrlWithHtml.loading)),
    data: null,
  };
}

function useKnownPage(requestPath) {
  const location = useLocation();
  const pageFromClickedLink = location.state?.resolved;
  if (pageFromClickedLink?.path === requestPath) {
    remember(requestPath, pageFromClickedLink);
    return { answered: true, data: pageFromClickedLink };
  }

  // Server render: the router state above is the only source, set from the
  // server's own lookup.
  if (!isBrowser) return { answered: true, data: null };

  const resolvedUrlFromServer = window.__INITIAL_DATA__?.resolvedUrl; // { path, data: page }
  if (resolvedUrlFromServer?.path === requestPath) {
    // The server's answer for the document it rendered, a miss included — that
    // miss is what renders NotFound (and the 404) without a query.
    remember(requestPath, resolvedUrlFromServer.data);
    return { answered: true, data: resolvedUrlFromServer.data || null };
  }

  const recalled = recall(requestPath);
  return { answered: !!recalled, data: recalled };
}

export function useResolvedUrl(urlPath) {
  const requestPath = (urlPath || '').replace(/^\/+/, '');
  const known = useKnownPage(requestPath);
  const pageFromGraphql = usePageFromGraphql(requestPath, known.answered);

  if (known.answered) return { loading: false, data: known.data };
  if (pageFromGraphql.data) remember(requestPath, pageFromGraphql.data);
  return pageFromGraphql;
}
