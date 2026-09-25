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
    <div className="pdp__gallery grid grid-cols-[80px_1fr] gap-4 items-start max900:flex max900:flex-col max900:gap-3">
      <div className="pdp__thumbs flex flex-col gap-2.5 max900:flex-row max900:flex-wrap max900:gap-2 max900:order-2" role="tablist" aria-label="Images">
        {gallery.map((g, i) => (
          <button
            key={src(g) + i}
            type="button"
            className="pdp__thumb w-20 h-[100px] max900:w-16 max900:h-20 bg-surface border border-line rounded overflow-hidden cursor-pointer p-0 [transition:border-color_120ms_ease] hover:border-ink aria-pressed:border-ink"
            aria-pressed={i === activeImageIdx}
            aria-label={`View ${i + 1}`}
            onClick={() => onSelectImage(i)}
          >
            {/* Rendered at 68x88 (52x68 on mobile) — the `thumb` alias is the
                only size these need; `src()` falls back to the largest declared
                width for variant images, which carry no thumb alias. */}
            <img src={g.thumb || src(g)} alt="" className="w-full h-full object-contain p-1.5 bg-bg" />
          </button>
        ))}
      </div>
      <div className={`pdp__main${mainImgLoading ? ' is-loading' : ''} group bg-surface rounded-lg overflow-hidden aspect-[4/5] relative`}>
        <img
          key={src(mainImg)}
          src={src(mainImg)}
          className="w-full h-full object-cover [transition:opacity_160ms_ease] group-[.is-loading]:opacity-0"
          alt={productName}
          ref={(el) => { if (el?.complete) onMainImgLoad(); }}
          onLoad={onMainImgLoad}
          onError={onMainImgLoad}
        />
        {mainImgLoading && <div className="pdp__main-skeleton sk-img absolute inset-0 pointer-events-none rounded-[inherit]" aria-hidden="true" />}
      </div>
    </div>
  </>
);

export default ProductGallery;
