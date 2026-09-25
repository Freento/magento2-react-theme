import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCompare } from '../../context/CompareContext';
import { productHref, productResolvedState } from '../../lib/productLink';
import { useCart } from '../../context/CartContext';
import { src } from '../../lib/productImage';
import PrintIcon from '../ui/icons/PrintIcon';
import CloseIcon from '../ui/icons/CloseIcon';

const fmt = (price) => {
  if (price?.value == null) return '—';
  const ccy = (price.currency || '').toUpperCase();
  return ccy === 'USD' ? `$${Number(price.value).toFixed(2)}` : `${Number(price.value).toFixed(2)} ${ccy}`.trim();
};

const ComparePage = () => {
  const navigate = useNavigate();
  const { compareItems, compareList, loading, removeFromCompare, notice } = useCompare();
  const { addToCart } = useCart();
  const [busySku, setBusySku] = useState(null);

  const hasValue = (v) => !!(v && v.trim() && v.trim().toUpperCase() !== 'N/A');
  const attributes = (compareList?.attributes || []).filter((attr) =>
    compareItems.some((item) => hasValue(item.attributes?.find((a) => a.code === attr.code)?.value))
  );

  const handleAddToCart = async (product) => {
    setBusySku(product.sku);
    try {
      await addToCart(product.sku, 1);
    } finally {
      setBusySku(null);
    }
  };

  if (!loading && compareItems.length === 0) {
    return (
      <div className="compare-page py-10 max768:pt-4">
        <h1 className="page-title text-hero text-ink mb-1.5 tracking-[-0.02em] max768:text-2xl max768:leading-[1.2]">Compare Products</h1>
        <div className="empty-state">
          <p>You have no items to compare.</p>
          <Link to="/" className="btn-primary">Continue Shopping</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="compare-page py-10 max768:pt-4">
      <div className="compare-page-head mb-6 flex items-center justify-between gap-4">
        <h1 className="page-title text-hero text-ink mb-0 tracking-[-0.02em] max768:text-2xl max768:leading-[1.2]">Compare Products</h1>
        <button type="button" className="compare-print inline-flex items-center gap-2 h-10 px-4 py-0 bg-bg text-ink border border-line rounded text-13 font-medium tracking-[0.02em] cursor-pointer [transition:border-color_120ms_ease] shrink-0 hover:border-ink print:!hidden" onClick={() => window.print()}>
          <PrintIcon />
          <span>Print This Page</span>
        </button>
      </div>
      <div className="compare-table-scroll overflow-x-auto print:!overflow-visible">
        <table className="compare-table w-full border-collapse text-sm">
          <thead>
            <tr>
              <th className="compare-attr-col py-3.5 px-4 border-b border-line text-left align-bottom min-w-[180px]" aria-label="Attribute" />
              {compareItems.map(({ product }) => (
                <th key={product.id} className="compare-product-col relative py-3.5 px-4 border-b border-line text-left align-bottom min-w-[180px]">
                  <button
                    type="button"
                    className="compare-remove absolute top-2 right-2 w-[26px] h-[26px] inline-flex items-center justify-center bg-bg border border-line rounded-pill text-ink cursor-pointer transition-colors duration-fast ease-[ease] hover:bg-ink hover:border-ink hover:text-bg print:!hidden"
                    onClick={() => removeFromCompare(product.id)}
                    aria-label={`Remove ${product.name} from comparison`}
                  >
                    <CloseIcon />
                  </button>
                  <Link to={productHref(product)} state={productResolvedState(product)} className="compare-product-link block text-inherit hover:text-inherit">
                    <img src={src(product.small_image)} alt={product.name} loading="lazy" className="w-[120px] h-[150px] object-cover rounded bg-surface mb-2.5" />
                    <span className="compare-product-name block text-base font-medium text-ink">{product.name}</span>
                  </Link>
                  <div className="compare-product-price mt-1.5 mb-2.5 font-medium">{fmt(product.price_range?.minimum_price?.final_price)}</div>
                  {product.stock_status !== 'IN_STOCK' ? (
                    <button type="button" className="btn-secondary compare-cart-btn inline-flex items-center justify-center w-auto m-0 py-[9px] px-4 text-13 no-underline print:!hidden" disabled>Out of stock</button>
                  ) : product.__typename === 'ConfigurableProduct' ? (
                    <button
                      type="button"
                      className="btn-primary compare-cart-btn inline-flex items-center justify-center w-auto m-0 py-[9px] px-4 text-13 no-underline print:!hidden"
                      onClick={() => {
                        notice('You need to choose options for your item.');
                        navigate(productHref(product), { state: productResolvedState(product) });
                      }}
                    >
                      Add to Cart
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="btn-primary compare-cart-btn inline-flex items-center justify-center w-auto m-0 py-[9px] px-4 text-13 no-underline print:!hidden"
                      onClick={() => handleAddToCart(product)}
                      disabled={busySku === product.sku}
                    >
                      {busySku === product.sku ? 'Adding…' : 'Add to Cart'}
                    </button>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {attributes.map((attr) => (
              <tr key={attr.code}>
                <th scope="row" className="compare-attr-label py-3.5 px-4 border-b border-line text-left align-top min-w-[180px] font-semibold text-ink whitespace-nowrap">{attr.label}</th>
                {compareItems.map((item) => {
                  const value = item.attributes?.find((a) => a.code === attr.code)?.value;
                  return (
                    <td key={`${item.uid}-${attr.code}`} className="compare-attr-value py-3.5 px-4 border-b border-line text-left align-top min-w-[180px] text-ink-2">
                      {value
                        ? <span dangerouslySetInnerHTML={{ __html: value }} />
                        : '—'}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ComparePage;
