import React from 'react';
import { src } from '../../../lib/productImage';

const ProductGallery = ({
  gallery,
  activeImageIdx,
  onSelectImage,
  mainImg,
  mainImgLoading,
  onMainImgLoad,
  productName,
}) => (
  <>
    <div className="pdp__gallery">
      <div className="pdp__thumbs" role="tablist" aria-label="Images">
        {gallery.map((g, i) => (
          <button
            key={src(g) + i}
            type="button"
            className="pdp__thumb"
            aria-pressed={i === activeImageIdx}
            aria-label={`View ${i + 1}`}
            onClick={() => onSelectImage(i)}
          >
            {/* Rendered at 68x88 (52x68 on mobile) — the `thumb` alias is the
                only size these need; `src()` falls back to the largest declared
                width for variant images, which carry no thumb alias. */}
            <img src={g.thumb || src(g)} alt="" />
          </button>
        ))}
      </div>
      <div className={`pdp__main${mainImgLoading ? ' is-loading' : ''}`}>
        <img
          key={src(mainImg)}
          src={src(mainImg)}
          alt={productName}
          onLoad={onMainImgLoad}
          onError={onMainImgLoad}
        />
        {mainImgLoading && <div className="pdp__main-skeleton sk-img" aria-hidden="true" />}
      </div>
    </div>
  </>
);

export default ProductGallery;
