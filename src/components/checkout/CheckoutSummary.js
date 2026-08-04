import React from 'react';
import { src, has } from '../../lib/productImage';


const fmt = (val, ccy) => {
  if (val == null) return '—';
  const n = Number(val);
  const code = (ccy || '').toUpperCase();
  return code === 'USD' ? `$${n.toFixed(2)}` : `${n.toFixed(2)} ${code}`.trim();
};

export default function CheckoutSummary({ cartData }) {
  if (!cartData) return null;
  const items = cartData.items || [];
  const prices = cartData.prices || {};
  const subtotal = prices.subtotal_excluding_tax || prices.subtotal_including_tax;
  const taxes = prices.applied_taxes || [];
  const discounts = prices.discounts || [];
  const grandTotal = prices.grand_total;
  const ship = cartData.shipping_addresses?.[0]?.selected_shipping_method || null;
  const ccy = grandTotal?.currency;

  return (
    <aside className="co-summary" aria-label="Order summary">
      <h3 className="co-summary-title">Order Summary</h3>

      <ul className="co-summary-items">
        {items.map((item) => {
          const p = item.product || {};
          const img = has(p.thumbnail) ? src(p.thumbnail) : null;
          const linePrice = (item.prices?.price?.value || 0) * (item.quantity || 1);
          return (
            <li key={item.id} className="co-summary-item">
              <div className="co-summary-thumb">
                {img && <img src={img} alt={p.name || ''} loading="lazy" />}
              </div>
              <div className="co-summary-item-main">
                <div className="co-summary-item-name">{p.name}</div>
                {item.quantity > 1 && (
                  <div className="co-summary-item-meta">Qty {item.quantity}</div>
                )}
              </div>
              <div className="co-summary-item-price">{fmt(linePrice, item.prices?.price?.currency || ccy)}</div>
            </li>
          );
        })}
      </ul>

      <dl className="co-summary-totals">
        {subtotal && (
          <div className="co-summary-row">
            <dt>Subtotal</dt>
            <dd>{fmt(subtotal.value, subtotal.currency)}</dd>
          </div>
        )}
        {ship ? (
          <div className="co-summary-row">
            <dt>Shipping <span className="co-summary-row-sub">({ship.carrier_title || ship.method_title})</span></dt>
            <dd>{fmt(ship.amount?.value, ship.amount?.currency)}</dd>
          </div>
        ) : (
          <div className="co-summary-row co-summary-row--muted">
            <dt>Shipping</dt>
            <dd>Calculated next</dd>
          </div>
        )}
        {taxes.map((t, i) => (
          <div key={`tax-${i}`} className="co-summary-row">
            <dt>{t.label || 'Tax'}</dt>
            <dd>{fmt(t.amount?.value, t.amount?.currency)}</dd>
          </div>
        ))}
        {discounts.map((d, i) => (
          <div key={`disc-${i}`} className="co-summary-row co-summary-row--discount">
            <dt>{d.label || 'Discount'}</dt>
            <dd>−{fmt(Math.abs(d.amount?.value || 0), d.amount?.currency)}</dd>
          </div>
        ))}
        {(cartData.applied_gift_cards || []).map((gc, i) => (
          <div key={`gc-${i}`} className="co-summary-row co-summary-row--discount">
            <dt>Gift card ({gc.code})</dt>
            <dd>−{fmt(Math.abs(gc.applied_balance?.value || 0), gc.applied_balance?.currency)}</dd>
          </div>
        ))}
        <div className="co-summary-row co-summary-row--total">
          <dt>Total</dt>
          <dd>{fmt(grandTotal?.value, ccy)}</dd>
        </div>
      </dl>
    </aside>
  );
}
