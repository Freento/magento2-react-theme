import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../../context/CartContext';
import { useAuth } from '../../../context/AuthContext';
import MiniCartItem from './MiniCartItem';
import MiniCartToasts from './MiniCartToasts';
import { submitMagentoCheckout } from './magentoCheckout';
import '../../../styles/layout/MiniCart.less';

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
    cartRecovered,
    clearCartRecovered,
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

  if (!isMiniCartOpen && !lastRemoved && !cartRecovered) return null;

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
  const formatMoney = (n) => `$${Number(n || 0).toFixed(2)}`;

  const hasItems = !loading && !merging && cartData?.items?.length > 0;
  const isEmpty = !loading && !merging && (!cartData?.items || cartData.items.length === 0);

  return (
    <>
      {isMiniCartOpen && (
        <div className="mini-cart-overlay" onClick={closeMiniCart} />
      )}

      {isMiniCartOpen && (
      <aside
        className="mini-cart-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="mc-title"
      >
        <header className="mc-head">
          <div className="mc-head-text">
            <span className="mc-eyebrow">Your bag</span>
            <h2 id="mc-title" className="mc-title">
              {itemsCount === 0 ? 'Empty for now' : itemsCount === 1 ? '1 item' : `${itemsCount} items`}
            </h2>
          </div>
          <button
            type="button"
            className="mc-close"
            onClick={closeMiniCart}
            aria-label="Close bag"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </header>

        <div className="mc-body">
          {(loading || merging) && (
            <div className="mc-status">
              {merging ? 'Updating cart after sign-in…' : 'Loading…'}
            </div>
          )}

          {isEmpty && (
            <div className="mc-empty">
              <span className="mc-empty-eyebrow">Quiet here</span>
              <p>Your bag is empty. Browse the edit and add the pieces you like.</p>
              <button
                type="button"
                className="mc-btn mc-btn--ghost"
                onClick={() => { closeMiniCart(); navigate('/'); }}
              >
                Continue shopping
              </button>
            </div>
          )}

          {hasItems && (
            <ul className="mc-items">
              {cartData.items.map((item) => (
                <MiniCartItem
                  key={item.id}
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
          <footer className="mc-foot">
            <dl className="mc-totals">
              <div>
                <dt>Subtotal</dt>
                <dd>{formatMoney(subtotal)}</dd>
              </div>
              {totalTaxAmount > 0 && (
                <div>
                  <dt>Tax</dt>
                  <dd>{formatMoney(totalTaxAmount)}</dd>
                </div>
              )}
              {totalDiscountAmount > 0 && (
                <div className="mc-totals-row--discount">
                  <dt>Discount</dt>
                  <dd>−{formatMoney(totalDiscountAmount)}</dd>
                </div>
              )}
              {shippingMethod && (
                <div>
                  <dt>
                    Shipping
                    {shippingMethod.method_title && (
                      <span className="mc-totals-hint">{shippingMethod.carrier_title} · {shippingMethod.method_title}</span>
                    )}
                  </dt>
                  <dd>{shippingAmount > 0 ? formatMoney(shippingAmount) : 'Free'}</dd>
                </div>
              )}
              <div className="mc-totals-row--grand">
                <dt>Total</dt>
                <dd>{formatMoney(total)} <span className="mc-currency">{currency}</span></dd>
              </div>
            </dl>

            <button
              type="button"
              onClick={handleCheckout}
              className="mc-btn mc-btn--primary"
            >
              Checkout · {formatMoney(total)}
            </button>
            <p className="mc-fineprint">Tax + shipping calculated at checkout.</p>
          </footer>
        )}
      </aside>
      )}

      <MiniCartToasts
        lastRemoved={lastRemoved}
        onDismissRemoved={clearLastRemoved}
        cartRecovered={cartRecovered}
        onDismissRecovered={clearCartRecovered}
      />
    </>
  );
};

export default MiniCart;
