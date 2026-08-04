import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';

const MiniCartToasts = ({ lastRemoved, onDismissRemoved, cartRecovered, onDismissRecovered }) => {
  useEffect(() => {
    if (!lastRemoved) return;
    const t = setTimeout(() => { onDismissRemoved && onDismissRemoved(); }, 4000);
    return () => clearTimeout(t);
  }, [lastRemoved, onDismissRemoved]);

  useEffect(() => {
    if (!cartRecovered) return;
    const t = setTimeout(() => { onDismissRecovered && onDismissRecovered(); }, 6000);
    return () => clearTimeout(t);
  }, [cartRecovered, onDismissRecovered]);

  const stack = typeof document !== 'undefined' ? document.getElementById('toast-stack') : null;
  if (!stack) return null;

  return (
    <>
      {lastRemoved && createPortal(
        <div className="mc-toast" role="status" aria-live="polite">
          <span className="mc-toast-text">
            <strong>{lastRemoved.name}</strong> removed from bag
          </span>
          <button type="button" className="mc-toast-close" onClick={onDismissRemoved} aria-label="Dismiss">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>,
        stack
      )}
      {cartRecovered && createPortal(
        <div className="mc-toast mc-toast--warn" role="status" aria-live="polite">
          <span className="mc-toast-text">
            Your previous bag expired. We started a fresh one for you.
          </span>
          <button type="button" className="mc-toast-close" onClick={onDismissRecovered} aria-label="Dismiss">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>,
        stack
      )}
    </>
  );
};

export default MiniCartToasts;
