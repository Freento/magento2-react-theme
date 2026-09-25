/**
 * Vocabulary of the route-area documents in `editor-app/content/routes/`.
 *
 * A route document does not describe a page — the storefront owns that. It says
 * which blocks go into which named area of a route the storefront already
 * renders (a category, later a product), and how that route's own content
 * behaves next to them. Nothing here is read from Magento.
 */

export const CATEGORY_TOP_AREA = 'category-top';

export const ROUTE_AREAS = {
  category: [{ id: CATEGORY_TOP_AREA, label: 'Above product list' }],
};

export const DISPLAY_MODES = [
  { value: 'blocks_and_products', label: 'Blocks and products' },
  { value: 'blocks', label: 'Blocks only' },
  { value: 'products', label: 'Products only' },
  { value: 'none', label: 'Hide everything' },
];

/**
 * What a freshly created document gets: the one thing an author is certain to
 * do next is add a block, so the mode that shows it is the only safe start.
 */
export const DEFAULT_DISPLAY_MODE = 'blocks_and_products';

/**
 * What a route with no document at all behaves like. Deliberately not the
 * default above: a category nobody has edited must render exactly as it did
 * before the editor knew route areas existed.
 */
export const DISPLAY_WITHOUT_DOCUMENT = 'products';

export const areasForRouteType = (type) => ROUTE_AREAS[type] || [];

export const areaBlocks = (doc, areaId) => doc?.areas?.[areaId] || [];

export const displayModeOf = (doc) =>
  doc?.display || (doc ? DEFAULT_DISPLAY_MODE : DISPLAY_WITHOUT_DOCUMENT);

export const showsBlocks = (mode) =>
  mode === 'blocks_and_products' || mode === 'blocks';

/** The route's own content — the product list on a category. */
export const showsRouteContent = (mode) =>
  mode === 'blocks_and_products' || mode === 'products';
