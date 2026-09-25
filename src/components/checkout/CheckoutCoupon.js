import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useMutation } from '@apollo/client';
import { APPLY_COUPON_TO_CART, REMOVE_COUPON_FROM_CART } from '../../queries/checkout';
import CloseIcon from '../ui/icons/CloseIcon';

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

  const inputCls = 'form-input co-coupon-input flex-1 min-w-0 disabled:bg-surface disabled:text-ink-2 disabled:border-line disabled:cursor-not-allowed disabled:opacity-100 disabled:[-webkit-text-fill-color:#6B6B6B]';
  const applyCls = 'btn-primary co-coupon-apply w-auto h-11 m-0 flex-none min-w-[110px] gap-2 py-0 max480:min-w-[92px] max480:px-3.5 disabled:bg-ink disabled:border-ink disabled:text-bg disabled:cursor-not-allowed';

  return (
    <div className="co-coupon mt-4 px-6 py-[22px] bg-bg border border-line rounded max480:px-4 max480:py-[18px]" role="group" aria-labelledby="co-coupon-title">
      <h3 id="co-coupon-title" className="co-coupon-title mb-3.5 text-xs font-medium tracking-eyebrow uppercase text-ink-2">Discount code</h3>

      {applied.length > 0 ? (
        <form className="co-coupon-form flex gap-2 items-stretch" onSubmit={(e) => { e.preventDefault(); handleRemove(); }}>
          <input
            type="text"
            className={inputCls}
            value={applied[0].code}
            readOnly
            disabled
            aria-label="Applied coupon code"
          />
          <button
            type="submit"
            className={applyCls}
            disabled={removing}
            aria-busy={removing}
          >
            <span>{removing ? 'Removing…' : 'Cancel Coupon'}</span>
          </button>
        </form>
      ) : (
        <form className="co-coupon-form flex gap-2 items-stretch" onSubmit={handleApply}>
          <input
            type="text"
            className={inputCls}
            placeholder="Coupon code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            disabled={applying}
            autoComplete="off"
            spellCheck={false}
          />
          <button
            type="submit"
            className={`${applyCls}${applying ? ' opacity-85' : ''}`}
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
        <CloseIcon size={14} strokeWidth={2} />
      </button>
    </div>,
    target
  );
}
