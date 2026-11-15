/**
 * The border a block wrapper draws from its style layer (side, width, style,
 * colour), as inline style — or null when it draws none. Shared with
 * lib/responsiveCss.js, which states a device's different border as a media rule.
 */
export function wrapperBorderCss({ borderSides, borderWidth, borderStyle, borderColor } = {}) {
  if (!borderStyle || borderStyle === 'none' || borderSides === 'none') return null;
  const raw = borderWidth == null || borderWidth === '' ? 1 : borderWidth;
  const widthCss =
    typeof raw === 'number'
      ? `${raw}px`
      : /^-?\d+(\.\d+)?$/.test(String(raw).trim())
      ? `${String(raw).trim()}px`
      : String(raw).trim();
  const decl = `${widthCss} ${borderStyle} ${borderColor || '#000000'}`;
  const sides = borderSides || 'all';
  if (sides === 'all') return { border: decl };
  const capitalized = sides.charAt(0).toUpperCase() + sides.slice(1);
  return { [`border${capitalized}`]: decl };
}
