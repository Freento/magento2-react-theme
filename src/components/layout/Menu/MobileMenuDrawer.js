import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { getTileIcon } from './menuTileIcons';

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
      {isOpen && <div className="mobile-menu-scrim" onClick={closeAndReset} />}
      <aside
        ref={mobileMenuRef}
        className={`mobile-menu ${isOpen ? 'is-open' : ''}`}
        aria-label="Menu"
      >
        <div className="mobile-menu-head">
          {inSubmenu ? (
            <button
              type="button"
              onClick={goBack}
              className="mobile-menu-back"
              aria-label="Back"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
              <span>{current.name}</span>
            </button>
          ) : (
            <span className="mobile-menu-title">Menu</span>
          )}
          <button
            type="button"
            onClick={closeAndReset}
            className="icon-btn"
            aria-label="Close menu"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="mobile-menu-body">
          {inSubmenu ? (
            <ul className="mobile-menu-sublist">
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
                  className="mobile-menu-sublist-all"
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
                        onClick={() => setSubmenuPath((p) => [...p, child])}
                      >
                        <span>{child.name}</span>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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
                      >
                        <span>{child.name}</span>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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
              <div className="mobile-menu-tiles">
                {mobileTilesLoading && Array.from({ length: 6 }).map((_, i) => (
                  <div key={`mm-sk-${i}`} className="mobile-menu-tile mobile-menu-tile--skel" aria-hidden="true">
                    <span className="mobile-menu-tile-icon mm-skel-icon" />
                    <span className="mobile-menu-tile-label mm-skel-label" />
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
                      className="mobile-menu-tile"
                      {...tileProps}
                    >
                      <svg
                        className="mobile-menu-tile-icon"
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
                      <span className="mobile-menu-tile-label">{category.name}</span>
                    </TileEl>
                  );
                })}
              </div>

              <div className="mobile-menu-eyebrow mobile-menu-eyebrow-divider">Your account</div>
              <ul className="mobile-menu-account">
                {isAuthenticated ? (
                  <>
                    <li>
                      <Link to="/my-account" onClick={closeAndReset}>My account</Link>
                    </li>
                    <li>
                      <Link to="/my-account/orders" onClick={closeAndReset}>Orders</Link>
                    </li>
                    <li>
                      <Link to="/my-account?tab=wishlist" onClick={closeAndReset}>Wishlist</Link>
                    </li>
                    <li>
                      <button
                        type="button"
                        onClick={() => { logout && logout(); closeAndReset(); }}
                      >
                        Sign out
                      </button>
                    </li>
                  </>
                ) : (
                  <>
                    <li>
                      <button
                        type="button"
                        onClick={() => { openLoginModal && openLoginModal(); closeAndReset(); }}
                      >
                        Sign in
                      </button>
                    </li>
                    <li>
                      <Link to="/my-account?tab=wishlist" onClick={closeAndReset}>Wishlist</Link>
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
