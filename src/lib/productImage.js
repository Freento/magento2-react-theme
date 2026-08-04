// Product image sizing.
//
// Freento_NextGenImages resizes catalog images via arguments on the existing
// GraphQL `url` field: `url(width: Int)`. The resulting URL carries an opaque
// md5 of the resize params, so the client cannot derive a sized URL on its own
// — every width has to be requested explicitly in the query.
//
// Convention: each Magento image type is pinned to ONE width, chosen to cover
// the widest slot that type ever occupies. Queries alias it as `w<N>`:
//
//     small_image { w450: url(width: 450) }
//
// and components just call `src()`. No srcset, no `sizes`, no DPR math — a
// fixed size per type, which is why picking the right *type* per slot matters
// more than anything else here.
//
//   thumbnail     150   mini-cart 72px, checkout 48px, autocomplete 48px,
//                       PDP thumb rail 68px
//   small_image   450   product card; worst slot is 413px (the 2-column band
//                       below 901px, which is wider than the 4-column desktop
//                       slot of 292px)
//   media_gallery 900   PDP main image; worst slot is ~846px at 900px viewport,
//                       where the layout collapses to a single column
//
// Widths MUST be multiples of 50: the module quantizes upwards (STEP = 50), so
// `width: 301` silently yields a 350px image — a size nobody declared, plus an
// extra cache directory. Ceiling is 2000 and there is no upscaling.
//
// Every distinct (image type x width) pair is its own cache directory, and the
// first request for one pays for the resize + WebP encode synchronously — the
// module has no CLI warmup.
//
// These sizes target 1x. High-DPR screens get a softer image by design; adding
// retina back means either a srcset ladder or <picture> with media queries.

const WIDTH_ALIAS = /^w(\d+)$/;

/**
 * The URL to render. Returns the sized variant a query declared, falling back
 * to an unsized `url` (for image objects that predate this convention) and then
 * to the local placeholder.
 *
 * When several widths are present it takes the smallest, so a stray extra alias
 * can never silently ship the heaviest file.
 */
export const src = (img, placeholder = '/placeholder.jpg') => {
  if (img) {
    const sized = [];
    for (const [key, url] of Object.entries(img)) {
      const m = WIDTH_ALIAS.exec(key);
      if (m && typeof url === 'string' && url) sized.push([Number(m[1]), url]);
    }
    if (sized.length) return sized.sort((a, b) => a[0] - b[0])[0][1];
    if (img.url) return img.url;
  }
  return placeholder;
};

/** True when the object carries a usable URL. */
export const has = (img) => Boolean(src(img, ''));