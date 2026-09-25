const MAIN = { start: 'flex-start', center: 'center', end: 'flex-end' };
const CROSS = { start: 'flex-start', center: 'center', end: 'flex-end', stretch: 'stretch' };

/**
 * A container. It holds blocks and does nothing else: how it looks — colour,
 * background image, padding, corners, size, a link around the whole thing —
 * comes from the style layer every block already has.
 *
 * That is what makes it worth its place. One primitive stands in for a family
 * of look-alike widgets: a coloured panel, a bordered card, or, with a
 * background image and a scrim over it, a banner with the text on the photo.
 */
export default function Box({ direction = 'column', gap = 8, alignX = 'stretch', alignY = 'start', children }) {
  const row = direction === 'row';
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: row ? 'row' : 'column',
        gap,
        // Which flex axis is which swaps with the direction. What the author
        // picked — "horizontal", "vertical" — must not.
        justifyContent: (row ? MAIN[alignX] : MAIN[alignY]) || 'flex-start',
        alignItems: (row ? CROSS[alignY] : CROSS[alignX]) || 'stretch',
        width: '100%',
        // Fills whatever height the style layer gave the box, so "bottom" has
        // something to be the bottom of, and boxes standing side by side in a
        // grid row come out the same height. Against an auto-height box this
        // resolves back to auto, so an unsized box still wraps its content.
        height: '100%',
      }}
    >
      {children}
    </div>
  );
}
