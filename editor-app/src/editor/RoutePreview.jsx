import { useState, useEffect } from 'react';

/**
 * Shows the storefront route a document decorates, with the area being edited
 * in its real place on the page.
 *
 * The page itself is the host's own component fed live Magento data, so an
 * author sees the product list they are placing blocks above rather than a
 * stand-in. Only the area is interactive: everything the storefront owns is
 * inert, so a stray click cannot add something to the cart or open a filter.
 */
export default function RoutePreview({ doc, children }) {
  const [Route, setRoute] = useState(null);

  useEffect(() => {
    let cancelled = false;
    import('@host/components/catalog/Category')
      .then((mod) => { if (!cancelled) setRoute(() => mod.default); })
      .catch((err) => console.error('[RoutePreview] failed to load the storefront page:', err));
    return () => { cancelled = true; };
  }, []);

  if (!Route) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
        Loading the storefront page…
      </div>
    );
  }

  return (
    <div style={{ pointerEvents: 'none' }}>
      <Route
        resolved={{ type: doc?.route?.type, id: doc?.route?.id }}
        displayOverride={doc?.display}
        areaSlot={
          <div className="category-area" style={{ pointerEvents: 'auto' }}>
            {children}
          </div>
        }
      />
    </div>
  );
}
