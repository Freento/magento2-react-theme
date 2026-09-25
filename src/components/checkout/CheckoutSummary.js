import React from 'react';
import { src, has } from '../../lib/productImage';
import { formatAddressLines } from '../../lib/addressLines';
import PencilIcon from '../ui/icons/PencilIcon';


const fmt = (val, ccy) => {
  if (val == null) return '—';
  const n = Number(val);
  const code = (ccy || '').toUpperCase();
  return code === 'USD' ? `$${n.toFixed(2)}` : `${n.toFixed(2)} ${code}`.trim();
};

export default function CheckoutSummary({ cartData, showShippingInfo = false, onEditShippingAddress, onEditShippingMethod }) {
  if (!cartData) return null;
  const items = cartData.items || [];
  const prices = cartData.prices || {};
  const subtotal = prices.subtotal_excluding_tax || prices.subtotal_including_tax;
  const taxes = prices.applied_taxes || [];
  const discounts = prices.discounts || [];
  const grandTotal = prices.grand_total;
  const shipTo = cartData.shipping_addresses?.[0] || null;
  const ship = shipTo?.selected_shipping_method || null;
  const ccy = grandTotal?.currency;
  const shipToLines = formatAddressLines(shipTo);

  const rowCls = 'co-summary-row flex justify-between items-baseline text-base text-ink tabular-nums';
  const dtCls = 'font-normal text-ink-2';
  const ddCls = 'font-medium';
  const infoHeadCls = 'co-summary-info-head flex items-center justify-between gap-3 mb-2';
  const infoTitleCls = 'co-summary-info-title font-sans text-base font-semibold tracking-[-0.01em] text-ink';
  const infoEditCls = 'co-summary-info-edit w-7 h-7 inline-flex items-center justify-center bg-transparent border border-line rounded-pill text-ink-2 cursor-pointer [transition:color_120ms_ease,border-color_120ms_ease] hover:text-ink hover:border-ink';
  const infoBodyCls = 'co-summary-info-body flex flex-col gap-0.5 not-italic text-sm leading-relaxed text-ink-2';

  return (
    <aside className="co-summary sticky max900:static top-6 bg-bg border border-line rounded pt-[22px] px-[22px] pb-[18px] flex flex-col gap-4 max900:max-w-full" aria-label="Order summary">
      <h3 className="co-summary-title font-sans text-lg font-semibold tracking-[-0.01em] text-ink">Order Summary</h3>

      <ul className="co-summary-items list-none flex flex-col gap-3.5 max-h-[360px] overflow-y-auto pr-1">
        {items.map((item) => {
          const p = item.product || {};
          const img = has(p.thumbnail) ? src(p.thumbnail) : null;
          const linePrice = item.prices?.row_total?.value ?? (item.prices?.price?.value || 0) * (item.quantity || 1);
          return (
            <li key={item.id} className="co-summary-item flex items-start gap-3">
              <div className="co-summary-thumb relative w-14 h-14 shrink-0 rounded bg-surface overflow-hidden">
                {img && <img className="w-full h-full object-contain p-1" src={img} alt={p.name || ''} loading="lazy" />}
              </div>
              <div className="co-summary-item-main flex-1 min-w-0">
                <div className="co-summary-item-name text-base font-medium text-ink leading-[1.35] line-clamp-2">{p.name}</div>
                {item.quantity > 1 && (
                  <div className="co-summary-item-meta mt-1 text-sm text-ink-2">Qty {item.quantity}</div>
                )}
              </div>
              <div className="co-summary-item-price text-base font-semibold tabular-nums whitespace-nowrap text-ink">{fmt(linePrice, item.prices?.price?.currency || ccy)}</div>
            </li>
          );
        })}
      </ul>

      <dl className="co-summary-totals pt-3.5 border-t border-line flex flex-col gap-2">
        {subtotal && (
          <div className={rowCls}>
            <dt className={dtCls}>Subtotal</dt>
            <dd className={ddCls}>{fmt(subtotal.value, subtotal.currency)}</dd>
          </div>
        )}
        {ship ? (
          <div className={rowCls}>
            <dt className={dtCls}>Shipping <span className="co-summary-row-sub text-xs text-ink-2 ml-0.5">({ship.carrier_title || ship.method_title})</span></dt>
            <dd className={ddCls}>{fmt(ship.amount?.value, ship.amount?.currency)}</dd>
          </div>
        ) : (
          <div className={rowCls}>
            <dt className={dtCls}>Shipping</dt>
            <dd className="text-ink-2 italic font-normal">Calculated next</dd>
          </div>
        )}
        {taxes.length > 0 && (
          <div className={rowCls}>
            <dt className={dtCls}>Tax</dt>
            <dd className={ddCls}>{fmt(taxes.reduce((sum, t) => sum + (t.amount?.value || 0), 0), taxes[0]?.amount?.currency || ccy)}</dd>
          </div>
        )}
        {discounts.map((d, i) => (
          <div key={`disc-${i}`} className={rowCls}>
            <dt className={dtCls}>{d.label || 'Discount'}</dt>
            <dd className="font-medium text-accent">−{fmt(Math.abs(d.amount?.value || 0), d.amount?.currency)}</dd>
          </div>
        ))}
        <div className="co-summary-row flex justify-between items-baseline tabular-nums pt-3 mt-1 border-t border-line text-xl">
          <dt className="text-ink font-semibold tracking-[-0.01em]">Total</dt>
          <dd className="font-semibold tracking-[-0.01em]">{fmt(grandTotal?.value, ccy)}</dd>
        </div>
      </dl>

      {showShippingInfo && shipToLines.length > 0 && (
        <div className="co-summary-info pt-4 border-t border-line flex flex-col gap-4">
          <div className="co-summary-info-block">
            <div className={infoHeadCls}>
              <h4 className={infoTitleCls}>Ship To</h4>
              <button type="button" className={infoEditCls} onClick={onEditShippingAddress} aria-label="Edit shipping address">
                <PencilIcon />
              </button>
            </div>
            <address className={infoBodyCls}>
              {shipToLines.map((line) => <span key={line}>{line}</span>)}
            </address>
          </div>
          {ship && (
            <div className="co-summary-info-block">
              <div className={infoHeadCls}>
                <h4 className={infoTitleCls}>Shipping Method</h4>
                <button type="button" className={infoEditCls} onClick={onEditShippingMethod} aria-label="Edit shipping method">
                  <PencilIcon />
                </button>
              </div>
              <div className={infoBodyCls}>
                <span>{[ship.carrier_title, ship.method_title].filter(Boolean).join(' - ')}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </aside>
  );
}
