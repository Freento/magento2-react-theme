import React, { useState, useEffect, lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';
import Menu from './Menu';
import '../../styles/layout/Header.less';

const SearchBox = lazy(() => import('../search/SearchBox'));
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';

const Icon = {
  Search: (p) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  ),
  User: (p) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  Bag: (p) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M6 7h12l-1 13H7L6 7z" />
      <path d="M9 7V5a3 3 0 0 1 6 0v2" />
    </svg>
  ),
  Burger: (p) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" {...p}>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  ),
};

const Header = () => {
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchClosing, setSearchClosing] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { openMiniCart, getCartItemsCount } = useCart();
  const { isAuthenticated, openLoginModal } = useAuth();
  const cartCount = getCartItemsCount();

  const closeSearch = () => {
    setSearchOpen((wasOpen) => {
      if (wasOpen) setSearchClosing(true);
      return false;
    });
  };

  useEffect(() => {
    if (!searchOpen && !mobileMenuOpen) return;
    const onKey = (e) => {
      if (e.key === 'Escape') {
        if (searchOpen) closeSearch();
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [searchOpen, mobileMenuOpen]);

  const openSearch = () => { setMobileMenuOpen(false); setSearchClosing(false); setSearchOpen(true); };
  const openMenu = () => { closeSearch(); setMobileMenuOpen(true); };

  return (
    <>
      <div className="topbar">
        Complimentary shipping on orders over $80.
      </div>

      <header className="header">
        <nav className="nav">
          <div className="nav-left">
            <Link to="/" className="logo">
              SimpleShop<span className="logo-dot">.</span>
            </Link>
          </div>

          <div className="desktop-menu">
            <Menu />
          </div>

          <ul className="nav-links">
            <li>
              <button
                onClick={() => (searchOpen ? closeSearch() : openSearch())}
                className="icon-btn"
                aria-label="Search"
              >
                <Icon.Search />
              </button>
            </li>

            <li className="nav-link-burger">
              <button
                onClick={() => (mobileMenuOpen ? setMobileMenuOpen(false) : openMenu())}
                className="icon-btn mobile-menu-btn-left"
                aria-label="Open menu"
              >
                <Icon.Burger />
              </button>
            </li>

            <li className="nav-link-account">
              {isAuthenticated ? (
                <Link to="/my-account" className="icon-btn user-account-link" title="My Account">
                  <Icon.User />
                </Link>
              ) : (
                <button
                  onClick={openLoginModal}
                  className="icon-btn user-account-btn"
                  title="Sign In"
                >
                  <Icon.User />
                </button>
              )}
            </li>

            <li className="nav-link-cart">
              <button
                onClick={openMiniCart}
                className="icon-btn cart-wrap"
                aria-label="Open cart"
              >
                <Icon.Bag />
                {cartCount > 0 && <span className="cart-count">{cartCount}</span>}
              </button>
            </li>
          </ul>
        </nav>
      </header>

      <Menu
        isMobile={true}
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />

      {(searchOpen || searchClosing) && (
        <>
          <div
            className={`search-scrim${searchClosing ? ' is-closing' : ''}`}
            onClick={closeSearch}
          />
          <div
            className={`search-overlay${searchClosing ? ' is-closing' : ''}`}
            role="dialog"
            aria-modal="true"
            aria-label="Search"
            onAnimationEnd={(e) => {
              if (searchClosing && e.target === e.currentTarget) {
                setSearchClosing(false);
              }
            }}
          >
            <div className="search-overlay-inner">
              <Suspense fallback={null}>
                <SearchBox autoFocus onClose={closeSearch} />
              </Suspense>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default Header;
