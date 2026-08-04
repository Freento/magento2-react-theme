import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { useAuth } from '../../context/AuthContext';
import { src } from '../../lib/productImage';
import '../../styles/catalog/ProductCard.less';

const ProductCard = ({ product, onRemove, priority = false }) => {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { isInWishlist, addToWishlist, removeFromWishlist, getWishlistItemId } = useWishlist();
  const { isAuthenticated, openLoginModal } = useAuth();
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isTogglingWishlist, setIsTogglingWishlist] = useState(false);

  const ratingSummary = product.rating_summary || 0;
  const reviewCount = product.review_count || 0;
  const starRating = Math.round(ratingSummary / 20); // Convert 0-100 to 0-5
  const isInStock = product.stock_status === 'IN_STOCK';
  const inWishlist = isInWishlist(product.sku);
  const isConfigurable = product.__typename === 'ConfigurableProduct';
  const pdpHref = `/${product.url_key}${product.url_suffix || ''}`;

  const handleAddToCart = async (e) => {
    e.preventDefault();
    if (!isInStock) return;
    if (isConfigurable) {
      navigate(pdpHref);
      return;
    }
    setIsAddingToCart(true);
    try {
      await addToCart(product.sku, 1);
      if (inWishlist) {
        const wishlistItemId = getWishlistItemId(product.sku);
        if (wishlistItemId) {
          try { await removeFromWishlist(wishlistItemId); } catch (err) { console.error(err); }
        }
      }
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleToggleWishlist = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      openLoginModal();
      return;
    }

    setIsTogglingWishlist(true);
    try {
      if (inWishlist) {
        const wishlistItemId = getWishlistItemId(product.sku);
        if (wishlistItemId) {
          await removeFromWishlist(wishlistItemId);
        }
      } else {
        await addToWishlist(product.sku, 1);
      }
    } catch (error) {
      console.error('Error toggling wishlist:', error);
    } finally {
      setIsTogglingWishlist(false);
    }
  };

  const handleRemoveClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!onRemove) return;
    try { await onRemove(product); } catch (err) { console.error(err); }
  };

  return (
    <div className="product-card">
      {onRemove ? (
        <button
          type="button"
          className="product-card-remove"
          onClick={handleRemoveClick}
          aria-label="Remove from wishlist"
          title="Remove from wishlist"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      ) : (
        <button
          className={`wishlist-btn ${inWishlist ? 'in-wishlist' : ''}`}
          onClick={handleToggleWishlist}
          disabled={isTogglingWishlist}
          title={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill={inWishlist ? 'currentColor' : 'none'}
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
          </svg>
        </button>
      )}
      <Link
        to={`/${product.url_key}${product.url_suffix || ''}`}
        className="product-card-link"
        data-prefetch="product"
        data-prefetch-key={product.url_key}
        state={{ resolved: {
          type: 'product',
          id: Number(product.id),
          path: `${product.url_key}${product.url_suffix || ''}`,
        }}}
      >
        <img
          src={src(product.small_image)}
          alt={product.name}
          className="product-image"
          loading={priority ? 'eager' : 'lazy'}
          fetchpriority={priority ? 'high' : undefined}
          decoding="async"
        />
        <div className="product-info">
          <h3 className="product-title">{product.name}</h3>

          {reviewCount > 0 && (
            <div className="product-rating">
              <div className="product-stars">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span
                    key={star}
                    className={star <= starRating ? 'star-filled' : 'star-empty'}
                  >
                    ★
                  </span>
                ))}
              </div>
              <span className="review-count">({reviewCount})</span>
            </div>
          )}

          <p className="product-price">
            ${product.price_range?.minimum_price?.final_price?.value || 'N/A'}
          </p>
        </div>
      </Link>
      <button
        className="add-to-cart-btn"
        onClick={handleAddToCart}
        disabled={isAddingToCart || !isInStock}
      >
        {!isInStock ? 'Out of stock'
          : isConfigurable ? 'Select options'
          : isAddingToCart ? 'Adding…'
          : 'Add to Cart'}
      </button>
    </div>
  );
};

export default ProductCard;
