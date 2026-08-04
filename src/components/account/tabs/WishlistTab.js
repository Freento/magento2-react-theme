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
        <div className="ma-skel" aria-busy="true" aria-live="polite">
          <div className="wishlist-toolbar" aria-hidden="true">
            <div className="wishlist-toolbar-meta">
              <span className="skeleton ma-skel-wishlist-count" />
            </div>
            <span className="skeleton ma-skel-wishlist-updated" />
          </div>
          <div className="product-grid">
            {Array.from({ length: skeletonCount }).map((_, i) => (
              <div key={`wsk-${i}`} className="product-card ma-skel-pcard" aria-hidden="true">
                <div className="product-image skeleton" />
                <div className="product-info">
                  <h3 className="product-title"><span className="skeleton ma-skel-pcard-line" style={{ width: '75%' }} /></h3>
                  <p className="product-price"><span className="skeleton ma-skel-pcard-line" style={{ width: '40%' }} /></p>
                </div>
                <div className="skeleton ma-skel-pcard-btn" />
              </div>
            ))}
          </div>
        </div>
      ) : wishlistError ? (
        <div className="error-message">Error loading wishlist: {wishlistError.message}</div>
      ) : wishlistItems.length > 0 ? (
        <>
          <div className="wishlist-toolbar">
            <div className="wishlist-toolbar-meta">
              <span className="wishlist-toolbar-count">
                {totalCount} {totalCount === 1 ? 'item' : 'items'}
                <span className="wishlist-toolbar-count-suffix"> in wishlist</span>
              </span>
            </div>
            {updatedLabel && (
              <div className="wishlist-toolbar-updated">
                <span className="wishlist-toolbar-updated-label">Updated</span>
                <span className="wishlist-toolbar-updated-date">{updatedLabel}</span>
              </div>
            )}
          </div>
          <div className="product-grid">
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
        <div className="wishlist-empty">
          <div className="wishlist-empty-icon" aria-hidden="true">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>
          </div>
          <h4 className="wishlist-empty-title">Nothing saved yet</h4>
          <p className="wishlist-empty-text">
            Tap the heart on any product to keep it here for later.
          </p>
          <Link to="/" className="btn-primary wishlist-empty-cta">Continue shopping</Link>
        </div>
      )}
    </div>
  );
};

export default WishlistTab;
