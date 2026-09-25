import { ROUTE_AREAS } from 'editor-core/routes';

// Pages and route documents share one picker and one `currentPageId`, so route
// ids carry a prefix. What follows it is the document's `<type>/<slug>`, which
// is also its path under `content/routes/` and its REST path.
export const ROUTE_ID_PREFIX = 'route:';

export const isRouteId = (id) => typeof id === 'string' && id.startsWith(ROUTE_ID_PREFIX);
export const toRouteId = (id) => `${ROUTE_ID_PREFIX}${id}`;
export const bareRouteId = (id) => (isRouteId(id) ? id.slice(ROUTE_ID_PREFIX.length) : id);

export const areasForDoc = (doc) => ROUTE_AREAS[doc?.route?.type] || [];

/**
 * Presents a route document to the editing hooks as if it were a page.
 *
 * Everything downstream — the block tree, drag and drop, the inspector, undo —
 * works on an object with a flat `blocks` list. A route document keeps one list
 * per area instead, so editing one area means projecting it into that shape and
 * folding the result back. `areas` is dropped from the view on purpose: nothing
 * downstream should reach past the area being edited.
 *
 * @param {object|null} doc
 * @param {string|null} areaId
 * @returns {object|null}
 */
export function viewOfArea(doc, areaId) {
  if (!doc) return null;
  const { areas, ...rest } = doc;
  return { ...rest, blocks: areas?.[areaId] || [] };
}

/**
 * The inverse of `viewOfArea`: takes an edited view and puts its blocks back
 * into the area they came from, leaving every other area untouched.
 *
 * @param {object} doc     The document as stored.
 * @param {string} areaId
 * @param {object} view    The edited view.
 * @returns {object}
 */
export function foldArea(doc, areaId, view) {
  // An unknown route type has no areas to write into; keeping the document as
  // stored beats inventing an area named "null".
  if (!areaId) return doc;
  const { blocks, ...rest } = view || {};
  return {
    ...rest,
    areas: { ...(doc?.areas || {}), [areaId]: blocks || [] },
  };
}
