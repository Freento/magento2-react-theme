import { useState } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import useProductData from './useProductData';
import useVariantSelection from './useVariantSelection';
import useProductGallery from './useProductGallery';
import useAddToCart from './useAddToCart';
import useWishlistAction from './useWishlistAction';

export default function useProductDetail(urlKeyProp) {
  const data = useProductData(urlKeyProp);
  const { product, isConfigurable } = data;

  const variant = useVariantSelection(product, isConfigurable);
  const gallery = useProductGallery(product, variant.previewVariant, variant.selectedVariant);
  const cart = useAddToCart(product, isConfigurable, variant.selectedVariant, variant.selectedOptions);
  const wishlist = useWishlistAction(product);

  // Review modal toggle (gated on auth).
  const { isAuthenticated, openLoginModal } = useAuth();
  const [showReviewModal, setShowReviewModal] = useState(false);
  const handleWriteReviewClick = () => {
    if (!isAuthenticated) { openLoginModal(); return; }
    setShowReviewModal(true);
  };

  // Price / availability follow the selected variant when there is one.
  const currentProduct = variant.selectedVariant?.product || product;
  const price = currentProduct?.price_range?.minimum_price?.final_price;
  const regularPrice = currentProduct?.price_range?.minimum_price?.regular_price;
  const discount = currentProduct?.price_range?.minimum_price?.discount;
  const inStock = (currentProduct?.stock_status || product?.stock_status) === 'IN_STOCK';

  return {
    ...data,
    ...variant,
    ...gallery,
    ...cart,
    ...wishlist,
    price, regularPrice, discount, inStock,
    showReviewModal, setShowReviewModal, handleWriteReviewClick,
    isAuthenticated, openLoginModal,
  };
}
