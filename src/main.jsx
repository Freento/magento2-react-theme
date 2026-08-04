import React from 'react';
import { hydrateRoot, createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ApolloProvider } from '@apollo/client';
import { getClientApolloClient } from './apollo/client';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import { BreadcrumbProvider } from './context/BreadcrumbContext';
import { attachPrefetcher, resetPrefetchDedupe } from './lib/prefetch';
import App from './App.jsx';
import './styles/base/general.less';
import './styles/base/controls.less';
import './styles/base/forms.less';
import './styles/base/buttons.less';
import './styles/base/skeleton.less';
import './styles/critical/home-hero.less';

const initialData = typeof window !== 'undefined' ? (window.__INITIAL_DATA__ || {}) : {};
const apollo = getClientApolloClient(initialData.apolloCache || null);

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
            <BreadcrumbProvider>
              <BrowserRouter>
                <App initialData={initialData} />
              </BrowserRouter>
            </BreadcrumbProvider>
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
