import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useMutation } from '@apollo/client';
import { APPLY_COUPON_TO_CART, REMOVE_COUPON_FROM_CART } from '../../queries/checkout';

export default function CheckoutCoupon({ cartId, cartData, onChanged }) {
  const applied = cartData?.applied_coupons || [];
  const [code, setCode] = useState('');
  const [toastSuccess, setToastSuccess] = useState('');
  const [toastError, setToastError] = useState('');
  const [applyCoupon, { loading: applying }] = useMutation(APPLY_COUPON_TO_CART);
  const [removeCoupon, { loading: removing }] = useMutation(REMOVE_COUPON_FROM_CART);

  const handleApply = async (e) => {
    e?.preventDefault?.();
    setToastError('');
    const trimmed = code.trim();
    if (!trimmed) {
      setToastError('Enter a code first.');
      return;
    }
    try {
      await applyCoupon({ variables: { cartId, code: trimmed } });
      setCode('');
      setToastSuccess(`Code "${trimmed}" applied`);
      onChanged && onChanged();
    } catch (err) {
      setToastError(err?.graphQLErrors?.[0]?.message || err?.message || 'Failed to apply code.');
    }
  };

  const handleRemove = async () => {
    setToastError('');
    try {
      await removeCoupon({ variables: { cartId } });
      setToastSuccess('Code removed');
      onChanged && onChanged();
    } catch (err) {
      setToastError(err?.graphQLErrors?.[0]?.message || err?.message || 'Failed to remove code.');
    }
  };

  return (
    <div className="co-coupon" role="group" aria-labelledby="co-coupon-title">
      <h3 id="co-coupon-title" className="co-coupon-title">Discount code</h3>

      {applied.length > 0 ? (
        <div className="co-coupon-applied">
          {applied.map((c) => (
            <div key={c.code} className="co-coupon-chip">
              <span className="co-coupon-chip-main">
                <span className="co-coupon-chip-label">Code</span>
                <span className="co-coupon-chip-code">{c.code}</span>
              </span>
              <button
                type="button"
                className="co-coupon-chip-remove"
                onClick={handleRemove}
                disabled={removing}
                aria-label={`Remove code ${c.code}`}
                title="Remove code"
              >
                <span className="co-coupon-chip-remove-x" aria-hidden="true">×</span>
              </button>
            </div>
          ))}
        </div>
      ) : (
        <form className="co-coupon-form" onSubmit={handleApply}>
          <input
            type="text"
            className="form-input co-coupon-input"
            placeholder="Coupon code"
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
      )}

      {renderCouponToast(toastSuccess, () => setToastSuccess(''), 'success')}
      {renderCouponToast(toastError,   () => setToastError(''),   'error')}
    </div>
  );
}

function renderCouponToast(message, onClose, kind) {
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
