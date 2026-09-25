import React, { useState, useEffect, lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';
import Menu from './Menu';
import CompareIcon from '../ui/icons/CompareIcon';

const SearchBox = lazy(() => import('../search/SearchBox'));
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useCompare } from '../../context/CompareContext';

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
  Compare: (p) => <CompareIcon size={18} strokeWidth={1.5} {...p} />,
  Burger: (p) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" {...p}>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  ),
};

const ICON_BTN =
  'icon-btn w-9 h-9 inline-flex items-center justify-center rounded-pill text-ink transition-colors duration-fast ease-[ease] hover:bg-surface hover:text-ink [&_svg]:w-[18px] [&_svg]:h-[18px]';

const CART_COUNT =
  'cart-count absolute top-1 right-1 max480:top-[2px] max480:right-[2px] bg-ink text-bg text-2xs font-semibold rounded-pill min-w-[16px] px-[5px] h-4 leading-4 text-center';

const NAV_LINK_UNDERLINE =
  "relative py-1.5 text-13 font-medium tracking-[0.02em] after:content-[''] after:absolute after:left-0 after:right-0 after:bottom-0 after:h-px after:bg-ink after:origin-left after:scale-x-0 after:[transition:transform_200ms_ease] hover:after:scale-x-100";

const Header = () => {
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchClosing, setSearchClosing] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { openMiniCart, getCartItemsCount } = useCart();
  const { isAuthenticated, openLoginModal } = useAuth();
  const { compareCount } = useCompare();
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
      <div className="topbar bg-ink text-bg text-sm tracking-[0.08em] uppercase text-center py-2 px-gutter max768:text-[8px] max768:py-1.5 max768:px-3">
        Complimentary shipping on orders over $80.
      </div>

      <header className="header sticky top-0 z-50 bg-bg/[0.96] [backdrop-filter:saturate(180%)_blur(12px)] border-b border-line text-ink p-0 shadow-none">
        <nav className="nav max-w-container mx-auto px-gutter grid grid-cols-[1fr_auto_1fr] items-center h-16 gap-[18px] max900:grid-cols-[auto_1fr] max900:gap-3 max900:h-14 max480:px-3 max480:h-[52px]">
          <div className="nav-left flex items-center gap-3 min-w-0">
            <Link to="/" className="logo text-[16px] font-semibold tracking-[-0.01em] text-ink whitespace-nowrap hover:text-ink max900:mr-auto">
              SimpleShop<span className="logo-dot text-accent">.</span>
            </Link>
          </div>

          <div className="desktop-menu justify-self-center max900:hidden">
            <Menu />
          </div>

          <ul className="nav-links flex gap-[18px] list-none items-center justify-self-end max900:gap-[2px] max900:ml-auto">
            <li>
              <button
                onClick={() => (searchOpen ? closeSearch() : openSearch())}
                className={ICON_BTN}
                aria-label="Search"
              >
                <Icon.Search />
              </button>
            </li>

            <li className="nav-link-burger">
              <button
                onClick={() => (mobileMenuOpen ? setMobileMenuOpen(false) : openMenu())}
                className="icon-btn mobile-menu-btn-left w-9 h-9 hidden max900:inline-flex items-center justify-center rounded-pill text-ink transition-colors duration-fast ease-[ease] hover:bg-surface [&_svg]:w-[18px] [&_svg]:h-[18px]"
                aria-label="Open menu"
              >
                <Icon.Burger />
              </button>
            </li>

            <li className="nav-link-account max900:hidden">
              {isAuthenticated ? (
                <Link to="/my-account" className={`${ICON_BTN} ${NAV_LINK_UNDERLINE} user-account-link`} title="My Account">
                  <Icon.User />
                </Link>
              ) : (
                <button
                  onClick={openLoginModal}
                  className={`${ICON_BTN} user-account-btn`}
                  title="Sign In"
                >
                  <Icon.User />
                </button>
              )}
            </li>

            <li className="nav-link-compare max900:hidden">
              <Link to="/compare" className={`${ICON_BTN} ${NAV_LINK_UNDERLINE} cart-wrap relative`} aria-label="Compare products" title="Compare products">
                <Icon.Compare />
                {compareCount > 0 && <span className={CART_COUNT}>{compareCount}</span>}
              </Link>
            </li>

            <li className="nav-link-cart max900:hidden">
              <button
                onClick={openMiniCart}
                className={`${ICON_BTN} cart-wrap relative`}
                aria-label="Open cart"
              >
                <Icon.Bag />
                {cartCount > 0 && <span className={CART_COUNT}>{cartCount}</span>}
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
            className={`search-scrim fixed inset-0 bg-ink/40 z-[90] ${searchClosing ? 'is-closing animate-scrim-out' : 'animate-scrim'}`}
            onClick={closeSearch}
          />
          <div
            className={`search-overlay fixed top-0 left-0 right-0 z-[95] bg-bg border-b border-line ${searchClosing ? 'is-closing animate-overlay-out' : 'animate-overlay'}`}
            role="dialog"
            aria-modal="true"
            aria-label="Search"
            onAnimationEnd={(e) => {
              if (searchClosing && e.target === e.currentTarget) {
                setSearchClosing(false);
              }
            }}
          >
            <div className="search-overlay-inner max-w-container mx-auto pt-[18px] px-gutter pb-[22px] max768:max-w-full max768:pt-3.5 max768:px-4">
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
