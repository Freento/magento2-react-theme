import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../../context/CartContext';
import { useAuth } from '../../../context/AuthContext';
import MiniCartItem from './MiniCartItem';
import MiniCartToasts from './MiniCartToasts';
import { submitMagentoCheckout } from './magentoCheckout';
import CloseIcon from '../../ui/icons/CloseIcon';
import { formatMoney as formatMoneyShared } from '../../../lib/money';

const MC_BTN =
  'mc-btn inline-flex items-center justify-center w-full h-12 text-base font-medium tracking-[0.02em] rounded cursor-pointer transition-colors duration-med ease-[ease]';
const MC_BTN_PRIMARY = `${MC_BTN} mc-btn--primary bg-ink text-bg border border-ink hover:bg-black`;
const MC_BTN_GHOST = `${MC_BTN} mc-btn--ghost bg-transparent text-ink border border-line hover:bg-surface hover:border-ink`;

const MC_TOTALS_ROW = 'flex justify-between items-baseline text-[13px] text-ink';
const MC_TOTALS_DT = 'text-ink-2 inline-flex flex-col gap-[2px]';
const MC_TOTALS_DD = 'm-0 font-medium';

const MiniCart = () => {
  const navigate = useNavigate();
  const {
    cartData,
    isMiniCartOpen,
    closeMiniCart,
    updateQuantity,
    removeItem,
    loading,
    merging,
    getCartItemsCount,
    pendingItems,
    lastRemoved,
    clearLastRemoved,
  } = useCart();
  const { token, isAuthenticated } = useAuth();

  const checkoutMode = (import.meta.env?.VITE_CHECKOUT_MODE || 'react').toLowerCase();

  useEffect(() => {
    if (!isMiniCartOpen) return;
    const onKey = (e) => { if (e.key === 'Escape') closeMiniCart(); };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [isMiniCartOpen, closeMiniCart]);

  const handleCheckout = () => {
    const cartId = cartData?.id;
    if (!cartId) return;
    if (checkoutMode !== 'magento') {
      closeMiniCart();
      navigate('/checkout');
      return;
    }
    submitMagentoCheckout(cartId, { token, isAuthenticated });
  };

  if (!isMiniCartOpen && !lastRemoved) return null;

  const itemsCount = getCartItemsCount();
  const subtotal = cartData?.prices?.subtotal_excluding_tax?.value || 0;
  const total = cartData?.prices?.grand_total?.value || 0;
  const currency = cartData?.prices?.grand_total?.currency || 'USD';
  const appliedTaxes = cartData?.prices?.applied_taxes || [];
  const discounts = cartData?.prices?.discounts || [];
  const shippingMethod = cartData?.shipping_addresses?.[0]?.selected_shipping_method;

  const totalTaxAmount = appliedTaxes.reduce((sum, tax) => sum + (tax.amount?.value || 0), 0);
  const totalDiscountAmount = discounts.reduce((sum, discount) => sum + (discount.amount?.value || 0), 0);
  const shippingAmount = shippingMethod?.amount?.value || 0;
  const formatMoney = (n) => formatMoneyShared(n ?? 0, currency);

  const hasItems = !loading && !merging && cartData?.items?.length > 0;
  const isEmpty = !loading && !merging && (!cartData?.items || cartData.items.length === 0);

  return (
    <>
      {isMiniCartOpen && (
        <div className="mini-cart-overlay fixed inset-0 bg-ink/40 z-[998] animate-scrim" onClick={closeMiniCart} />
      )}

      {isMiniCartOpen && (
      <aside
        className="mini-cart-panel fixed top-0 right-0 w-[420px] max-w-[100vw] h-screen bg-bg border-l border-line shadow-none z-[999] flex flex-col animate-drawer max480:w-screen max480:border-l-0"
        role="dialog"
        aria-modal="true"
        aria-labelledby="mc-title"
      >
        <header className="mc-head flex items-center justify-between pt-[22px] px-[22px] pb-[18px] border-b border-line">
          <div className="mc-head-text flex flex-col gap-1 min-w-0">
            <span className="mc-eyebrow text-xs font-medium tracking-[0.12em] uppercase text-ink-2">Your bag</span>
            <h2 id="mc-title" className="mc-title m-0 text-lg font-semibold text-ink tracking-[-0.01em] leading-[1.2]">
              {itemsCount === 0 ? 'Empty for now' : itemsCount === 1 ? '1 item' : `${itemsCount} items`}
            </h2>
          </div>
          <button
            type="button"
            className="mc-close w-8 h-8 inline-flex items-center justify-center bg-transparent border-0 cursor-pointer rounded-pill text-ink-2 transition-colors duration-fast ease-[ease] hover:bg-surface hover:text-ink"
            onClick={closeMiniCart}
            aria-label="Close bag"
          >
            <CloseIcon size={18} strokeWidth={1.5} />
          </button>
        </header>

        <div className="mc-body flex-1 overflow-y-auto px-[22px]">
          {(loading || merging) && (
            <div className="mc-status text-center py-14 text-ink-2 text-13 italic font-serif">
              {merging ? 'Updating cart after sign-in…' : 'Loading…'}
            </div>
          )}

          {isEmpty && (
            <div className="mc-empty text-center py-14 text-ink-2">
              <span className="mc-empty-eyebrow inline-block text-xs font-medium tracking-[0.12em] uppercase text-ink-2 mb-2">Quiet here</span>
              <p className="mx-auto mt-0 mb-5 max-w-[28ch] text-base leading-relaxed text-ink-2">Your bag is empty. Browse the edit and add the pieces you like.</p>
              <button
                type="button"
                className={MC_BTN_GHOST}
                onClick={() => { closeMiniCart(); navigate('/'); }}
              >
                Continue shopping
              </button>
            </div>
          )}

          {hasItems && (
            <ul className="mc-items list-none m-0 p-0">
              {cartData.items.map((item) => (
                <MiniCartItem
                  key={item.uid || item.id}
                  item={item}
                  isPending={!!(pendingItems && pendingItems.has(item.id))}
                  onUpdateQuantity={updateQuantity}
                  onRemove={removeItem}
                  onNavigate={closeMiniCart}
                  formatMoney={formatMoney}
                />
              ))}
            </ul>
          )}
        </div>

        {hasItems && (
          <footer className="mc-foot border-t border-line pt-[18px] px-[22px] pb-[22px] bg-bg">
            <dl className="mc-totals mt-0 mb-3.5 flex flex-col gap-1.5">
              <div className={MC_TOTALS_ROW}>
                <dt className={MC_TOTALS_DT}>Subtotal</dt>
                <dd className={MC_TOTALS_DD}>{formatMoney(subtotal)}</dd>
              </div>
              {totalTaxAmount > 0 && (
                <div className={MC_TOTALS_ROW}>
                  <dt className={MC_TOTALS_DT}>Tax</dt>
                  <dd className={MC_TOTALS_DD}>{formatMoney(totalTaxAmount)}</dd>
                </div>
              )}
              {totalDiscountAmount > 0 && (
                <div className={`mc-totals-row--discount ${MC_TOTALS_ROW}`}>
                  <dt className={MC_TOTALS_DT}>Discount</dt>
                  <dd className={`${MC_TOTALS_DD} text-ink`}>−{formatMoney(totalDiscountAmount)}</dd>
                </div>
              )}
              {shippingMethod && (
                <div className={MC_TOTALS_ROW}>
                  <dt className={MC_TOTALS_DT}>
                    Shipping
                    {shippingMethod.method_title && (
                      <span className="mc-totals-hint text-2xs tracking-[0.08em] uppercase text-ink-2">{shippingMethod.carrier_title} · {shippingMethod.method_title}</span>
                    )}
                  </dt>
                  <dd className={MC_TOTALS_DD}>{shippingAmount > 0 ? formatMoney(shippingAmount) : 'Free'}</dd>
                </div>
              )}
              <div className="mc-totals-row--grand flex justify-between items-baseline text-md text-ink mt-1.5 pt-2.5 border-t border-line">
                <dt className="text-ink font-medium normal-case tracking-normal inline-flex flex-col gap-[2px]">Total</dt>
                <dd className="m-0 text-[16px] font-semibold">{formatMoney(total)}</dd>
              </div>
            </dl>

            <button
              type="button"
              onClick={handleCheckout}
              className={MC_BTN_PRIMARY}
            >
              Checkout · {formatMoney(total)}
            </button>
            <button
              type="button"
              className={`${MC_BTN_GHOST} mc-view-cart mt-2.5`}
              onClick={() => { closeMiniCart(); navigate('/cart'); }}
            >
              View and Edit Cart
            </button>
            <p className="mc-fineprint mt-2.5 mb-0 text-center text-xs font-serif italic text-ink-2">Tax + shipping calculated at checkout.</p>
          </footer>
        )}
      </aside>
      )}

      <MiniCartToasts
        lastRemoved={lastRemoved}
        onDismissRemoved={clearLastRemoved}
      />
    </>
  );
};

export default MiniCart;
