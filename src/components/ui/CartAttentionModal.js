import React, { useEffect, useRef } from 'react';
import { useCart } from '../../context/CartContext';
import CloseIcon from './icons/CloseIcon';
import useBackToClose from '../../hooks/useBackToClose';

export default function CartAttentionModal() {
  const { attention, clearAttention } = useCart();
  const okRef = useRef(null);
  useBackToClose('cartAttention', !!attention, clearAttention);

  useEffect(() => {
    if (!attention) return undefined;
    okRef.current?.focus();
    const onKey = (e) => { if (e.key === 'Escape') clearAttention(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [attention, clearAttention]);

  if (!attention) return null;

  return (
    <div className="cart-attention fixed inset-0 bg-ink/50 flex items-center justify-center z-[1100] p-5 box-border animate-scrim-quick" onClick={clearAttention}>
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="cart-attention-title"
        aria-describedby="cart-attention-text"
        className="bg-bg border border-line rounded max-w-[440px] w-full relative animate-modal-quick"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center px-6 pt-5 pb-4 border-b border-line">
          <h2 id="cart-attention-title" className="m-0 text-lg font-semibold tracking-[-0.01em] text-ink">Attention</h2>
          <button
            type="button"
            className="w-8 h-8 inline-flex items-center justify-center bg-transparent border-0 cursor-pointer text-ink-2 rounded transition-colors duration-fast ease-[ease] hover:bg-surface hover:text-ink"
            onClick={clearAttention}
            aria-label="Close"
          >
            <CloseIcon size={16} />
          </button>
        </div>
        <div className="px-6 py-5">
          <p id="cart-attention-text" className="m-0 text-base text-ink leading-relaxed">{attention}</p>
          <button ref={okRef} type="button" className="btn-primary mt-5 min-w-[96px] w-auto" onClick={clearAttention}>OK</button>
        </div>
      </div>
    </div>
  );
}
