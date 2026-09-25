import React from 'react';
import { Link } from 'react-router-dom';
import { useCompare } from '../../context/CompareContext';
import { productHref, productResolvedState } from '../../lib/productLink';
import CloseIcon from '../ui/icons/CloseIcon';

const CompareSidebarBlock = () => {
  const { compareItems, compareCount, removeFromCompare, clearCompare } = useCompare();

  if (!compareCount) {
    return (
      <div className="mt-7 pt-5 pl-4 border-t border-line">
        <div className="flex items-baseline gap-2">
          <h4 className="m-0 text-2xs font-semibold tracking-eyebrow uppercase text-ink">Compare Products</h4>
        </div>
        <p className="mt-2.5 mb-0 text-sm text-ink-2">You have no items to compare.</p>
      </div>
    );
  }

  return (
    <div className="mt-7 pt-5 pl-4 border-t border-line">
      <div className="flex items-baseline gap-2">
        <h4 className="m-0 text-2xs font-semibold tracking-eyebrow uppercase text-ink">Compare Products</h4>
        <span className="text-2xs font-semibold text-ink-2">{compareCount}</span>
      </div>
      <ul className="list-none mt-2.5 mb-0 p-0">
        {compareItems.map(({ product }) => (
          <li key={product.id} className="group flex items-start justify-between gap-2.5 py-[7px]">
            <Link
              to={productHref(product)}
              state={productResolvedState(product)}
              data-prefetch="product"
              data-prefetch-key={product.url_key}
              className="text-base leading-[1.4] text-ink-2 min-w-0 transition-colors duration-fast ease-[ease] hover:text-ink"
            >
              {product.name}
            </Link>
            <button
              type="button"
              className="shrink-0 inline-flex items-center justify-center w-5 h-5 mt-px bg-transparent border-0 rounded-pill text-ink-2 opacity-0 cursor-pointer [transition:color_120ms_ease,opacity_120ms_ease] focus-visible:opacity-100 hover:text-ink group-hover:opacity-100"
              onClick={() => removeFromCompare(product.id)}
              aria-label={`Remove ${product.name}`}
              title="Remove This Item"
            >
              <CloseIcon />
            </button>
          </li>
        ))}
      </ul>
      <div className="flex items-center gap-3.5 mt-3.5">
        <Link to="/compare" className="inline-flex items-center justify-center h-9 px-[18px] bg-ink text-bg border border-ink rounded text-13 font-medium tracking-[0.02em] transition-colors duration-fast ease-[ease] hover:bg-black hover:text-bg">Compare</Link>
        <button type="button" className="bg-transparent border-0 p-0 text-sm text-ink-2 underline underline-offset-2 cursor-pointer transition-colors duration-fast ease-[ease] hover:text-ink" onClick={clearCompare}>
          Clear All
        </button>
      </div>
    </div>
  );
};

export default CompareSidebarBlock;
