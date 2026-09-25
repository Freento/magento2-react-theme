import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { useCompare } from '../../context/CompareContext';
import { useAuth } from '../../context/AuthContext';
import { src } from '../../lib/productImage';
import { formatMoney } from '../../lib/money';
import { findMatchingVariant, isSwatchable } from './ProductDetail/helpers/productVariants';
import { selectedOptionUids } from '../../lib/configurableOptions';
import CompareIcon from '../ui/icons/CompareIcon';

const ProductCard = ({ product, onRemove, priority = false }) => {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { isInWishlist, addToWishlist, removeFromWishlist, getWishlistItemId } = useWishlist();
  const { isInCompare, toggleCompare } = useCompare();
  const { isAuthenticated, openLoginModal } = useAuth();
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isTogglingWishlist, setIsTogglingWishlist] = useState(false);
  const [isTogglingCompare, setIsTogglingCompare] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState({});

  const ratingSummary = product.rating_summary || 0;
  const reviewCount = product.review_count || 0;
  const starRating = Math.round(ratingSummary / 20); // Convert 0-100 to 0-5
  const isInStock = product.stock_status === 'IN_STOCK';
  const inWishlist = isInWishlist(product.sku);
  const isConfigurable = product.__typename === 'ConfigurableProduct';
  const pdpHref = `/${product.url_key}${product.url_suffix || ''}`;
  const resolvedState = { resolved: {
    type: 'product',
    id: Number(product.id),
    path: `${product.url_key}${product.url_suffix || ''}`,
  }};

  const configOptions = (isConfigurable && product.configurable_options) || [];
  const hasOptions = configOptions.length > 0 && (product.variants?.length || 0) > 0;
  const allSelected = hasOptions && configOptions.every(
    (option) => selectedOptions[option.attribute_code] !== undefined
  );
  const selectedVariant = allSelected
    ? findMatchingVariant(product.variants, selectedOptions)
    : null;
  const previewVariant = (() => {
    if (!hasOptions) return null;
    if (selectedVariant) return selectedVariant;
    const picked = Object.keys(selectedOptions);
    if (!picked.length) return null;
    return product.variants.find((variant) =>
      variant.attributes
        .filter((attr) => picked.includes(attr.code))
        .every((attr) => Number(attr.value_index) === Number(selectedOptions[attr.code]))
    ) || null;
  })();
  const variantOutOfStock = selectedVariant
    ? selectedVariant.product.stock_status !== 'IN_STOCK'
    : allSelected;
  const displayImage = previewVariant?.product?.small_image?.w450
    ? previewVariant.product.small_image
    : product.small_image;
  const displayPriceObj =
    previewVariant?.product?.price_range?.minimum_price?.final_price
    ?? product.price_range?.minimum_price?.final_price;
  const displayPrice = displayPriceObj?.value;
  const displayCurrency = displayPriceObj?.currency;

  const toggleOption = (attributeCode, valueIndex) => {
    setSelectedOptions((prev) => {
      if (Number(prev[attributeCode]) === Number(valueIndex)) {
        const { [attributeCode]: _removed, ...rest } = prev;
        return rest;
      }
      return { ...prev, [attributeCode]: valueIndex };
    });
  };

  const handleAddToCart = async (e) => {
    e.preventDefault();
    if (!isInStock) return;
    if (isConfigurable && !allSelected) {
      navigate(pdpHref, { state: resolvedState });
      return;
    }
    if (isConfigurable && (!selectedVariant || variantOutOfStock)) return;
    setIsAddingToCart(true);
    try {
      await addToCart(
        product.sku,
        1,
        isConfigurable ? selectedOptionUids(configOptions, selectedOptions) : []
      );
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

  const inCompare = isInCompare(product.id);

  const handleToggleCompare = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsTogglingCompare(true);
    try {
      await toggleCompare(product.id);
    } catch (error) {
      console.error('Error toggling compare:', error);
    } finally {
      setIsTogglingCompare(false);
    }
  };

  const handleRemoveClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!onRemove) return;
    try { await onRemove(product); } catch (err) { console.error(err); }
  };

  return (
    <div className="product-card group relative flex flex-col overflow-visible bg-transparent text-inherit">
      {onRemove ? (
        <button
          type="button"
          className="product-card-remove absolute top-2.5 right-2.5 w-[30px] h-[30px] inline-flex items-center justify-center bg-bg/[0.92] border border-line rounded-pill text-ink cursor-pointer z-[2] transition-colors duration-fast ease-[ease] hover:bg-ink hover:border-ink hover:text-bg focus-visible:outline-none focus-visible:border-ink focus-visible:[box-shadow:0_0_0_1px_var(--ink)]"
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
          className={`wishlist-btn ${inWishlist ? 'in-wishlist' : ''} absolute top-2.5 right-2.5 w-8 h-8 bg-bg/[0.85] rounded-pill flex items-center justify-center text-ink opacity-0 z-[2] [transition:opacity_200ms_ease,background-color_120ms_ease] group-hover:opacity-100 focus-visible:opacity-100 hover:bg-bg [&.in-wishlist]:opacity-100 [&.in-wishlist]:bg-bg [&.in-wishlist]:text-ink [&_svg]:w-4 [&_svg]:h-4`}
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
      {!onRemove && (
        <button
          className={`compare-btn ${inCompare ? 'in-compare' : ''} absolute top-12 right-2.5 w-8 h-8 bg-bg/[0.85] rounded-pill flex items-center justify-center text-ink opacity-0 cursor-pointer z-[2] [transition:opacity_200ms_ease,background-color_120ms_ease] group-hover:opacity-100 focus-visible:opacity-100 hover:bg-bg [&.in-compare]:opacity-100 [&.in-compare]:!bg-ink [&.in-compare]:text-bg`}
          onClick={handleToggleCompare}
          disabled={isTogglingCompare}
          title={inCompare ? 'Remove from comparison' : 'Add to compare'}
          aria-label={inCompare ? 'Remove from comparison' : 'Add to compare'}
        >
          <CompareIcon />
        </button>
      )}
      <Link
        to={pdpHref}
        className="product-card-link flex flex-col flex-1 text-inherit hover:text-inherit"
        data-prefetch="product"
        data-prefetch-key={product.url_key}
        state={resolvedState}
      >
        <img
          src={src(displayImage)}
          alt={product.name}
          className="product-image w-full h-auto aspect-[4/5] object-cover bg-surface rounded mb-3.5 [transition:transform_200ms_ease] group-hover:scale-[1.04]"
          loading={priority ? 'eager' : 'lazy'}
          fetchpriority={priority ? 'high' : undefined}
          decoding="async"
        />
        <div className="product-info">
          <h3 className="product-title text-base font-medium text-ink mb-[2px] tracking-normal leading-[1.35]">{product.name}</h3>

          {reviewCount > 0 && (
            <div className="product-rating hidden">
              <div className="product-stars">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span
                    key={star}
                    className={star <= starRating ? 'star-filled text-ink text-lg' : 'star-empty text-line text-lg'}
                  >
                    ★
                  </span>
                ))}
              </div>
              <span className="review-count">({reviewCount})</span>
            </div>
          )}

          <p className="product-price text-ink font-medium text-base m-0">
            {formatMoney(displayPrice, displayCurrency)}
          </p>
        </div>
      </Link>
      {hasOptions && (
        <div className="card-options flex flex-col gap-2 mt-2.5">
          {configOptions.filter((o) => !isSwatchable(o)).map((option) => (
            <div key={option.id} className="card-sizes flex flex-wrap gap-1.5" role="radiogroup" aria-label={option.label}>
              {option.values.map((v) => (
                <button
                  key={v.value_index}
                  type="button"
                  className="card-size-btn min-w-[34px] h-7 px-2 py-0 border border-line rounded text-xs font-medium bg-bg text-ink cursor-pointer transition-colors duration-fast ease-[ease] hover:border-ink aria-pressed:!bg-ink aria-pressed:!text-bg aria-pressed:!border-ink"
                  aria-pressed={Number(selectedOptions[option.attribute_code]) === Number(v.value_index)}
                  onClick={() => toggleOption(option.attribute_code, v.value_index)}
                >
                  {v.label}
                </button>
              ))}
            </div>
          ))}
          {configOptions.filter(isSwatchable).map((option) => (
            <div key={option.id} className="card-swatches flex flex-wrap gap-2.5" role="radiogroup" aria-label={option.label}>
              {option.values.map((v) => {
                const bg = v.swatch_data?.value && v.swatch_data.value.startsWith('#')
                  ? v.swatch_data.value
                  : (v.label || '').toLowerCase();
                return (
                  <button
                    key={v.value_index}
                    type="button"
                    className="card-swatch w-[26px] h-[26px] rounded-pill border border-ink/[0.12] cursor-pointer p-0 outline outline-2 outline-offset-2 outline-transparent [transition:outline-color_120ms_ease] hover:outline-ink/[0.35] aria-pressed:!outline-ink"
                    aria-pressed={Number(selectedOptions[option.attribute_code]) === Number(v.value_index)}
                    aria-label={v.label}
                    title={v.label}
                    style={{ background: bg }}
                    onClick={() => toggleOption(option.attribute_code, v.value_index)}
                  />
                );
              })}
            </div>
          ))}
        </div>
      )}
      <button
        className="add-to-cart-btn bg-ink text-bg py-3 px-[22px] border border-ink rounded cursor-pointer text-base font-medium tracking-[0.02em] [transition:background-color_200ms_ease,color_200ms_ease] w-full mt-3 hover:enabled:bg-black hover:enabled:text-bg disabled:bg-surface disabled:text-ink-2 disabled:border-line disabled:cursor-not-allowed"
        onClick={handleAddToCart}
        disabled={isAddingToCart || !isInStock || (allSelected && variantOutOfStock)}
      >
        {!isInStock ? 'Out of stock'
          : isConfigurable && !allSelected ? 'Select options'
          : allSelected && variantOutOfStock ? 'Unavailable'
          : isAddingToCart ? 'Adding…'
          : 'Add to Cart'}
      </button>
    </div>
  );
};

export default ProductCard;
