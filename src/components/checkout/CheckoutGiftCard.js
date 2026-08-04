import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useMutation } from '@apollo/client';
import { APPLY_GIFT_CARD_TO_CART, REMOVE_GIFT_CARD_FROM_CART } from '../../queries/checkout';


export default function CheckoutGiftCard({ cartId, cartData, onChanged }) {
  const applied = cartData?.applied_gift_cards || [];
  const [code, setCode] = useState('');
  const [toastSuccess, setToastSuccess] = useState('');
  const [toastError, setToastError] = useState('');
  const [applyGiftCard, { loading: applying }] = useMutation(APPLY_GIFT_CARD_TO_CART);
  const [removeGiftCard] = useMutation(REMOVE_GIFT_CARD_FROM_CART);
  const [removingCode, setRemovingCode] = useState(null);

  const formatMoney = (m) => {
    if (!m || m.value == null) return '';
    const value = Number(m.value).toFixed(2);
    return m.currency === 'USD' ? `$${value}` : `${value} ${m.currency || ''}`.trim();
  };

  const handleApply = async (e) => {
    e?.preventDefault?.();
    setToastError('');
    const trimmed = code.trim();
    if (!trimmed) {
      setToastError('Enter a gift card code first.');
      return;
    }
    try {
      await applyGiftCard({ variables: { cartId, code: trimmed } });
      setCode('');
      setToastSuccess(`Gift card "${trimmed}" applied`);
      onChanged && onChanged();
    } catch (err) {
      setToastError(err?.graphQLErrors?.[0]?.message || err?.message || 'Failed to apply gift card.');
    }
  };

  const handleRemove = async (giftCode) => {
    setToastError('');
    setRemovingCode(giftCode);
    try {
      await removeGiftCard({ variables: { cartId, code: giftCode } });
      setToastSuccess('Gift card removed');
      onChanged && onChanged();
    } catch (err) {
      setToastError(err?.graphQLErrors?.[0]?.message || err?.message || 'Failed to remove gift card.');
    } finally {
      setRemovingCode(null);
    }
  };

  return (
    <div className="co-coupon" role="group" aria-labelledby="co-giftcard-title">
      <h3 id="co-giftcard-title" className="co-coupon-title">Gift card</h3>

      {applied.length > 0 && (
        <div className="co-coupon-applied">
          {applied.map((c) => (
            <div key={c.code} className="co-coupon-chip">
              <span className="co-coupon-chip-main">
                <span className="co-coupon-chip-label">Card</span>
                <span className="co-coupon-chip-code">{c.code}</span>
                {c.applied_balance && (
                  <span className="co-coupon-chip-meta">
                    −{formatMoney(c.applied_balance)}
                  </span>
                )}
              </span>
              <button
                type="button"
                className="co-coupon-chip-remove"
                onClick={() => handleRemove(c.code)}
                disabled={removingCode === c.code}
                aria-label={`Remove gift card ${c.code}`}
                title="Remove gift card"
              >
                <span className="co-coupon-chip-remove-x" aria-hidden="true">×</span>
              </button>
            </div>
          ))}
        </div>
      )}

      <form className="co-coupon-form" onSubmit={handleApply}>
        <input
          type="text"
          className="form-input co-coupon-input"
          placeholder="Gift card code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          disabled={applying}
          autoComplete="off"
          spellCheck={false}
        />
        <button
          type="submit"
          className={`btn-primary co-coupon-apply${applying ? ' is-loading' : ''}`}
          disabled={applying}
          aria-busy={applying}
        >
          {applying && <span className="btn-spinner" aria-hidden="true" />}
          <span>{applying ? 'Applying…' : 'Apply'}</span>
        </button>
      </form>

      {renderGiftCardToast(toastSuccess, () => setToastSuccess(''), 'success')}
      {renderGiftCardToast(toastError,   () => setToastError(''),   'error')}
    </div>
  );
}

function renderGiftCardToast(message, onClose, kind) {
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
}
