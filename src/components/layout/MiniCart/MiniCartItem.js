import React from 'react';
import { Link } from 'react-router-dom';
import { src } from '../../../lib/productImage';

const MiniCartItem = ({ item, isPending, onUpdateQuantity, onRemove, onNavigate, formatMoney }) => {
  const href = `/${item.product.url_key}${item.product.url_suffix || ''}`;
  const linkState = item.product?.id ? { resolved: {
    type: 'product',
    id: Number(item.product.id),
    path: `${item.product.url_key}${item.product.url_suffix || ''}`,
  } } : undefined;

  return (
    <li className={`mc-item${isPending ? ' is-pending' : ''}`}>
      <Link
        to={href}
        state={linkState}
        onClick={onNavigate}
        className="mc-item-img"
        aria-label={`Open ${item.product.name}`}
      >
        <img
          src={src(item.product.thumbnail)}
          alt={item.product.name}
        />
      </Link>

      <div className="mc-item-main">
        <Link to={href} state={linkState} onClick={onNavigate} className="mc-item-name">
          {item.product.name}
        </Link>
        <div className="mc-item-sku">SKU {item.product.sku}</div>

        <div className="mc-item-row">
          <div className="mc-qty" role="group" aria-label="Quantity">
            <button
              type="button"
              onClick={() => onUpdateQuantity(item.id, Math.max(1, item.quantity - 1))}
              aria-label="Decrease"
              disabled={item.quantity <= 1 || isPending}
            >−</button>
            <span>{item.quantity}</span>
            <button
              type="button"
              onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
              aria-label="Increase"
              disabled={isPending}
            >+</button>
          </div>

          <div className="mc-item-meta">
            <span className="mc-item-price">{formatMoney(item.prices?.price?.value)}</span>
            <button
              type="button"
              className="mc-remove"
              onClick={() => onRemove(item.id)}
              disabled={isPending}
            >
              Remove
            </button>
          </div>
        </div>

        {item.prices?.total_item_discount?.value > 0 && (
          <div className="mc-item-discount">
            −{formatMoney(item.prices.total_item_discount.value)} discount
          </div>
        )}
      </div>

      {isPending && (
        <div className="mc-item-spinner" aria-live="polite" aria-busy="true">
          <span className="mc-spinner" aria-hidden="true" />
        </div>
      )}
    </li>
  );
};

export default MiniCartItem;
