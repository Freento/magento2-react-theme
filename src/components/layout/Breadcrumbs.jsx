import React, { useLayoutEffect, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useBreadcrumb } from '../../context/BreadcrumbContext';

// Clear runs pre-paint on the client (no stale-crumb flash) but must not warn
// during SSR, where layout effects don't run — fall back to useEffect there.
const useIsoLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

// Shared breadcrumb bar. Pages push their trail via `useSyncBreadcrumbs`; this
// renders nothing until crumbs arrive and clears between pages, so it never
// flashes the previous page's trail. Each crumb links to its `path` except the
// last (the current page), which is plain text.
export default function Breadcrumbs() {
  const { breadcrumbs, updateBreadcrumbs } = useBreadcrumb();
  const { pathname } = useLocation();

  // Clear on every navigation so a new page starts empty and the old trail never
  // lingers. Layout effect (pre-paint) beats pages' passive `useSyncBreadcrumbs`
  // effects, so the sequence is always clear-then-set with no stale frame. Skip
  // the initial mount: the bar starts empty and clearing during hydration would
  // bump the lazy-route Suspense boundary into client rendering.
  const mounted = useRef(false);
  useIsoLayoutEffect(() => {
    if (!mounted.current) { mounted.current = true; return; }
    updateBreadcrumbs([]);
  }, [pathname, updateBreadcrumbs]);

  if (!Array.isArray(breadcrumbs) || breadcrumbs.length === 0) return null;

  return (
    <nav className="breadcrumbs py-4 max768:py-3 bg-transparent text-sm text-ink-2" aria-label="Breadcrumb">
      <ol className="breadcrumb-list list-none flex flex-wrap items-center mx-auto px-gutter max-w-container gap-0">
        {breadcrumbs.map((crumb, i) => {
          const isLast = i === breadcrumbs.length - 1;
          return (
            <li key={`${crumb.path || crumb.label}-${i}`} className="breadcrumb-item flex items-center text-sm">
              {crumb.path && !isLast ? (
                // In node URL-resolve mode the client can't resolve a catalog URL
                // on its own — it needs the entity handed to it via router state,
                // exactly like the menu/product links. Without it a category click
                // renders NotFound (only a reload, resolved server-side, works).
                <Link
                  to={crumb.path}
                  className="text-ink-2 no-underline transition-colors duration-fast ease-[ease] hover:text-ink"
                  state={crumb.categoryId != null
                    ? { resolved: { type: 'category', id: Number(crumb.categoryId), path: crumb.path.replace(/^\/+/, '') } }
                    : undefined}
                >
                  {crumb.label}
                </Link>
              ) : (
                <span className="breadcrumb-current text-ink font-medium" aria-current={isLast ? 'page' : undefined}>
                  {crumb.label}
                </span>
              )}
              {!isLast && <span className="breadcrumb-separator mx-2 max768:mx-1.5 text-ink-2 select-none" aria-hidden="true">/</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
