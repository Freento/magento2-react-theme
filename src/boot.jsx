import React, { startTransition } from 'react';
import { hydrateRoot, createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ApolloProvider } from '@apollo/client';
import { getClientApolloClient } from './apollo/client';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import { CompareProvider } from './context/CompareContext';
import { BreadcrumbProvider } from './context/BreadcrumbContext';
import { attachPrefetcher, resetPrefetchDedupe } from './lib/prefetch';
import { registerRouteAreaPaths } from './hooks/useRouteArea';
import { migrateLegacyCustomerToken, readLiveCustomerToken } from './lib/customerToken';
import App from './App.jsx';

const initialData = typeof window !== 'undefined' ? (window.__INITIAL_DATA__ || {}) : {};

// Carry pre-cookie sessions over before anything reads the token.
migrateLegacyCustomerToken();

const apollo = getClientApolloClient(initialData.apolloCache || null);

// Which URLs the editor has content for, so hovering one prefetches that
// content — and skips the product query when the content is the whole page.
registerRouteAreaPaths(initialData.routeAreaPaths);
attachPrefetcher();

const CACHE_FLUSH_MS = 60 * 60 * 1000;
if (typeof window !== 'undefined') {
  setInterval(() => {
    resetPrefetchDedupe();
    apollo.resetStore().catch(() => {});
  }, CACHE_FLUSH_MS);
}

const container = document.getElementById('root');
const isPrerendered = !!container?.firstElementChild;

const tree = (
  <React.StrictMode>
    <ApolloProvider client={apollo}>
      <AuthProvider initialToken={readLiveCustomerToken()}>
        <CartProvider>
          <WishlistProvider>
            <CompareProvider>
            <BreadcrumbProvider initialBreadcrumbs={initialData.breadcrumbs || []}>
              <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                <App initialData={initialData} />
              </BrowserRouter>
            </BreadcrumbProvider>
            </CompareProvider>
          </WishlistProvider>
        </CartProvider>
      </AuthProvider>
    </ApolloProvider>
  </React.StrictMode>
);

if (isPrerendered) {
  startTransition(() => {
    hydrateRoot(container, tree, {
      onRecoverableError: (err, info) => {
        console.warn('[hydration]', err, info);
      },
    });
  });
} else {
  createRoot(container).render(tree);
}
