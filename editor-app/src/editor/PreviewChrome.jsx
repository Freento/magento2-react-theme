import { useEffect, useState } from 'react';
import { getClientApolloClient } from '@host/apollo/client';
import { menuItemsOf } from '@host/components/layout/Menu/menuItems';
import '../styles/previewChrome.css';
import '@host/styles/tailwind.css';

const CHROME_PAGES = {
  '/__footer__': { hideFooter: true, label: 'Global Block' },
  '/__menu__': { hideMenu: true, label: 'Global Block' },
};

function GlobalBlock({ id, label, onEdit, children }) {
  return (
    <div
      className="global-block"
      data-global-block={id}
      style={{ position: 'relative' }}
    >
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          border: '3px dashed #0F4C5C',
          pointerEvents: 'none',
          zIndex: 998,
        }}
      />
      <div
        className="global-block-badge"
        onClick={(e) => { e.stopPropagation(); onEdit?.(); }}
        title={`Edit ${label}`}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          background: '#0F4C5C',
          color: '#fff',
          fontSize: 10,
          fontWeight: 600,
          padding: '4px 10px',
          borderRadius: '0 0 4px 0',
          zIndex: 999,
          cursor: 'pointer',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
          pointerEvents: 'auto',
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

function EmptyRegion() {
  return (
    <div
      style={{
        minHeight: 56,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#6F6F6B',
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
      }}
    >
      Empty global block
    </div>
  );
}

export default function PreviewChrome({ children, pagePath, onEditGlobal, footerContent, menuContent, menuData }) {
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
        const [apollo, routerDom, cartMod, authMod, breadcrumbMod, wishlistMod, compareMod, headerMod] = await Promise.all([
          import('@apollo/client'),
          import('react-router-dom'),
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
          apolloClient: getClientApolloClient(),
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
      <div className="preview-chrome font-['Inter',sans-serif] leading-base text-[#424242] antialiased isolate" style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>
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
  const menuLabel = CHROME_PAGES['/__menu__'].label;
  const menuSlot = !flags.hideMenu && menuContent !== undefined && menuContent !== null ? (
    <GlobalBlock id="__menu__" label={menuLabel} onEdit={() => onEditGlobal?.('/__menu__')}>
      {menuContent || <EmptyRegion />}
    </GlobalBlock>
  ) : null;

  return (
    <div className="preview-chrome font-['Inter',sans-serif] leading-base text-[#424242] antialiased isolate">
      <ApolloProvider client={apolloClient}>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <AuthProvider>
            <CartProvider>
              <WishlistProvider>
                <CompareProvider>
                  <BreadcrumbProvider>
                    <LiveChromeBlocker><Header menuItems={menuItemsOf(menuData)} menuSlot={menuSlot} /></LiveChromeBlocker>
                    {children}
                    {!flags.hideFooter && footerContent !== undefined && footerContent !== null && (
                      <GlobalBlock id="__footer__" label={footerLabel} onEdit={() => onEditGlobal?.('/__footer__')}>
                        {footerContent || <EmptyRegion />}
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
