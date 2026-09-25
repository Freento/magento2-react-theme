import { useContext } from 'react';
import { INLINE_EDIT_STYLE } from '../inline-edit-style';
import { InsideLinkContext } from '../link-context.js';

export default function Text({
  text = '',
  href = '',
  fontSize = 14,
  lineHeight = 1.6,
  color = '',
  textAlign = 'left',
  fontWeight = 400,
  fontStyle = 'normal',
  textDecoration = 'none',
  textTransform = 'none',
  fontFamily = 'inherit',
  letterSpacing = 'normal',
  _editor,
}) {
  const insideLink = useContext(InsideLinkContext);
  const textStyle = {
    fontSize,
    lineHeight,
    margin: 0,
    overflowWrap: 'anywhere',
    wordBreak: 'normal',
    color: color || '#333',
    textAlign,
    fontWeight,
    fontStyle,
    textDecoration,
    textTransform,
    fontFamily,
    letterSpacing,
  };

  if (_editor?.isSelected) {
    return (
      <p
        style={{ ...textStyle, ...INLINE_EDIT_STYLE }}
        contentEditable
        suppressContentEditableWarning
        onBlur={(e) => {
          const next = e.currentTarget.innerText;
          if (next !== text) _editor.onUpdateProp?.(_editor.blockId, 'text', next);
        }}
      >
        {text}
      </p>
    );
  }

  if (href && !insideLink) {
    return (
      <p style={{ ...textStyle, textDecoration: 'none' }}>
        <a
          href={href}
          style={{ color: 'inherit', textDecoration: textDecoration || 'none' }}
        >
          {text}
        </a>
      </p>
    );
  }
  return <p style={textStyle}>{text}</p>;
}
