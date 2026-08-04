import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

const BreadcrumbContext = createContext();

export const useBreadcrumb = () => {
  const context = useContext(BreadcrumbContext);
  if (!context) {
    throw new Error('useBreadcrumb must be used within BreadcrumbProvider');
  }
  return context;
};

// A page hands its crumbs to the shared breadcrumb bar once its data is ready.
// Passing null/empty is inert (leaves the bar as-is) so a page that delegates to
// a child — e.g. Category rendering ProductDetail for a product URL — doesn't
// clobber the child's crumbs. Clearing between pages is handled centrally by the
// Breadcrumbs component on route change, so the bar "waits for data" and never
// flashes the previous page's crumbs.
export const useSyncBreadcrumbs = (crumbs) => {
  const { updateBreadcrumbs } = useBreadcrumb();
  const hasCrumbs = Array.isArray(crumbs) && crumbs.length > 0;
  // Re-run on content change, not identity (call sites build a fresh array each render).
  const key = hasCrumbs ? JSON.stringify(crumbs) : null;
  useEffect(() => {
    if (key) updateBreadcrumbs(JSON.parse(key));
  }, [key, updateBreadcrumbs]);
};

export const BreadcrumbProvider = ({ children }) => {
  const [breadcrumbs, setBreadcrumbs] = useState([]);

  const updateBreadcrumbs = useCallback((crumbs) => {
    setBreadcrumbs((prev) => {
      const next = Array.isArray(crumbs) ? crumbs : [];
      // Bail on empty->empty so the routine "clear on navigation" doesn't fire a
      // needless re-render (and, during hydration, doesn't bump the lazy-route
      // Suspense boundary into client rendering).
      if (prev.length === 0 && next.length === 0) return prev;
      return next;
    });
  }, []);

  return (
    <BreadcrumbContext.Provider value={{ breadcrumbs, updateBreadcrumbs }}>
      {children}
    </BreadcrumbContext.Provider>
  );
};
