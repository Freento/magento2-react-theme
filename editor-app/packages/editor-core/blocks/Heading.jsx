import { useContext } from 'react';
import { INLINE_EDIT_STYLE } from '../inline-edit-style';
import { InsideLinkContext } from '../link-context.js';
import { contentUrl } from '../lib/contentUrl.js';

export default function Heading({
  text = 'Heading',
  href = '',
  level = 2,
  color = '',
  textAlign = 'left',
  fontWeight = 'bold',
  fontStyle = 'normal',
  textDecoration = 'none',
  textTransform = 'none',
  fontFamily = 'inherit',
  letterSpacing = 'normal',
  fontSize,
  backgroundImage = '',
  _editor,
}) {
  const insideLink = useContext(InsideLinkContext);
  const Tag = `h${level}`;
  const defaults = { 1: 36, 2: 28, 3: 22, 4: 18 };
  const headingStyle = {
    fontSize: fontSize || defaults[level] || 28,
    fontWeight,
    margin: 0,
    overflowWrap: 'anywhere',
    wordBreak: 'normal',
    whiteSpace: 'pre-line',
    color: color || '#000000',
    textAlign,
    fontStyle,
    textDecoration,
    textTransform,
    fontFamily,
    letterSpacing,
    backgroundImage: backgroundImage ? `url(${contentUrl(backgroundImage)})` : undefined,
    backgroundSize: backgroundImage ? 'cover' : undefined,
    backgroundPosition: backgroundImage ? 'center' : undefined,
  };

  if (_editor?.isSelected) {
    return (
      <Tag
        style={{ ...headingStyle, ...INLINE_EDIT_STYLE }}
        contentEditable
        suppressContentEditableWarning
        onBlur={(e) => {
          const next = e.currentTarget.innerText;
          if (next !== text) _editor.onUpdateProp?.(_editor.blockId, 'text', next);
        }}
      >
        {text}
      </Tag>
    );
  }

  if (href && !insideLink) {
    return (
      <Tag style={headingStyle}>
        <a href={href} style={{ color: 'inherit', textDecoration: textDecoration || 'none' }}>
          {text}
        </a>
      </Tag>
    );
  }
  return <Tag style={headingStyle}>{text}</Tag>;
}
