import { useContext } from 'react';
import { INLINE_EDIT_STYLE } from '../inline-edit-style';
import { InsideLinkContext } from '../link-context.js';

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
  // A button inside a linked container stays a button to look at, but the
  // click belongs to the container's link.
  const insideLink = useContext(InsideLinkContext);
  const Tag = insideLink ? 'span' : 'a';
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
      <Tag
        {...(insideLink ? {} : { href })}
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
      </Tag>
    );
  }

  return (
    <Tag {...(insideLink ? {} : { href })} style={buttonStyle}>
      {text}
    </Tag>
  );
}
