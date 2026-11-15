import { useState, useEffect, useRef } from 'react';
import { src, has } from '../../../../lib/productImage';

const visible = (list) => {
  const kept = (list || []).filter((g) => g && !g.disabled);
  return kept.length ? kept : null;
};

const singleton = (img, name) => (has(img) ? [{ ...img, label: img.label || name }] : null);

const baseFirst = (list, base) => {
  const baseUrl = base?.w900;
  const at = baseUrl ? list.findIndex((g) => g.w900 === baseUrl) : -1;
  return at > 0 ? [list[at], ...list.slice(0, at), ...list.slice(at + 1)] : list;
};

export default function useProductGallery(product, previewVariant) {
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [mainImgLoading, setMainImgLoading] = useState(false);

  const variantProduct = previewVariant?.product;
  const variantGallery = visible(variantProduct?.media_gallery)
    || singleton(variantProduct?.image, variantProduct?.name)
    || singleton(variantProduct?.small_image, variantProduct?.name);

  const gallery = baseFirst(
    variantGallery
      || visible(product?.media_gallery)
      || singleton(product?.image, product?.name)
      || [{ url: '/placeholder.jpg', label: product?.name }],
    (variantGallery ? variantProduct : product)?.image,
  );
  const galleryKey = gallery.map((g) => src(g)).join('|');
  const [shownKey, setShownKey] = useState(galleryKey);
  if (shownKey !== galleryKey) {
    setShownKey(galleryKey);
    setActiveImageIdx(0);
  }

  const mainImg = gallery[Math.min(activeImageIdx, gallery.length - 1)];
  const mainUrl = src(mainImg);

  const prevImgUrlRef = useRef(null);
  useEffect(() => {
    if (!mainUrl) return;
    if (prevImgUrlRef.current !== null && prevImgUrlRef.current !== mainUrl) {
      const probe = new Image();
      probe.src = mainUrl;
      if (!probe.complete) setMainImgLoading(true);
    }
    prevImgUrlRef.current = mainUrl;
  }, [mainUrl]);

  return { gallery, mainImg, activeImageIdx, setActiveImageIdx, mainImgLoading, setMainImgLoading };
}
