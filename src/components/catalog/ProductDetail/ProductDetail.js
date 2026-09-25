import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useCompare } from '../../../context/CompareContext';
import ProductSkeleton from './ProductSkeleton';
import ReviewModal from './ReviewModal';
import ProductGallery from './ProductGallery';
import ProductOptions from './ProductOptions';
import ProductReviews from './ProductReviews';
import useProductDetail from './hooks/useProductDetail';
import { formatMoney } from '../../../lib/money';
import CompareIcon from '../../ui/icons/CompareIcon';

const ProductDetail = ({ urlKey: urlKeyProp }) => {
  const location = useLocation();
  const navigate = useNavigate();
  // Captured once: the edit context is dropped from history below so a reload
  // or a later visit to this page is a plain "add to cart" again.
  const [cartEdit] = useState(() => location.state?.cartEdit || null);
  const pdp = useProductDetail(urlKeyProp, cartEdit);
  const { loading, error, product } = pdp;
  const { isInCompare, toggleCompare } = useCompare();
  const [compareBusy, setCompareBusy] = useState(false);

  const editStateCleared = useRef(false);
  useEffect(() => {
    if (!cartEdit || editStateCleared.current) return;
    editStateCleared.current = true;
    navigate(`${location.pathname}${location.search}`, {
      replace: true,
      state: location.state?.resolved ? { resolved: location.state.resolved } : undefined,
    });
  }, [cartEdit, navigate, location.pathname, location.search]);

  if (loading && !product) return <ProductSkeleton />;
  if (error && !product) return <div>Error: {error.message}</div>;
  if (!product) return <div>Product not found</div>;

  const inCompare = isInCompare(product.id);
  const handleToggleCompare = async () => {
    setCompareBusy(true);
    try {
      await toggleCompare(product.id);
    } catch (err) {
      console.error('Error toggling compare:', err);
    } finally {
      setCompareBusy(false);
    }
  };

  const {
    eyebrowText, price, regularPrice, discount, inStock,
    isConfigurable, configOptions,
    swatchOptions, buttonOptions, selectedOptions, handleOptionChange,
    gallery, mainImg, activeImageIdx, setActiveImageIdx, mainImgLoading, setMainImgLoading,
    quantity, handleQuantityChange, incrementQuantity, decrementQuantity,
    handleAddToCart, canAddToCart, cartLoading, addToCartError,
    isEdit, handleUpdateCart, cartUpdating,
    handleAddToWishlist, wishlistLoading, wishlistMessage,
    reviews, reviewCount, ratingSummary, showReviewModal, setShowReviewModal, handleWriteReviewClick,
    isAuthenticated, guestReviewsAllowed, openLoginModal, refetch,
  } = pdp;

  // In edit mode "Update Cart" replaces the line and returns to the cart.
  const updateCartAndGo = async () => {
    if (await handleUpdateCart()) navigate('/cart');
  };

  return (
    <div className="pdp-page w-full">
      <div className="pdp grid grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] gap-16 pt-6 pb-20 items-start max900:grid-cols-1 max900:pt-3 max900:gap-8">
        <ProductGallery
          gallery={gallery}
          activeImageIdx={activeImageIdx}
          onSelectImage={setActiveImageIdx}
          mainImg={mainImg}
          mainImgLoading={mainImgLoading}
          onMainImgLoad={() => setMainImgLoading(false)}
          productName={product.name}
        />

        <div className="pdp__info max-w-[460px] sticky top-[90px] max900:max-w-full max900:static">
          {eyebrowText && <span className="pdp-eyebrow block text-sm tracking-[0.12em] uppercase text-ink-2 font-medium mb-3">{eyebrowText}</span>}
          <h1 className="pdp-title text-3xl max900:text-2xl font-semibold text-ink tracking-[-0.015em] leading-tight mt-0 mb-3">{product.name}</h1>

          <div className="pdp__price text-[20px] font-medium text-ink mb-7 flex items-baseline gap-3">
            {discount?.amount_off > 0 && <span className="old line-through text-ink-2 font-normal text-[16px]">{formatMoney(regularPrice?.value, regularPrice?.currency)}</span>}
            <span>{formatMoney(price?.value, price?.currency)}</span>
          </div>

          <ProductOptions
            swatchOptions={swatchOptions}
            buttonOptions={buttonOptions}
            selectedOptions={selectedOptions}
            onOptionChange={handleOptionChange}
          />

          {wishlistMessage && (
            <div className={`pdp-flash py-2.5 px-3.5 rounded mb-3.5 text-13 border border-line [&.is-success]:bg-surface [&.is-success]:text-ink [&.is-success]:border-ink [&.is-error]:bg-danger-bg [&.is-error]:text-sale [&.is-error]:border-sale ${wishlistMessage.includes('Failed') ? 'is-error' : 'is-success'}`}>
              {wishlistMessage}
            </div>
          )}

          {isEdit && (
            <div className="pdp-edit-note flex items-center justify-between gap-3 py-2.5 px-3.5 mb-3.5 border border-line rounded bg-surface text-13 text-ink">
              <span>You are editing an item in your cart.</span>
              <Link to="/cart" className="text-ink-2 underline underline-offset-2 whitespace-nowrap hover:text-ink">Cancel</Link>
            </div>
          )}

          <div className="qty-row flex gap-2.5 items-stretch mt-6 mb-3.5">
            <div className="qty inline-flex items-center border border-line rounded overflow-hidden h-12 bg-bg">
              <button type="button" aria-label="Decrease" className="w-10 h-full text-[16px] text-ink cursor-pointer [transition:background-color_120ms_ease] hover:enabled:bg-surface disabled:text-ink-2 disabled:cursor-not-allowed" onClick={decrementQuantity} disabled={quantity <= 1}>−</button>
              <input
                type="number"
                value={quantity}
                min="1"
                max="9999"
                onChange={(e) => handleQuantityChange(e.target.value)}
                className="qty-input w-10 text-center border-none [font-family:inherit] text-base bg-transparent text-ink [appearance:textfield] [-moz-appearance:textfield] leading-[normal] focus:outline-none [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-outer-spin-button]:m-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-inner-spin-button]:m-0"
                aria-label="Quantity"
              />
              <button type="button" aria-label="Increase" className="w-10 h-full text-[16px] text-ink cursor-pointer [transition:background-color_120ms_ease] hover:enabled:bg-surface disabled:text-ink-2 disabled:cursor-not-allowed" onClick={incrementQuantity} disabled={quantity >= 9999}>+</button>
            </div>
            <div className="cta-row pdp-col-fill flex gap-2 flex-1">
              <button
                type="button"
                onClick={isEdit ? updateCartAndGo : handleAddToCart}
                disabled={cartLoading || cartUpdating || !inStock || !canAddToCart()}
                className="pdp-add-btn flex-1 h-12 inline-flex items-center justify-center min-h-[48px] py-3.5 px-[22px] rounded text-base font-medium tracking-[0.02em] cursor-pointer bg-ink text-bg border border-ink [transition:background-color_200ms_ease,color_200ms_ease,border-color_200ms_ease] hover:enabled:bg-black disabled:bg-surface disabled:text-ink-2 disabled:border-line disabled:cursor-not-allowed"
              >
                {cartUpdating ? 'Updating…'
                  : cartLoading ? 'Adding…'
                  : !inStock ? 'Out of stock'
                  : !canAddToCart() ? 'Please select options'
                  : isEdit ? 'Update Cart'
                  : `Add to bag — ${formatMoney(price?.value, price?.currency)}`}
              </button>
              <button
                type="button"
                onClick={handleAddToWishlist}
                disabled={wishlistLoading}
                className="icon-square pdp-wish-btn w-12 h-12 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Add to wishlist"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
              </button>
              <button
                type="button"
                onClick={handleToggleCompare}
                disabled={compareBusy}
                className={`icon-square pdp-compare-btn${inCompare ? ' is-active' : ''} w-12 h-12 [&.is-active]:!bg-ink [&.is-active]:text-bg [&.is-active]:border-ink`}
                aria-label={inCompare ? 'Remove from comparison' : 'Add to compare'}
                title={inCompare ? 'Remove from comparison' : 'Add to compare'}
              >
                <CompareIcon size={18} strokeWidth={1.5} />
              </button>
            </div>
          </div>
          {addToCartError && (
            <div className="pdp-flash py-2.5 px-3.5 rounded mb-3.5 text-13 border border-line [&.is-success]:bg-surface [&.is-success]:text-ink [&.is-success]:border-ink [&.is-error]:bg-danger-bg [&.is-error]:text-sale [&.is-error]:border-sale is-error" role="alert">
              {addToCartError}
            </div>
          )}

          <div className="pdp__meta flex gap-4 mt-[18px] text-sm text-ink-2">
            <span>
              <b className="text-ink font-medium">{inStock ? 'In stock' : 'Out of stock'}</b>
              {inStock && ' — ready to ship'}
              {product.only_x_left_in_stock && inStock && ` (${product.only_x_left_in_stock} left)`}
            </span>
            <span>SKU {product.sku}</span>
          </div>

          {product.description?.html && (
            <div className="pdp__desc mt-9 pt-7 border-t border-line text-md text-ink">
              <h3 className="text-13 tracking-[0.12em] uppercase font-medium text-ink mb-3">The story</h3>
              <div dangerouslySetInnerHTML={{ __html: product.description.html }} />
            </div>
          )}

          <dl className="specs pdp__specs mt-6 grid grid-cols-1 gap-px bg-line rounded overflow-hidden">
            <div className="grid grid-cols-[140px_1fr] py-3 px-3.5 bg-bg text-base"><dt className="text-ink-2 m-0">SKU</dt><dd className="text-ink m-0">{product.sku}</dd></div>
            <div className="grid grid-cols-[140px_1fr] py-3 px-3.5 bg-bg text-base"><dt className="text-ink-2 m-0">Availability</dt><dd className="text-ink m-0">{inStock ? 'In stock' : 'Out of stock'}</dd></div>
            {product.only_x_left_in_stock && (
              <div className="grid grid-cols-[140px_1fr] py-3 px-3.5 bg-bg text-base"><dt className="text-ink-2 m-0">Quantity available</dt><dd className="text-ink m-0">{product.only_x_left_in_stock}</dd></div>
            )}
            {isConfigurable && configOptions.map((option) => (
              <div key={option.id} className="grid grid-cols-[140px_1fr] py-3 px-3.5 bg-bg text-base">
                <dt className="text-ink-2 m-0">{option.label}</dt>
                <dd className="text-ink m-0">{option.values.map((v) => v.label).join(', ')}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      <ProductReviews
        reviews={reviews}
        reviewCount={reviewCount}
        ratingSummary={ratingSummary}
        onWriteReview={handleWriteReviewClick}
      />

      <ReviewModal
        open={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        productSku={product.sku}
        isAuthenticated={isAuthenticated}
        guestReviewsAllowed={guestReviewsAllowed}
        openLoginModal={openLoginModal}
        onSubmitted={refetch}
      />
    </div>
  );
};

export default ProductDetail;
