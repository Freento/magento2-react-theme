import React from 'react';
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
import { migrateLegacyCustomerToken } from './lib/customerToken';
import App from './App.jsx';
import './styles/tailwind.css';
import './styles/external-markup.css';

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
      <AuthProvider>
        <CartProvider>
          <WishlistProvider>
            <CompareProvider>
            <BreadcrumbProvider>
              <BrowserRouter>
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
  hydrateRoot(container, tree, {
    onRecoverableError: (err, info) => {
      console.warn('[hydration]', err, info);
    },
  });
} else {
  createRoot(container).render(tree);
}
