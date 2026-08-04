import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useWishlist } from '../../context/WishlistContext';

export default function WishlistToast() {
  const { lastAdded, clearLastAdded } = useWishlist();

  useEffect(() => {
    if (!lastAdded) return;
    const t = setTimeout(clearLastAdded, 4000);
    return () => clearTimeout(t);
  }, [lastAdded, clearLastAdded]);

  if (!lastAdded) return null;
  if (typeof document === 'undefined') return null;
  const target = document.getElementById('toast-stack');
  if (!target) return null;

  return createPortal(
    <div className="wl-toast" role="status" aria-live="polite">
      <span className="wl-toast-text">
        <strong>{lastAdded.name}</strong> added to wishlist
      </span>
      <button
        type="button"
        className="wl-toast-close"
        onClick={clearLastAdded}
        aria-label="Dismiss"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>,
    target
  );
}
