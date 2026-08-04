import React from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useWishlist } from '../../context/WishlistContext';
import '../../styles/layout/MobileBottomNav.less';

const Icon = {
  User: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  Heart: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  ),
  Bag: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 7h12l-1 13H7L6 7z" />
      <path d="M9 7V5a3 3 0 0 1 6 0v2" />
    </svg>
  ),
};

export default function MobileBottomNav() {
  const { openMiniCart, getCartItemsCount } = useCart();
  const { isAuthenticated, openLoginModal } = useAuth();
  const { wishlistCount } = useWishlist();
  const cartCount = getCartItemsCount();

  return (
    <nav className="mobile-bottom-nav" aria-label="Primary mobile">
      {isAuthenticated ? (
        <Link to="/my-account" className="mbn-item">
          <Icon.User />
          <span>Account</span>
        </Link>
      ) : (
        <button onClick={openLoginModal} className="mbn-item" type="button">
          <Icon.User />
          <span>Account</span>
        </button>
      )}

      <Link
        to="/my-account?tab=wishlist"
        className="mbn-item"
      >
        <span className="mbn-icon">
          <Icon.Heart />
          {wishlistCount > 0 && <span className="mbn-badge">{wishlistCount}</span>}
        </span>
        <span>Wishlist</span>
      </Link>

      <button onClick={openMiniCart} className="mbn-item mbn-cart" type="button">
        <span className="mbn-icon">
          <Icon.Bag />
          {cartCount > 0 && <span className="mbn-badge">{cartCount}</span>}
        </span>
        <span>Cart</span>
      </button>
    </nav>
  );
}
