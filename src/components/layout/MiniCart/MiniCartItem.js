import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { src } from '../../../lib/productImage';
import { MAX_QTY_DIGITS } from '../../../lib/catalog';
import { customOptionLines } from '../../../lib/cartItemOptions';
import { productPrefetchAttrs } from '../../../lib/productLink';

const MC_ITEM_LINKISH =
  'bg-transparent border-0 cursor-pointer p-0 text-xs tracking-[0.04em] text-ink-2 underline underline-offset-2 hover:text-ink';

const MiniCartItem = ({ item, isPending, onUpdateQuantity, onRemove, onNavigate, formatMoney }) => {
  const [qtyDraft, setQtyDraft] = useState(String(item.quantity));

  useEffect(() => {
    if (!isPending) setQtyDraft(String(item.quantity));
  }, [isPending, item.quantity]);

  const commitQty = () => {
    const parsed = parseInt(qtyDraft, 10);
    if (!Number.isFinite(parsed) || parsed < 1) {
      setQtyDraft(String(item.quantity));
      return;
    }
    setQtyDraft(String(parsed));
    if (parsed !== item.quantity) onUpdateQuantity(item.id, parsed);
  };

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

  return (
    <li className={`mc-item relative flex gap-3.5 py-[18px] border-b border-line last:border-b-0 [&.is-pending>*:not(.mc-item-spinner)]:opacity-45 [&.is-pending>*:not(.mc-item-spinner)]:pointer-events-none [&.is-pending>*:not(.mc-item-spinner)]:transition-opacity${isPending ? ' is-pending' : ''}`}>
      <Link
        to={href}
        state={linkState}
        onClick={onNavigate}
        {...prefetch}
        className="mc-item-img block shrink-0 w-[72px] h-[88px] rounded overflow-hidden bg-surface leading-[0]"
        aria-label={`Open ${item.product.name}`}
      >
        <img
          className="w-full h-full object-contain p-1.5"
          src={src(item.configured_variant?.thumbnail || item.product.thumbnail)}
          alt={item.product.name}
        />
      </Link>

      <div className="mc-item-main flex-1 min-w-0 flex flex-col gap-1">
        <Link to={href} state={linkState} onClick={onNavigate} {...prefetch} className="mc-item-name text-base font-medium text-ink leading-snug no-underline hover:text-ink-2">
          {item.product.name}
        </Link>
        <div className="mc-item-sku text-xs tracking-[0.08em] uppercase text-ink-2">SKU {item.configured_variant?.sku || item.product.sku}</div>
        {(item.configurable_options || []).map((opt) => (
          <div key={opt.option_label} className="mc-item-option mt-[2px] text-2xs text-ink-2">
            {opt.option_label}: {opt.value_label}
          </div>
        ))}
        {customOptionLines(item).map((opt) => (
          <div key={opt.uid} className="mc-item-option mt-[2px] text-2xs text-ink-2 break-words">
            {opt.label}: {opt.value}
          </div>
        ))}

        <div className="mc-item-row flex justify-between items-center gap-3 mt-1.5">
          <div className="mc-qty inline-flex items-center border border-line rounded overflow-hidden h-7" role="group" aria-label="Quantity">
            <button
              type="button"
              className="w-7 h-full bg-transparent border-0 cursor-pointer text-base text-ink transition-colors duration-fast ease-[ease] enabled:hover:bg-surface disabled:text-ink-2 disabled:cursor-not-allowed"
              onClick={() => onUpdateQuantity(item.id, Math.max(1, item.quantity - 1))}
              aria-label="Decrease"
              disabled={item.quantity <= 1 || isPending}
            >−</button>
            <input
              type="number"
              name={`qty-${item.id}`}
              autoComplete="off"
              inputMode="numeric"
              className="w-11 h-full border-0 p-0 text-center font-sans text-13 leading-base text-ink bg-transparent [appearance:textfield] [-moz-appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-outer-spin-button]:m-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-inner-spin-button]:m-0 focus:outline-none focus:bg-surface disabled:text-ink-2"
              value={qtyDraft}
              min="1"
              disabled={isPending}
              onChange={(e) => { if (e.target.value.length <= MAX_QTY_DIGITS) setQtyDraft(e.target.value); }}
              onBlur={commitQty}
              onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
              aria-label="Quantity"
            />
            <button
              type="button"
              className="w-7 h-full bg-transparent border-0 cursor-pointer text-base text-ink transition-colors duration-fast ease-[ease] enabled:hover:bg-surface disabled:text-ink-2 disabled:cursor-not-allowed"
              onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
              aria-label="Increase"
              disabled={isPending}
            >+</button>
          </div>

          <div className="mc-item-meta flex flex-col items-end gap-[2px]">
            <span className="mc-item-price text-base font-medium text-ink">{formatMoney(item.prices?.price?.value)}</span>
            <div className="mc-item-actions flex items-center gap-2.5">
              <Link
                to={href}
                state={editState}
                onClick={onNavigate}
                {...prefetch}
                className={`mc-edit ${MC_ITEM_LINKISH}`}
                aria-label={`Edit ${item.product.name}`}
              >
                Edit
              </Link>
              <button
                type="button"
                className={`mc-remove ${MC_ITEM_LINKISH}`}
                onClick={() => onRemove(item.id)}
                disabled={isPending}
              >
                Remove
              </button>
            </div>
          </div>
        </div>

        {item.prices?.total_item_discount?.value > 0 && (
          <div className="mc-item-discount mt-1 text-xs text-ink-2 font-serif italic">
            −{formatMoney(item.prices.total_item_discount.value)} discount
          </div>
        )}
      </div>

      {isPending && (
        <div className="mc-item-spinner absolute inset-0 flex items-center justify-center pointer-events-none" aria-live="polite" aria-busy="true">
          <span className="mc-spinner w-[18px] h-[18px] border-2 border-line border-t-ink rounded-full animate-[spin_0.8s_linear_infinite]" aria-hidden="true" />
        </div>
      )}
    </li>
  );
};

export default MiniCartItem;
