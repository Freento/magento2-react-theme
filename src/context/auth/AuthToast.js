import React from 'react';
import { createPortal } from 'react-dom';

const AuthToast = ({ message, onClose, kind }) => {
  if (!message || typeof document === 'undefined') return null;
  const target = document.getElementById('toast-stack');
  if (!target) return null;

  return createPortal(
    <div
      className={`wl-toast wl-toast--${kind}`}
      role={kind === 'error' ? 'alert' : 'status'}
      aria-live={kind === 'error' ? 'assertive' : 'polite'}
    >
      <span className="wl-toast-text">{message}</span>
      <button type="button" className="wl-toast-close" onClick={onClose} aria-label="Dismiss">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>,
    target
  );
};

export default AuthToast;
