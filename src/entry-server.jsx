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
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import { BreadcrumbProvider } from './context/BreadcrumbContext';
import App from './App.jsx';
import { minifyPrint } from './apollo/client';

function quiet(fn) {
  const orig = console.error;
  console.error = (...args) => {
    const m = args[0];
    if (typeof m === 'string' && /useLayoutEffect does nothing on the server/.test(m)) return;
    orig(...args);
  };
  try { return fn(); } finally { console.error = orig; }
}

export async function renderApp(url, initialData = {}, options = {}) {
  const { graphqlUri } = options;
  const apollo = new ApolloClient({
    link: new HttpLink({ uri: graphqlUri, fetch, useGETForQueries: true, print: minifyPrint }),
    cache: new InMemoryCache(),
    ssrMode: true,
  });

  const location = typeof url === 'string'
    ? { pathname: url, search: '', hash: '', state: initialData.routeHint ? { resolved: initialData.routeHint } : null }
    : url;

  const tree = (
    <ApolloProvider client={apollo}>
      <AuthProvider>
        <CartProvider>
          <WishlistProvider>
            <BreadcrumbProvider>
              <StaticRouter location={location}>
                <App initialData={initialData} />
              </StaticRouter>
            </BreadcrumbProvider>
          </WishlistProvider>
        </CartProvider>
      </AuthProvider>
    </ApolloProvider>
  );

  // getDataFromTree isn't Suspense-aware: a React.lazy route suspends during data
  // collection, so its queries are skipped. A throwaway render triggers the route's
  // dynamic import; once it resolves, the route renders synchronously and its data
  // is collected on the getDataFromTree pass below.
  try { quiet(() => renderToStaticMarkup(tree)); } catch { /* expected to suspend */ }
  for (let i = 0; i < 3; i += 1) await new Promise((resolve) => setImmediate(resolve));

  await quiet(() => getDataFromTree(tree));
  const html = quiet(() => renderToString(tree));
  const apolloState = apollo.extract();
  return { html, apolloState };
}
