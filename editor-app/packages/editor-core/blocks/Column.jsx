const MAIN = { start: 'flex-start', center: 'center', end: 'flex-end' };
const CROSS = { start: 'flex-start', center: 'center', end: 'flex-end', stretch: 'stretch' };
const FROM_TEXT_ALIGN = { left: 'start', center: 'center', right: 'end', justify: 'stretch' };

/** The column's inline style for a set of props and the block's style layer — pure, see lib/responsiveCss.js. */
export function columnStyle({ gap = 8, flex = 1, direction = 'column', alignX, alignY = 'start' } = {}, _style) {
  const row = direction === 'row';
  const x = alignX || FROM_TEXT_ALIGN[_style?.textAlign] || 'stretch';
  return {
    display: 'flex',
    flexDirection: row ? 'row' : 'column',
    flexWrap: row ? 'wrap' : undefined,
    justifyContent: (row ? MAIN[x] : MAIN[alignY]) || 'flex-start',
    alignItems: (row ? CROSS[alignY] : CROSS[x]) || 'stretch',
    gap: typeof gap === 'number' ? `${gap}px` : gap,
    flex,
    width: '100%',
    height: '100%',
    minWidth: 0,
    boxSizing: 'border-box',
  };
}

export default function Column({ _style, children, ...props }) {
  return <div style={columnStyle(props, _style)}>{children}</div>;
}
