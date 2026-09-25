import React from 'react';
import { renderToString, renderToStaticMarkup } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server';
import {
  ApolloClient,
  ApolloProvider,
  HttpLink,
  InMemoryCache,
} from '@apollo/client';
import { getDataFromTree } from '@apollo/client/react/ssr';
import { onError } from '@apollo/client/link/error';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import { CompareProvider } from './context/CompareContext';
import { BreadcrumbProvider } from './context/BreadcrumbContext';
import App from './App.jsx';
import { minifyPrint, possibleTypes } from './apollo/client';

function quiet(fn) {
  const orig = console.error;
  console.error = (...args) => {
    const m = args[0];
    if (typeof m === 'string' && /useLayoutEffect does nothing on the server/.test(m)) return;
    orig(...args);
  };
  try { return fn(); } finally { console.error = orig; }
}

// Records every GraphQL request that actually goes on the wire. Instrumenting the
// fetch rather than an ApolloLink is deliberate: the link sees an operation, the fetch
// sees the request — the exact URL, method and body Magento receives, which is what
// makes a record replayable with curl. Everything else (operation name, query text,
// variables) is decoded back out of that request, so the record cannot drift from what
// was actually sent. Cache hits never reach fetch, so this counts real traffic only.
//
// `stats` is created per renderApp call, so the closure is per request and concurrent
// renders cannot mix their counters.
function createCountingFetch(stats) {
  return async (input, init = {}) => {
    const url = typeof input === 'string' ? input : input.url;
    const method = (init.method || 'GET').toUpperCase();
    const entry = {
      name: '(anonymous)',
      pass: stats.pass,
      method,
      url,
      body: typeof init.body === 'string' ? init.body : null,
      query: null,
      variables: null,
      status: null,
      ms: null,
      bytes: 0,
      errors: 0,
      error: null,
    };
    // useGETForQueries puts the document in the search params; mutations stay POST
    // and carry it in a JSON body.
    try {
      if (method === 'GET') {
        const params = new URL(url).searchParams;
        entry.name = params.get('operationName') || entry.name;
        entry.query = params.get('query');
        const vars = params.get('variables');
        if (vars) entry.variables = JSON.parse(vars);
      } else if (entry.body) {
        const parsed = JSON.parse(entry.body);
        entry.name = parsed.operationName || entry.name;
        entry.query = parsed.query ?? null;
        entry.variables = parsed.variables ?? null;
      }
    } catch { /* keep whatever decoded */ }
    // Pushed before the request resolves, so a request that fails still shows up.
    stats.ops.push(entry);

    const t0 = performance.now();
    try {
      const res = await fetch(input, init);
      entry.status = res.status;
      // Consume the body here and hand the render an equivalent Response built from
      // the same text. res.clone() looked cheaper but its second branch never
      // resolved once the render consumed the first, leaving every size at zero.
      // HttpLink buffers the whole body anyway, so nothing extra is held.
      const text = await res.text();
      // Measured across the body, not just the headers — that is what the render waits for.
      entry.ms = Number((performance.now() - t0).toFixed(1));
      entry.bytes = text.length;
      try { entry.errors = (JSON.parse(text).errors || []).length; } catch { /* not JSON */ }
      // Drop the transfer headers: they described the original stream, and this body
      // is already decoded text.
      const headers = new Headers(res.headers);
      headers.delete('content-encoding');
      headers.delete('content-length');
      return new Response(text, { status: res.status, statusText: res.statusText, headers });
    } catch (err) {
      entry.ms = Number((performance.now() - t0).toFixed(1));
      entry.error = err.message;
      throw err;
    }
  };
}

export async function renderApp(url, initialData = {}, options = {}) {
  // `customerToken` comes from the request cookie: with it the catalog renders with
  // the customer's group prices instead of guest ones the client never replaces.
  // Sent as a header, not through authLink — that link short-circuits on the server.
  const { graphqlUri, customerToken } = options;

  // The callers pass `debug` from their own env read; prerender.js has none, so fall
  // back to SSR_DEBUG here. Off means no link, no timers, no counters.
  const collect = options.debug
    ?? (String(process.env.SSR_DEBUG || 'off').trim().toLowerCase() !== 'off');
  const stats = collect ? { ops: [], pass: 0 } : null;

  // Magento rejected the token mid-render; the caller re-renders as a guest rather
  // than shipping a half-signed-in page.
  let authRejected = false;
  const authWatchLink = onError(({ graphQLErrors, networkError }) => {
    if (!customerToken) return;
    if (networkError?.statusCode === 401 || networkError?.statusCode === 403) authRejected = true;
    if (graphQLErrors?.some((e) => e.extensions?.category === 'graphql-authorization')) authRejected = true;
  });

  const httpLink = new HttpLink({
    uri: graphqlUri,
    fetch: stats ? createCountingFetch(stats) : fetch,
    useGETForQueries: true,
    print: minifyPrint,
    ...(customerToken ? { headers: { authorization: `Bearer ${customerToken}` } } : {}),
  });

  const apollo = new ApolloClient({
    link: authWatchLink.concat(httpLink),
    cache: new InMemoryCache({ possibleTypes }),
    ssrMode: true,
  });

  const parsedUrl = typeof url === 'string' ? new URL(url, 'http://_') : null;
  const location = parsedUrl
    ? { pathname: parsedUrl.pathname, search: parsedUrl.search, hash: '', state: initialData.routeHint ? { resolved: initialData.routeHint } : null }
    : url;

  const tree = (
    <ApolloProvider client={apollo}>
      <AuthProvider>
        <CartProvider>
          <WishlistProvider>
            <CompareProvider>
            <BreadcrumbProvider>
              <StaticRouter location={location}>
                <App initialData={initialData} />
              </StaticRouter>
            </BreadcrumbProvider>
            </CompareProvider>
          </WishlistProvider>
        </CartProvider>
      </AuthProvider>
    </ApolloProvider>
  );

  // getDataFromTree isn't Suspense-aware: a React.lazy route suspends during data
  // collection, so its queries are skipped. A throwaway render triggers the route's
  // dynamic import; once it resolves, the route renders synchronously and its data
  // is collected on the getDataFromTree pass below. Anything it manages to fire is
  // recorded as pass 0.
  try { quiet(() => renderToStaticMarkup(tree)); } catch { /* expected to suspend */ }
  for (let i = 0; i < 3; i += 1) await new Promise((resolve) => setImmediate(resolve));

  if (stats) stats.pass = 1;
  await quiet(() => getDataFromTree(tree));
  let html = quiet(() => renderToString(tree));
  for (let attempt = 0; attempt < 2 && html.includes('<!--$!-->'); attempt += 1) {
    for (let i = 0; i < 3; i += 1) await new Promise((resolve) => setImmediate(resolve));
    if (stats) stats.pass += 1;
    await quiet(() => getDataFromTree(tree));
    html = quiet(() => renderToString(tree));
  }
  const apolloState = apollo.extract();
  // `personalized` tells the client this cache already holds the customer's prices,
  // so it can trust it instead of re-fetching the catalog.
  return { html, apolloState, personalized: Boolean(customerToken) && !authRejected, authRejected, stats };
}
