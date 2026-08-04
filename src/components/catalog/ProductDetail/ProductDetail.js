import React from 'react';
import ProductSkeleton from './ProductSkeleton';
import ReviewModal from './ReviewModal';
import ProductGallery from './ProductGallery';
import ProductOptions from './ProductOptions';
import ProductReviews from './ProductReviews';
import useProductDetail from './hooks/useProductDetail';
import '../../../styles/catalog/ProductDetail.less';

const ProductDetail = ({ urlKey: urlKeyProp }) => {
  const pdp = useProductDetail(urlKeyProp);
  const { loading, error, product } = pdp;

  if (loading && !product) return <ProductSkeleton />;
  if (error && !product) return <div>Error: {error.message}</div>;
  if (!product) return <div>Product not found</div>;

  const {
    eyebrowText, price, regularPrice, discount, inStock,
    isConfigurable, configOptions,
    swatchOptions, buttonOptions, selectedOptions, handleOptionChange,
    gallery, mainImg, activeImageIdx, setActiveImageIdx, mainImgLoading, setMainImgLoading,
    quantity, handleQuantityChange, incrementQuantity, decrementQuantity,
    handleAddToCart, canAddToCart, cartLoading, addToCartError,
    handleAddToWishlist, wishlistLoading, wishlistMessage,
    reviews, reviewCount, ratingSummary, showReviewModal, setShowReviewModal, handleWriteReviewClick,
    isAuthenticated, openLoginModal, refetch,
  } = pdp;

  return (
    <div className="pdp-page">
      <div className="pdp">
        <ProductGallery
          gallery={gallery}
          activeImageIdx={activeImageIdx}
          onSelectImage={setActiveImageIdx}
          mainImg={mainImg}
          mainImgLoading={mainImgLoading}
          onMainImgLoad={() => setMainImgLoading(false)}
          productName={product.name}
        />

        <div className="pdp__info">
          {eyebrowText && <span className="pdp-eyebrow">{eyebrowText}</span>}
          <h1 className="pdp-title">{product.name}</h1>

          <div className="pdp__price">
            {discount?.amount_off > 0 && <span className="old">${regularPrice?.value}</span>}
            <span>${price?.value}</span>
          </div>

          <ProductOptions
            swatchOptions={swatchOptions}
            buttonOptions={buttonOptions}
            selectedOptions={selectedOptions}
            onOptionChange={handleOptionChange}
          />

          {wishlistMessage && (
            <div className={`pdp-flash ${wishlistMessage.includes('Failed') ? 'is-error' : 'is-success'}`}>
              {wishlistMessage}
            </div>
          )}

          <div className="qty-row">
            <div className="qty">
              <button type="button" aria-label="Decrease" onClick={decrementQuantity} disabled={quantity <= 1}>−</button>
              <input
                type="number"
                value={quantity}
                min="1"
                max="9999"
                onChange={(e) => handleQuantityChange(e.target.value)}
                className="qty-input"
                aria-label="Quantity"
              />
              <button type="button" aria-label="Increase" onClick={incrementQuantity} disabled={quantity >= 9999}>+</button>
            </div>
            <div className="cta-row pdp-col-fill">
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={cartLoading || !inStock || !canAddToCart()}
                className="pdp-add-btn"
              >
                {cartLoading ? 'Adding…'
                  : !inStock ? 'Out of stock'
                  : !canAddToCart() ? 'Please select options'
                  : `Add to bag — $${price?.value}`}
              </button>
              <button
                type="button"
                onClick={handleAddToWishlist}
                disabled={wishlistLoading}
                className="icon-square pdp-wish-btn"
                aria-label="Add to wishlist"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
              </button>
            </div>
          </div>
          {addToCartError && (
            <div className="pdp-flash is-error" role="alert">
              {addToCartError}
            </div>
          )}

          <div className="pdp__meta">
            <span>
              <b>{inStock ? 'In stock' : 'Out of stock'}</b>
              {inStock && ' — ready to ship'}
              {product.only_x_left_in_stock && inStock && ` (${product.only_x_left_in_stock} left)`}
            </span>
            <span>SKU {product.sku}</span>
          </div>

          {product.description?.html && (
            <div className="pdp__desc">
              <h3>The story</h3>
              <div dangerouslySetInnerHTML={{ __html: product.description.html }} />
            </div>
          )}

          <dl className="specs pdp__specs">
            <div><dt>SKU</dt><dd>{product.sku}</dd></div>
            <div><dt>Availability</dt><dd>{inStock ? 'In stock' : 'Out of stock'}</dd></div>
            {product.only_x_left_in_stock && (
              <div><dt>Quantity available</dt><dd>{product.only_x_left_in_stock}</dd></div>
            )}
            {isConfigurable && configOptions.map((option) => (
              <div key={option.id}>
                <dt>{option.label}</dt>
                <dd>{option.values.map((v) => v.label).join(', ')}</dd>
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
        openLoginModal={openLoginModal}
        onSubmitted={refetch}
      />
    </div>
  );
};

export default ProductDetail;
