import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useCart } from '../../context/CartContext';
import CloseIcon from './icons/CloseIcon';

export default function CartErrorToast() {
  const { error, clearError } = useCart();

  useEffect(() => {
    if (!error) return;
    const t = setTimeout(clearError, 5000);
    return () => clearTimeout(t);
  }, [error, clearError]);

  if (!error) return null;
  if (typeof document === 'undefined') return null;
  const target = document.getElementById('toast-stack');
  if (!target) return null;

  return createPortal(
    <div className="wl-toast wl-toast--error" role="alert" aria-live="assertive">
      <span className="wl-toast-text">{error}</span>
      <button type="button" className="wl-toast-close" onClick={clearError} aria-label="Dismiss">
        <CloseIcon size={14} strokeWidth={1.5} />
      </button>
    </div>,
    target
  );
}
