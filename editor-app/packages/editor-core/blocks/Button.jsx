import { INLINE_EDIT_STYLE } from '../inline-edit-style';

export default function Button({
  text = 'Button',
  href = '#',
  backgroundColor = '#2563eb',
  color = '#ffffff',
  fontSize = 14,
  padding = '12px 24px',
  borderRadius = '6px',
  borderWidth = 0,
  borderColor = '#2563eb',
  borderStyle = 'solid',
  fullWidth = false,
  fontFamily = 'inherit',
  fontWeight = 500,
  fontStyle = 'normal',
  textDecoration = 'none',
  textTransform = 'none',
  letterSpacing = 'normal',
  textAlign = 'center',
  _editor,
}) {
  const bw = Number(borderWidth) || 0;
  const buttonStyle = {
    display: fullWidth ? 'flex' : 'inline-flex',
    alignItems: 'center',
    justifyContent: textAlign === 'left' ? 'flex-start'
      : textAlign === 'right' ? 'flex-end'
      : 'center',
    lineHeight: 1,
    padding,
    background: backgroundColor,
    color,
    borderRadius,
    border: bw > 0 ? `${bw}px ${borderStyle} ${borderColor}` : 'none',
    textAlign,
    fontSize,
    fontFamily,
    fontWeight,
    fontStyle,
    textDecoration: textDecoration || 'none',
    textTransform,
    letterSpacing,
  };

  if (_editor?.isSelected) {
    return (
      <a
        href={href}
        style={{ ...buttonStyle, ...INLINE_EDIT_STYLE }}
        contentEditable
        suppressContentEditableWarning
        onClick={(e) => e.preventDefault()}
        onBlur={(e) => {
          const next = e.currentTarget.innerText;
          if (next !== text) _editor.onUpdateProp?.(_editor.blockId, 'text', next);
        }}
      >
        {text}
      </a>
    );
  }

  return (
    <a href={href} style={buttonStyle}>
      {text}
    </a>
  );
}
