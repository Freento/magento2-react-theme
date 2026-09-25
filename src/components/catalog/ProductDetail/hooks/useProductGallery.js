import { useState, useEffect, useRef } from 'react';
import { src, has } from '../../../../lib/productImage';

export default function useProductGallery(product, previewVariant, selectedVariant) {
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [mainImgLoading, setMainImgLoading] = useState(true);

  // New variant → back to the first image.
  useEffect(() => {
    setActiveImageIdx(0);
  }, [selectedVariant]);

  const prevImgUrlRef = useRef(null);
  useEffect(() => {
    if (!product) return;
    const variantGallery =
      selectedVariant?.product?.media_gallery?.length
        ? selectedVariant.product.media_gallery
        : has(selectedVariant?.product?.image)
          ? [selectedVariant.product.image]
          : null;
    const list = variantGallery?.length
      ? variantGallery
      : product.media_gallery?.length
        ? product.media_gallery
        : [{ url: '/placeholder.jpg' }];
    const url = src(list[Math.min(activeImageIdx, list.length - 1)]);
    if (!url || prevImgUrlRef.current === url) return;
    const isFirstUrl = prevImgUrlRef.current === null;
    prevImgUrlRef.current = url;
    if (!isFirstUrl) setMainImgLoading(true);
  }, [product, selectedVariant, activeImageIdx]);

  // Visible gallery uses the *preview* variant (colour preview before size).
  const variantProduct = previewVariant?.product;
  const variantGallery = variantProduct?.media_gallery?.length
    ? variantProduct.media_gallery
    : has(variantProduct?.image)
      ? [{ ...variantProduct.image, label: variantProduct.image.label || variantProduct.name }]
      : has(variantProduct?.small_image)
        ? [{ ...variantProduct.small_image, label: variantProduct.small_image.label || variantProduct.name }]
        : null;
  const gallery = variantGallery?.length
    ? variantGallery
    : product?.media_gallery?.length
      ? product.media_gallery
      : [{ url: '/placeholder.jpg', label: product?.name }];
  const mainImg = gallery[Math.min(activeImageIdx, gallery.length - 1)];

  return { gallery, mainImg, activeImageIdx, setActiveImageIdx, mainImgLoading, setMainImgLoading };
}
