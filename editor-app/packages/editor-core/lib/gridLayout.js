import { contentUrl } from './contentUrl.js';

// Grid layout values shared by the Grid block, the block wrapper and the
// per-device stylesheet (responsiveCss.js). The stylesheet restates for each
// device what the inline styles say for the device the markup was rendered
// for, so both have to come from the same calculation.

const asSize = (v) => (typeof v === 'number' ? `${v}px` : v || '0');

/**
 * The grid container's own style for a set of (already device-resolved) props.
 *
 * @param {object} props  Grid block props
 * @returns {object} camelCase style
 */
export function gridContainerStyle({
  columns = 2,
  rows = 1,
  minColumnWidth = 0,
  rowGap = 16,
  columnGap = 16,
  padding = '0',
  minRowHeight = '',
  alignItems = 'stretch',
  justifyItems = 'stretch',
  backgroundImage = '',
  backgroundColor = '',
} = {}) {
  const cols = Math.max(1, Math.min(12, Number(columns) || 1));
  const rowsN = Math.max(1, Number(rows) || 1);

  const rowTrack = minRowHeight ? `minmax(${minRowHeight}, auto)` : 'auto';

  const minCol = Math.max(0, Number(minColumnWidth) || 0);
  const gapNum = typeof columnGap === 'number' ? columnGap : parseFloat(columnGap) || 0;
  const gapCss = `${(cols - 1) * gapNum}px`;
  const trackMin = minCol > 0 ? `min(calc((100% - ${gapCss}) / ${cols}), ${minCol}px)` : '0';
  const columnTrack = `minmax(${trackMin}, 1fr)`;

  return {
    display: 'grid',
    gridTemplateColumns: `repeat(${cols}, ${columnTrack})`,
    gridTemplateRows: `repeat(${rowsN}, ${rowTrack})`,
    gridAutoRows: rowTrack,
    rowGap: asSize(rowGap),
    columnGap: asSize(columnGap),
    padding,
    alignItems,
    justifyItems,
    width: '100%',
    ...(backgroundColor ? { backgroundColor } : {}),
    ...(backgroundImage ? {
      backgroundImage: `url(${contentUrl(backgroundImage)})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    } : {}),
  };
}

/**
 * Explicit cell of a grid child from its colStart/rowStart, as the wrapper
 * places it. A start past the grid's column count, or a row without a column,
 * falls back to automatic placement.
 *
 * @param {object} style     the child's (device-resolved) style
 * @param {number|null} gridCols  the parent grid's column count, null outside a grid
 * @returns {{ gridColumn?: string, gridRow?: string }}
 */
export function gridSpanStyle(style, gridCols) {
  const out = {};
  let cStart = Number(style?.colStart);
  let rStart = Number(style?.rowStart);
  if (gridCols != null) {
    if (cStart > gridCols) { cStart = 0; rStart = 0; }
    if (cStart === 0 && rStart > 0) rStart = 0;
  }
  if (cStart > 0) out.gridColumn = `${cStart}`;
  if (rStart > 0) out.gridRow = `${rStart}`;
  return out;
}
