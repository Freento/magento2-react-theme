import React from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useWishlist } from '../../context/WishlistContext';

const MBN_ITEM =
  'mbn-item flex-1 inline-flex flex-col items-center justify-center gap-1 py-1.5 bg-transparent border-0 cursor-pointer text-ink text-2xs font-medium tracking-[0.02em] normal-case no-underline transition-colors duration-fast ease-[ease] hover:text-ink [&_svg]:w-5 [&_svg]:h-5 [&_svg]:stroke-ink';

const MBN_BADGE =
  'mbn-badge absolute top-[-4px] right-[-8px] bg-ink text-bg text-2xs font-semibold tracking-normal rounded-pill min-w-[16px] px-[5px] h-4 leading-4 text-center normal-case';

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
    <nav className="mobile-bottom-nav hidden max900:flex fixed left-0 right-0 bottom-0 z-[70] bg-bg border-t border-line pt-1.5 pb-[max(6px,env(safe-area-inset-bottom))]" aria-label="Primary mobile">
      {isAuthenticated ? (
        <Link to="/my-account" className={MBN_ITEM}>
          <Icon.User />
          <span>Account</span>
        </Link>
      ) : (
        <button onClick={openLoginModal} className={MBN_ITEM} type="button">
          <Icon.User />
          <span>Account</span>
        </button>
      )}

      <Link
        to="/my-account?tab=wishlist"
        className={MBN_ITEM}
      >
        <span className="mbn-icon relative inline-flex">
          <Icon.Heart />
          {wishlistCount > 0 && <span className={MBN_BADGE}>{wishlistCount}</span>}
        </span>
        <span>Wishlist</span>
      </Link>

      <button onClick={openMiniCart} className={`${MBN_ITEM} mbn-cart`} type="button">
        <span className="mbn-icon relative inline-flex">
          <Icon.Bag />
          {cartCount > 0 && <span className={MBN_BADGE}>{cartCount}</span>}
        </span>
        <span>Cart</span>
      </button>
    </nav>
  );
}
