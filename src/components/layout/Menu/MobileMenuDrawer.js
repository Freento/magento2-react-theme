import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { getTileIcon } from './menuTileIcons';

const SUBLIST_ITEM =
  'flex items-center justify-between w-full py-4 bg-transparent border-0 border-b border-line text-md font-medium text-ink no-underline text-left cursor-pointer transition-colors duration-fast ease-[ease] hover:text-ink-2';

const TILE_BASE =
  'mobile-menu-tile flex flex-col items-center justify-center gap-2.5 py-5 px-3 border border-line rounded bg-bg text-ink text-[13px] font-medium tracking-normal normal-case no-underline transition-colors duration-fast ease-[ease] aspect-[5/4] text-center';

const ACCOUNT_ITEM =
  'block w-full py-3.5 bg-transparent border-0 cursor-pointer text-ink text-base text-left no-underline transition-colors duration-fast ease-[ease] hover:text-ink-2';

const SKEL_PULSE = 'animate-skeleton-pulse';

const MobileMenuDrawer = ({ mainCategories, isOpen, onClose, mobileTilesLoading }) => {
  const { isAuthenticated, openLoginModal, logout } = useAuth();
  const [submenuPath, setSubmenuPath] = useState([]);
  const mobileMenuRef = useRef(null);

  useEffect(() => {
    const el = mobileMenuRef.current;
    if (!el) return;
    if (isOpen) el.removeAttribute('inert');
    else el.setAttribute('inert', '');
  }, [isOpen]);

  const closeAndReset = () => {
    setSubmenuPath([]);
    onClose && onClose();
  };
  const goBack = () => setSubmenuPath((p) => p.slice(0, -1));
  const current = submenuPath[submenuPath.length - 1];
  const inSubmenu = !!current;
  const childCategories = (current?.children || [])
    .filter((c) => c.include_in_menu)
    .sort((a, b) => (a.position || 0) - (b.position || 0));

  return (
    <>
      {isOpen && <div className="mobile-menu-scrim fixed inset-0 bg-ink/40 z-[90] animate-scrim" onClick={closeAndReset} />}
      <aside
        ref={mobileMenuRef}
        className={`mobile-menu fixed top-0 right-0 w-full max-w-[100vw] h-screen bg-bg z-[95] flex flex-col translate-x-full [transition:transform_240ms_ease] [&.is-open]:translate-x-0 ${isOpen ? 'is-open' : ''}`}
        aria-label="Menu"
      >
        <div className="mobile-menu-head flex justify-between items-center py-4 px-5 border-b border-line">
          {inSubmenu ? (
            <button
              type="button"
              onClick={goBack}
              className="mobile-menu-back inline-flex items-center gap-2 bg-transparent border-0 p-0 text-base font-medium text-ink cursor-pointer hover:text-ink-2"
              aria-label="Back"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
              <span>{current.name}</span>
            </button>
          ) : (
            <span className="mobile-menu-title font-sans text-base font-semibold tracking-[0.04em] uppercase text-ink">Menu</span>
          )}
          <button
            type="button"
            onClick={closeAndReset}
            className="icon-btn w-9 h-9 inline-flex items-center justify-center rounded-pill text-ink transition-colors duration-fast ease-[ease] hover:bg-surface [&_svg]:w-[18px] [&_svg]:h-[18px]"
            aria-label="Close menu"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="mobile-menu-body flex-1 overflow-y-auto p-5">
          {inSubmenu ? (
            <ul className="mobile-menu-sublist list-none p-0 m-0 flex flex-col">
              <li>
                <Link
                  to={`/${current.url_path}${current.url_suffix || ''}`}
                  data-prefetch="category"
                  data-prefetch-id={current.id}
                  state={{ resolved: {
                    type: 'category',
                    id: Number(current.id),
                    path: `${current.url_path}${current.url_suffix || ''}`,
                  }}}
                  onClick={closeAndReset}
                  className="mobile-menu-sublist-all flex items-center justify-between w-full py-4 border-0 border-b border-line font-medium no-underline text-left cursor-pointer text-ink-2 tracking-[0.04em] uppercase text-sm"
                >
                  View all {current.name}
                </Link>
              </li>
              {childCategories.map((child) => {
                const hasKids = (child.children || []).some((c) => c.include_in_menu);
                return (
                  <li key={child.id}>
                    {hasKids ? (
                      <button
                        type="button"
                        className={SUBLIST_ITEM}
                        onClick={() => setSubmenuPath((p) => [...p, child])}
                      >
                        <span>{child.name}</span>
                        <svg className="text-ink-2 shrink-0" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <polyline points="9 6 15 12 9 18" />
                        </svg>
                      </button>
                    ) : (
                      <Link
                        to={`/${child.url_path}${child.url_suffix || ''}`}
                        data-prefetch="category"
                        data-prefetch-id={child.id}
                        state={{ resolved: {
                          type: 'category',
                          id: Number(child.id),
                          path: `${child.url_path}${child.url_suffix || ''}`,
                        }}}
                        onClick={closeAndReset}
                        className={SUBLIST_ITEM}
                      >
                        <span>{child.name}</span>
                        <svg className="text-ink-2 shrink-0" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <polyline points="9 6 15 12 9 18" />
                        </svg>
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>
          ) : (
            <>
              <div className="mobile-menu-tiles grid grid-cols-2 gap-2 mb-3">
                {mobileTilesLoading && Array.from({ length: 6 }).map((_, i) => (
                  <div key={`mm-sk-${i}`} className={`${TILE_BASE} mobile-menu-tile--skel pointer-events-none cursor-default`} aria-hidden="true">
                    <span className={`mobile-menu-tile-icon mm-skel-icon block w-7 h-7 rounded-full bg-line shrink-0 ${SKEL_PULSE}`} />
                    <span className={`mobile-menu-tile-label mm-skel-label block w-[60%] h-3 rounded bg-line leading-[1.25] ${SKEL_PULSE}`} />
                  </div>
                ))}
                {!mobileTilesLoading && mainCategories.map((category) => {
                  const hasKids = (category.children || []).some((c) => c.include_in_menu);
                  const TileEl = hasKids ? 'button' : Link;
                  const tileProps = hasKids
                    ? { type: 'button', onClick: () => setSubmenuPath([category]) }
                    : { to: `/${category.url_path}${category.url_suffix || ''}`, onClick: closeAndReset, 'data-prefetch': 'category', 'data-prefetch-id': category.id };
                  return (
                    <TileEl
                      key={category.id}
                      className={`${TILE_BASE} cursor-pointer hover:border-ink hover:bg-surface hover:text-ink`}
                      {...tileProps}
                    >
                      <svg
                        className="mobile-menu-tile-icon text-ink shrink-0 transition-colors duration-fast ease-[ease]"
                        width="28"
                        height="28"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        {getTileIcon(category.name)}
                      </svg>
                      <span className="mobile-menu-tile-label leading-[1.25]">{category.name}</span>
                    </TileEl>
                  );
                })}
              </div>

              <div className="mobile-menu-eyebrow mobile-menu-eyebrow-divider text-xs font-medium tracking-[0.12em] uppercase text-ink-2 mb-3 mt-8 pt-5 border-t border-line">Your account</div>
              <ul className="mobile-menu-account list-none flex flex-col p-0">
                {isAuthenticated ? (
                  <>
                    <li className="border-b border-line last:border-b-0">
                      <Link className={ACCOUNT_ITEM} to="/my-account" onClick={closeAndReset}>My account</Link>
                    </li>
                    <li className="border-b border-line last:border-b-0">
                      <Link className={ACCOUNT_ITEM} to="/my-account/orders" onClick={closeAndReset}>Orders</Link>
                    </li>
                    <li className="border-b border-line last:border-b-0">
                      <Link className={ACCOUNT_ITEM} to="/my-account?tab=wishlist" onClick={closeAndReset}>Wishlist</Link>
                    </li>
                    <li className="border-b border-line last:border-b-0">
                      <button
                        type="button"
                        className={ACCOUNT_ITEM}
                        onClick={() => { logout && logout(); closeAndReset(); }}
                      >
                        Sign out
                      </button>
                    </li>
                  </>
                ) : (
                  <>
                    <li className="border-b border-line last:border-b-0">
                      <button
                        type="button"
                        className={ACCOUNT_ITEM}
                        onClick={() => { openLoginModal && openLoginModal(); closeAndReset(); }}
                      >
                        Sign in
                      </button>
                    </li>
                    <li className="border-b border-line last:border-b-0">
                      <Link className={ACCOUNT_ITEM} to="/my-account?tab=wishlist" onClick={closeAndReset}>Wishlist</Link>
                    </li>
                  </>
                )}
              </ul>
            </>
          )}
        </div>
      </aside>
    </>
  );
};

export default MobileMenuDrawer;
