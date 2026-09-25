import { useEffect, useState } from 'react';
import '../styles/previewChrome.css';
// The preview renders host storefront components; in the tablet/mobile iframe
// this is a separate document, so it needs the host Tailwind layer imported
// here (Vite dedupes it with the editor shell's copy in the same document).
import '@host/styles/tailwind.css';

const CHROME_PAGES = {
  '/__footer__': { hideFooter: true, label: 'Global Block' },
};

function GlobalBlock({ id, label, onEdit, children }) {
  return (
    <div
      data-global-block={id}
      style={{
        position: 'relative',
        outline: '2px dashed #0F4C5C',
        outlineOffset: -2,
      }}
    >
      <div
        onClick={onEdit}
        title={`Edit ${label}`}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          background: '#111111',
          color: '#fff',
          fontSize: 10,
          fontWeight: 500,
          padding: '4px 10px',
          borderRadius: '0 0 4px 0',
          zIndex: 20,
          cursor: 'pointer',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          boxShadow: 'none',
        }}
      >
        {label}
      </div>
      {children}
    </div>
  );
}

function LiveChromeBlocker({ children }) {
  return <div style={{ pointerEvents: 'none' }}>{children}</div>;
}

export default function PreviewChrome({ children, pagePath, onEditGlobal, footerContent }) {
  const flags = CHROME_PAGES[pagePath] || {};
  const [chrome, setChrome] = useState(null);

  useEffect(() => {
    const set = () => {
      const sw = window.innerWidth - document.documentElement.clientWidth;
      document.documentElement.style.setProperty('--sw', `${Math.max(0, sw)}px`);
      document.documentElement.style.setProperty('--fbw', `calc(100vw - ${Math.max(0, sw)}px)`);
    };
    set();
    window.addEventListener('resize', set);
    return () => window.removeEventListener('resize', set);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [apollo, routerDom, clientMod, cartMod, authMod, breadcrumbMod, wishlistMod, compareMod, headerMod] = await Promise.all([
          import('@apollo/client'),
          import('react-router-dom'),
          import('@host/apollo/client'),
          import('@host/context/CartContext'),
          import('@host/context/AuthContext'),
          import('@host/context/BreadcrumbContext'),
          import('@host/context/WishlistContext'),
          import('@host/context/CompareContext'),
          import('@host/components/layout/Header'),
        ]);
        if (cancelled) return;
        setChrome({
          ApolloProvider: apollo.ApolloProvider,
          BrowserRouter: routerDom.BrowserRouter,
          apolloClient: clientMod.getClientApolloClient(),
          CartProvider: cartMod.CartProvider,
          AuthProvider: authMod.AuthProvider,
          BreadcrumbProvider: breadcrumbMod.BreadcrumbProvider,
          WishlistProvider: wishlistMod.WishlistProvider,
          CompareProvider: compareMod.CompareProvider,
          Header: headerMod.default,
        });
      } catch (err) {
        console.error('[PreviewChrome] failed to load shop chrome:', err);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (!chrome) {
    return (
      <div className="preview-chrome" style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>
        Loading preview…
      </div>
    );
  }

  const {
    ApolloProvider, BrowserRouter, apolloClient,
    CartProvider, AuthProvider, BreadcrumbProvider, WishlistProvider, CompareProvider,
    Header,
  } = chrome;
  const footerLabel = CHROME_PAGES['/__footer__'].label;

  return (
    <div className="preview-chrome">
      <ApolloProvider client={apolloClient}>
        <BrowserRouter>
          <AuthProvider>
            <CartProvider>
              <WishlistProvider>
                <CompareProvider>
                  <BreadcrumbProvider>
                    <LiveChromeBlocker><Header /></LiveChromeBlocker>
                    {children}
                    {!flags.hideFooter && footerContent && (
                      <GlobalBlock id="__footer__" label={footerLabel} onEdit={() => onEditGlobal?.('/__footer__')}>
                        {footerContent}
                      </GlobalBlock>
                    )}
                  </BreadcrumbProvider>
                </CompareProvider>
              </WishlistProvider>
            </CartProvider>
          </AuthProvider>
        </BrowserRouter>
      </ApolloProvider>
    </div>
  );
}
