import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import CheckoutCoupon from '../checkout/CheckoutCoupon';
import CartShippingEstimate from './CartShippingEstimate';
import CloseIcon from '../ui/icons/CloseIcon';
import ArrowLeftIcon from '../ui/icons/ArrowLeftIcon';
import PencilIcon from '../ui/icons/PencilIcon';
import { submitMagentoCheckout } from '../layout/MiniCart/magentoCheckout';
import { src } from '../../lib/productImage';
import { formatMoney as fmt } from '../../lib/money';
import { MAX_QTY_DIGITS } from '../../lib/catalog';
import { customOptionLines } from '../../lib/cartItemOptions';
import { productPrefetchAttrs } from '../../lib/productLink';

const CART_GRID = 'grid grid-cols-[1fr_110px_130px_110px_72px] gap-3';
const QTY_BTN = 'w-8 h-full border-0 text-base text-ink [transition:background_120ms_ease] enabled:hover:bg-surface disabled:text-ink-2 disabled:cursor-not-allowed';

function CartQty({ item, isPending, onUpdateQuantity }) {
  const [draft, setDraft] = useState(String(item.quantity));

  useEffect(() => {
    if (!isPending) setDraft(String(item.quantity));
  }, [isPending, item.quantity]);

  const commit = () => {
    const parsed = parseInt(draft, 10);
    if (!Number.isFinite(parsed) || parsed < 1) {
      setDraft(String(item.quantity));
      return;
    }
    setDraft(String(parsed));
    if (parsed !== item.quantity) onUpdateQuantity(item.id, parsed);
  };

  return (
    <div className="cart-qty inline-flex items-center border border-line rounded overflow-hidden h-9" role="group" aria-label="Quantity">
      <button
        type="button"
        className={QTY_BTN}
        onClick={() => onUpdateQuantity(item.id, Math.max(1, item.quantity - 1))}
        aria-label="Decrease"
        disabled={item.quantity <= 1 || isPending}
      >−</button>
      <input
        type="number"
        name={`qty-${item.id}`}
        autoComplete="off"
        inputMode="numeric"
        value={draft}
        min="1"
        disabled={isPending}
        onChange={(e) => { if (e.target.value.length <= MAX_QTY_DIGITS) setDraft(e.target.value); }}
        onBlur={commit}
        onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
        aria-label="Quantity"
        className="w-12 h-full border-0 p-0 text-center font-sans text-13 text-ink bg-transparent [appearance:textfield] [-moz-appearance:textfield] [&::-webkit-outer-spin-button]:[-webkit-appearance:none] [&::-webkit-outer-spin-button]:m-0 [&::-webkit-inner-spin-button]:[-webkit-appearance:none] [&::-webkit-inner-spin-button]:m-0 focus:outline-none focus:bg-surface disabled:text-ink-2"
      />
      <button
        type="button"
        className={QTY_BTN}
        onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
        aria-label="Increase"
        disabled={isPending}
      >+</button>
    </div>
  );
}

function CartLine({ item, isPending, onUpdateQuantity, onRemove }) {
  if (!item?.product) return null;
  const href = `/${item.product.url_key}${item.product.url_suffix || ''}`;
  const prefetch = productPrefetchAttrs(item.product);
  const linkState = item.product?.id ? { resolved: {
    type: 'product',
    id: Number(item.product.id),
    path: `${item.product.url_key}${item.product.url_suffix || ''}`,
  } } : undefined;
  // Opens the product page pre-configured with this line's options and qty,
  // where "Update Cart" replaces the line.
  const editState = {
    ...linkState,
    cartEdit: {
      itemId: item.id,
      quantity: item.quantity,
      valueUids: (item.configurable_options || [])
        .map((o) => o.configurable_product_option_value_uid)
        .filter(Boolean),
    },
  };
  const unitPrice = item.prices?.price;
  const rowTotal = item.prices?.row_total
    ?? (unitPrice?.value != null ? { value: unitPrice.value * item.quantity, currency: unitPrice.currency } : null);

  return (
    <div
      className={`cart-row ${CART_GRID} items-center py-[18px] border-b border-line text-base text-ink max768:grid-cols-[1fr_auto] max768:[grid-template-areas:'product_product'_'qty_total'_'price_remove']${isPending ? ' opacity-[0.55] pointer-events-none' : ''}`}
      role="row"
    >
      <div className="cart-col-product flex items-center gap-3.5 min-w-0 max768:[grid-area:product]" role="cell">
        <Link to={href} state={linkState} {...prefetch} className="cart-row-img shrink-0" aria-label={`Open ${item.product.name}`}>
          <img className="w-[72px] h-[90px] object-cover rounded bg-surface block" src={src(item.configured_variant?.thumbnail || item.product.thumbnail)} alt={item.product.name} loading="lazy" />
        </Link>
        <div className="cart-row-info min-w-0">
          <Link to={href} state={linkState} {...prefetch} className="cart-row-name block font-medium text-ink no-underline leading-[1.35] hover:text-ink hover:underline hover:underline-offset-2">{item.product.name}</Link>
          <div className="cart-row-sku mt-0.5 text-xs text-ink-2">SKU {item.configured_variant?.sku || item.product.sku}</div>
          {(item.configurable_options || []).map((opt) => (
            <div key={opt.option_label} className="cart-row-option mt-0.5 text-xs text-ink-2">
              {opt.option_label}: {opt.value_label}
            </div>
          ))}
          {customOptionLines(item).map((opt) => (
            <div key={opt.uid} className="cart-row-option mt-0.5 text-xs text-ink-2 break-words">
              {opt.label}: {opt.value}
            </div>
          ))}
        </div>
      </div>
      <div className="cart-col-price max768:[grid-area:price]" role="cell">{fmt(unitPrice?.value, unitPrice?.currency)}</div>
      <div className="cart-col-qty max768:[grid-area:qty]" role="cell">
        <CartQty item={item} isPending={isPending} onUpdateQuantity={onUpdateQuantity} />
      </div>
      <div className="cart-col-total max768:[grid-area:total] max768:text-right" role="cell">{fmt(rowTotal?.value, rowTotal?.currency)}</div>
      <div className="cart-col-remove flex items-center justify-end gap-1 max768:[grid-area:remove]" role="cell">
        <Link
          to={href}
          state={editState}
          {...prefetch}
          className="cart-row-edit inline-flex items-center justify-center w-[30px] h-[30px] bg-transparent border-0 rounded-pill text-ink-2 cursor-pointer [transition:color_120ms_ease,background_120ms_ease] hover:text-ink hover:bg-surface"
          aria-label={`Edit ${item.product.name}`}
          title="Edit item"
        >
          <PencilIcon />
        </Link>
        <button
          type="button"
          className="cart-row-remove inline-flex items-center justify-center w-[30px] h-[30px] bg-transparent border-0 rounded-pill text-ink-2 cursor-pointer [transition:color_120ms_ease,background_120ms_ease] enabled:hover:text-ink enabled:hover:bg-surface"
          onClick={() => onRemove(item.id)}
          disabled={isPending}
          aria-label={`Remove ${item.product.name}`}
          title="Remove item"
        >
          <CloseIcon size={14} />
        </button>
      </div>
    </div>
  );
}

const SkLine = ({ className = '', bar }) => (
  <span className={`block ${className}`}>
    <span className={`skeleton inline-block align-middle ${bar}`} />
  </span>
);

function CartSkeleton() {
  return (
    <div className="cart-layout grid grid-cols-[1fr_340px] gap-10 items-start max1024:grid-cols-[1fr_300px] max1024:gap-7 max768:grid-cols-1" aria-hidden="true">
      <section className="cart-main">
        <div className={`${CART_GRID} pb-3 border-b border-line text-2xs max768:hidden`}>
          <SkLine bar="h-2.5 w-10" />
          <SkLine bar="h-2.5 w-10" />
          <SkLine bar="h-2.5 w-8" />
          <SkLine bar="h-2.5 w-16" />
          <span />
        </div>
        {[0, 1].map((i) => (
          <div key={i} className={`${CART_GRID} items-center py-[18px] border-b border-line text-base max768:grid-cols-[1fr_auto] max768:[grid-template-areas:'product_product'_'qty_total'_'price_remove']`}>
            <div className="flex items-center gap-3.5 min-w-0 max768:[grid-area:product]">
              <span className="skeleton w-[72px] h-[90px] rounded shrink-0" />
              <div className="min-w-0 flex-1">
                <SkLine className="leading-[1.35]" bar="h-3.5 w-3/5 max-w-[220px] min-w-[120px]" />
                <SkLine className="mt-0.5 text-xs" bar="h-2.5 w-20" />
              </div>
            </div>
            <SkLine className="max768:[grid-area:price]" bar="h-3.5 w-14" />
            <span className="skeleton w-[106px] h-9 rounded max768:[grid-area:qty]" />
            <SkLine className="max768:[grid-area:total] max768:text-right" bar="h-3.5 w-14" />
            <div className="flex items-center justify-end gap-1 max768:[grid-area:remove]">
              <span className="skeleton w-[30px] h-[30px] rounded-pill" />
              <span className="skeleton w-[30px] h-[30px] rounded-pill" />
            </div>
          </div>
        ))}
        <div className="mt-6 pt-5 border-t border-line">
          <div className="mt-4 px-6 py-[22px] bg-bg border border-line rounded max480:px-4 max480:py-[18px]">
            <SkLine className="mb-3.5 text-xs" bar="h-2.5 w-28" />
            <div className="flex gap-2 items-stretch">
              <span className="skeleton flex-1 h-11 rounded" />
              <span className="skeleton w-[84px] h-11 rounded" />
            </div>
          </div>
        </div>
        <SkLine className="mt-5 text-sm" bar="h-3 w-36" />
      </section>

      <aside className="cart-summary sticky top-6 p-6 border border-line rounded-lg bg-bg">
        <SkLine className="mb-4 text-lg" bar="h-4 w-24" />
        <div className="mb-1 border-b border-line pb-3.5">
          <SkLine className="text-base" bar="h-3.5 w-48" />
        </div>
        <div className="mt-[18px]">
          <div className="flex justify-between py-1.5 text-base">
            <SkLine bar="h-3.5 w-16" />
            <SkLine bar="h-3.5 w-14" />
          </div>
          <div className="flex justify-between py-1.5 pt-3.5 mt-2 border-t border-line text-lg">
            <SkLine bar="h-4 w-12" />
            <SkLine bar="h-4 w-16" />
          </div>
        </div>
        <span className="skeleton block w-full h-11 mt-[18px] rounded" />
        <SkLine className="mt-2.5 text-xs text-center" bar="h-2.5 w-44" />
      </aside>
    </div>
  );
}

export default function ShoppingCart() {
  const navigate = useNavigate();
  const {
    cartData,
    cartId,
    cartInitialized,
    merging,
    error,
    pendingItems,
    updateQuantity,
    removeItem,
    loadCart,
    refetchCart,
  } = useCart();
  const { token, isAuthenticated } = useAuth();

  const checkoutMode = (import.meta.env?.VITE_CHECKOUT_MODE || 'react').toLowerCase();

  useEffect(() => {
    loadCart();
  }, [loadCart]);

  const items = cartData?.items || [];
  const prices = cartData?.prices || {};
  const subtotal = prices.subtotal_excluding_tax || prices.subtotal_including_tax;
  const taxes = prices.applied_taxes || [];
  const taxTotal = taxes.reduce((sum, t) => sum + (t.amount?.value || 0), 0);
  const discounts = prices.discounts || [];
  const grandTotal = prices.grand_total;
  const ccy = grandTotal?.currency;
  const shipMethod = cartData?.shipping_addresses?.[0]?.selected_shipping_method || null;

  const handleCheckout = () => {
    if (!cartData?.id) return;
    if (checkoutMode !== 'magento') {
      navigate('/checkout');
      return;
    }
    submitMagentoCheckout(cartData.id, { token, isAuthenticated });
  };

  if (merging || !cartInitialized || (cartId && !cartData && !error)) {
    return (
      <div className="cart-page py-10 max768:pt-4" aria-busy="true" aria-live="polite">
        <h1 className="page-title text-hero text-ink mb-6">Shopping Cart</h1>
        <CartSkeleton />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="cart-page py-10 max768:pt-4">
        <h1 className="page-title text-hero text-ink mb-6">Shopping Cart</h1>
        <div className="flex flex-col items-center justify-center text-center min-h-[calc(100vh-420px)] px-5 py-[60px] text-ink-2 text-base">
          <p className="mb-[18px]">Your cart is empty.</p>
          <Link to="/" className="btn-primary inline-flex justify-center w-auto min-w-[180px] m-0 no-underline">Continue Shopping</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page py-10 max768:pt-4">
      <h1 className="page-title text-hero text-ink mb-6">Shopping Cart</h1>
      <div className="cart-layout grid grid-cols-[1fr_340px] gap-10 items-start max1024:grid-cols-[1fr_300px] max1024:gap-7 max768:grid-cols-1">
        <section className="cart-main">
          <div role="table" aria-label="Cart items">
          <div className={`cart-head ${CART_GRID} pb-3 border-b border-line text-2xs font-semibold tracking-eyebrow uppercase text-ink-2 max768:hidden`} role="row">
            <span className="cart-col-product" role="columnheader">Item</span>
            <span className="cart-col-price" role="columnheader">Price</span>
            <span className="cart-col-qty" role="columnheader">Qty</span>
            <span className="cart-col-total" role="columnheader">Subtotal</span>
            <span className="cart-col-remove" role="columnheader" />
          </div>
          {items.map((item) => (
            <CartLine
              key={item.uid || item.id}
              item={item}
              isPending={pendingItems?.has?.(item.id)}
              onUpdateQuantity={updateQuantity}
              onRemove={removeItem}
            />
          ))}
          </div>
          <div className="cart-discount mt-6 pt-5 border-t border-line [&_.co-coupon-form]:gap-2.5 [&_.co-coupon-input]:w-full">
            <CheckoutCoupon cartId={cartId} cartData={cartData} onChanged={refetchCart} />
          </div>
          <Link to="/" className="cart-continue inline-flex items-center gap-2 mt-5 text-sm text-ink-2 no-underline hover:text-ink">
            <ArrowLeftIcon />
            <span>Continue Shopping</span>
          </Link>
        </section>

        <aside className="cart-summary sticky top-6 p-6 border border-line rounded-lg bg-bg" aria-label="Order summary">
          <h3 className="cart-summary-title mb-4 font-sans text-lg font-semibold tracking-[-0.01em] text-ink">Summary</h3>

          <CartShippingEstimate cartId={cartId} cartData={cartData} />

          <dl className="cart-totals mt-[18px]">
            <div className="cart-total-row flex justify-between items-baseline py-1.5 text-base text-ink tabular-nums">
              <dt className="text-ink-2">Subtotal</dt>
              <dd>{fmt(subtotal?.value, subtotal?.currency)}</dd>
            </div>
            {discounts.map((d, i) => (
              <div key={`disc-${i}`} className="cart-total-row flex justify-between items-baseline py-1.5 text-base text-ink tabular-nums">
                <dt className="text-ink-2">{d.label || 'Discount'}</dt>
                <dd className="text-success">−{fmt(Math.abs(d.amount?.value || 0), d.amount?.currency)}</dd>
              </div>
            ))}
            {shipMethod && (
              <div className="cart-total-row flex justify-between items-baseline py-1.5 text-base text-ink tabular-nums">
                <dt className="text-ink-2">Shipping ({shipMethod.method_title || shipMethod.carrier_title})</dt>
                <dd>{fmt(shipMethod.amount?.value, shipMethod.amount?.currency)}</dd>
              </div>
            )}
            {taxTotal > 0 && (
              <div className="cart-total-row flex justify-between items-baseline py-1.5 text-base text-ink tabular-nums">
                <dt className="text-ink-2">Tax</dt>
                <dd>{fmt(taxTotal, taxes[0]?.amount?.currency || ccy)}</dd>
              </div>
            )}
            <div className="cart-total-row flex justify-between items-baseline py-1.5 pt-3.5 mt-2 border-t border-line text-lg font-semibold text-ink tabular-nums">
              <dt>Total</dt>
              <dd>{fmt(grandTotal?.value, ccy)}</dd>
            </div>
          </dl>

          <button type="button" className="btn-primary w-full mt-[18px]" onClick={handleCheckout}>
            Proceed to Checkout
          </button>
          {!shipMethod && <p className="cart-fineprint mt-2.5 text-xs text-ink-2 text-center">Shipping calculated at checkout.</p>}
        </aside>
      </div>
    </div>
  );
}
