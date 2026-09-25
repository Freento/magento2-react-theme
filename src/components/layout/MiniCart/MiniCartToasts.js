import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import CloseIcon from '../../ui/icons/CloseIcon';

const MiniCartToasts = ({ lastRemoved, onDismissRemoved }) => {
  useEffect(() => {
    if (!lastRemoved) return;
    const t = setTimeout(() => { onDismissRemoved && onDismissRemoved(); }, 4000);
    return () => clearTimeout(t);
  }, [lastRemoved, onDismissRemoved]);

  const stack = typeof document !== 'undefined' ? document.getElementById('toast-stack') : null;
  if (!stack) return null;

  return (
    <>
      {lastRemoved && createPortal(
        <div className="mc-toast fixed top-4 right-4 max-w-[360px] min-w-[240px] bg-ink text-bg rounded py-3 px-3.5 flex items-center justify-between gap-3 text-13 shadow-[0_8px_24px_rgba(0,0,0,0.22)] z-[1100]" role="status" aria-live="polite">
          <span className="mc-toast-text">
            <strong className="font-semibold">{lastRemoved.name}</strong> removed from bag
          </span>
          <button type="button" className="mc-toast-close w-6 h-6 inline-flex items-center justify-center bg-transparent border-0 cursor-pointer rounded-pill text-bg/65 transition-colors duration-fast ease-[ease] hover:text-bg hover:bg-bg/10" onClick={onDismissRemoved} aria-label="Dismiss">
            <CloseIcon size={14} strokeWidth={1.5} />
          </button>
        </div>,
        stack
      )}
    </>
  );
};

export default MiniCartToasts;
