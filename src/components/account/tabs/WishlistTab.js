import React from 'react';
import { Link } from 'react-router-dom';
import ProductCard from '../../catalog/ProductCard';
import Pagination from '../../ui/Pagination';

const WishlistTab = ({
  wishlistData,
  wishlistLoading,
  wishlistError,
  wishlistPage,
  onPageChange,
  onRemoveItem,
}) => {
  const wishlist = wishlistData?.customer?.wishlists?.[0];
  const wishlistItems = wishlist?.items_v2?.items || [];
  const pageInfo = wishlist?.items_v2?.page_info;
  const totalCount = wishlist?.items_count ?? wishlistItems.length;
  const skeletonCount = wishlistData ? Math.max(wishlistItems.length, 1) : 4;
  const updatedAt = wishlist?.updated_at
    ? new Date(wishlist.updated_at.replace(' ', 'T'))
    : null;
  const updatedLabel =
    updatedAt && !Number.isNaN(updatedAt.getTime())
      ? updatedAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      : null;

  return (
    <div className="account-section">
      {wishlistLoading ? (
        <div className="pointer-events-none" aria-busy="true" aria-live="polite">
          <div className="flex items-center gap-4 flex-wrap px-5 py-4 bg-bg border border-line rounded mb-4 max480:px-4 max480:py-3.5" aria-hidden="true">
            <div className="inline-flex items-baseline gap-2.5 min-w-0">
              <span className="skeleton w-40 h-[22px]" />
            </div>
            <span className="skeleton w-[140px] h-3.5 ml-auto" />
          </div>
          <div className="product-grid grid grid-cols-4 max900:grid-cols-2 gap-y-[clamp(16px,2vw,32px)] gap-x-[clamp(12px,1.6vw,24px)] mt-[clamp(20px,3vw,32px)]">
            {Array.from({ length: skeletonCount }).map((_, i) => (
              <div key={`wsk-${i}`} className="product-card relative flex flex-col" aria-hidden="true">
                <div className="product-image skeleton w-full aspect-[4/5] rounded mb-3.5" />
                <div className="product-info">
                  <h3 className="product-title text-base font-medium text-ink mb-[2px] tracking-normal leading-[1.35]"><span className="skeleton inline-block h-[1em]" style={{ width: '75%' }} /></h3>
                  <p className="product-price text-ink font-medium text-base m-0"><span className="skeleton inline-block h-[1em]" style={{ width: '40%' }} /></p>
                </div>
                <div className="skeleton w-full h-[calc(var(--fs-base)*1.35+24px)] mt-3" />
              </div>
            ))}
          </div>
        </div>
      ) : wishlistError ? (
        <div className="bg-danger-bg border border-danger-border text-danger px-3.5 py-3 rounded mb-4 text-13 leading-[1.45]">Error loading wishlist: {wishlistError.message}</div>
      ) : wishlistItems.length > 0 ? (
        <>
          <div className="flex items-center gap-4 flex-wrap px-5 py-4 bg-bg border border-line rounded mb-4 max480:px-4 max480:py-3.5">
            <div className="inline-flex items-baseline gap-2.5 min-w-0">
              <span className="text-lg font-semibold tracking-[-0.01em] tabular-nums text-ink">
                {totalCount} {totalCount === 1 ? 'item' : 'items'}
                <span className="text-sm font-normal text-ink-2 tracking-normal ml-1"> in wishlist</span>
              </span>
            </div>
            {updatedLabel && (
              <div className="inline-flex items-baseline gap-2 ml-auto shrink-0 max480:ml-0 max480:w-full max480:justify-start">
                <span className="text-2xs uppercase tracking-[0.08em] font-semibold text-ink-2">Updated</span>
                <span className="text-sm font-medium text-ink tabular-nums whitespace-nowrap">{updatedLabel}</span>
              </div>
            )}
          </div>
          <div className="product-grid grid grid-cols-4 max900:grid-cols-2 gap-y-[clamp(16px,2vw,32px)] gap-x-[clamp(12px,1.6vw,24px)] mt-[clamp(20px,3vw,32px)]">
            {wishlistItems.map((item) => (
              <ProductCard
                key={item.id}
                product={item.product}
                onRemove={(product) => {
                  const it = wishlistItems.find((i) => i.product?.sku === product.sku);
                  if (it) onRemoveItem(wishlist.id, it.id);
                }}
              />
            ))}
          </div>
          <Pagination
            currentPage={pageInfo?.current_page || wishlistPage}
            totalPages={pageInfo?.total_pages || 1}
            onPageChange={onPageChange}
          />
        </>
      ) : (
        <div className="max-w-[460px] mt-10 mx-auto mb-0 px-8 py-12 bg-bg border border-line rounded text-center">
          <div className="inline-flex items-center justify-center w-[72px] h-[72px] mt-0 mx-auto mb-[18px] rounded-pill bg-surface text-ink-2" aria-hidden="true">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>
          </div>
          <h4 className="mt-0 mb-2 text-lg font-semibold tracking-[-0.01em] text-ink">Nothing saved yet</h4>
          <p className="mx-auto mt-0 mb-[22px] max-w-[320px] text-sm leading-relaxed text-ink-2">
            Tap the heart on any product to keep it here for later.
          </p>
          <Link to="/" className="btn-primary w-auto m-0 inline-flex min-w-[200px] h-10 px-[22px] items-center justify-center">Continue shopping</Link>
        </div>
      )}
    </div>
  );
};

export default WishlistTab;
