import { useRef, useContext } from 'react';
import { InsideLinkContext } from '../link-context.js';
import { INLINE_EDIT_STYLE } from '../inline-edit-style';
import { sanitizeRichText, plainToRich } from '../lib/richText.js';
import { FormatToolbar } from './FormatToolbar.jsx';

const RICH = { lists: false, links: false };

/** The button's inline style for a set of props and the block's style layer — pure, see lib/responsiveCss.js. */
export function buttonStyle({
  backgroundColor = '',
  color = '',
  fontSize = 14,
  padding = '12px 24px',
  borderRadius = 6,
  borderWidth = 1,
  borderColor = '#000000',
  borderStyle = 'solid',
  borderSides = 'none',
  fullWidth = false,
  fontFamily = 'inherit',
  fontWeight = 500,
  fontStyle = 'normal',
  textDecoration = 'none',
  textTransform = 'none',
  letterSpacing = 'normal',
  textAlign = 'center',
} = {}, _style) {
  const bw = Number(borderWidth) || 0;
  const borderDecl = bw > 0 && borderStyle !== 'none' ? `${bw}px ${borderStyle} ${borderColor}` : 'none';
  const sideBorder = (side) => (borderSides === 'all' || borderSides === side ? borderDecl : 'none');
  const hugsContent = !fullWidth && !_style?.width;
  return {
    display: 'flex',
    boxSizing: 'border-box',
    width: hugsContent ? 'fit-content' : undefined,
    height: _style?.height ? '100%' : undefined,
    alignItems: 'center',
    justifyContent: textAlign === 'left' ? 'flex-start'
      : textAlign === 'right' ? 'flex-end'
      : 'center',
    lineHeight: 1,
    padding,
    background: backgroundColor || 'var(--ink)',
    color: color || 'var(--bg)',
    borderRadius,
    borderTop: sideBorder('top'),
    borderRight: sideBorder('right'),
    borderBottom: sideBorder('bottom'),
    borderLeft: sideBorder('left'),
    textAlign,
    fontSize,
    fontFamily,
    fontWeight,
    fontStyle,
    textDecoration: textDecoration || 'none',
    textTransform,
    letterSpacing,
  };
}

export default function Button({ html, text = 'Button', href = '#', _style, _editor, ...props }) {
  const ref = useRef(null);
  const insideLink = useContext(InsideLinkContext);
  const Tag = insideLink ? 'span' : 'a';
  const linkProps = insideLink ? {} : { href };
  const content = html != null && html !== '' ? sanitizeRichText(html, RICH) : plainToRich(text);
  const style = buttonStyle(props, _style);

  if (_editor?.isSelected) {
    return (
      <>
        <Tag
          {...linkProps}
          style={{ ...style, ...INLINE_EDIT_STYLE }}
          onClick={(e) => e.preventDefault()}
          onMouseDown={(e) => {
            const span = ref.current;
            if (!span || e.target !== e.currentTarget) return;
            e.preventDefault();
            span.focus();
            const r = span.getBoundingClientRect();
            const range = document.createRange();
            range.selectNodeContents(span);
            range.collapse(e.clientX < r.left + r.width / 2);
            const sel = document.getSelection();
            sel.removeAllRanges();
            sel.addRange(range);
          }}
        >
          <span
            ref={ref}
            style={{ outline: 'none' }}
            contentEditable
            suppressContentEditableWarning
            onBlur={(e) => {
              if (e.relatedTarget?.closest?.('.ec-text-toolbar')) return;
              const next = sanitizeRichText(e.currentTarget.innerHTML, RICH);
              if (next !== content) _editor.onUpdateProp?.(_editor.blockId, 'html', next);
            }}
            dangerouslySetInnerHTML={{ __html: content }}
          />
        </Tag>
        <FormatToolbar editableRef={ref} links={false} lists={false} />
      </>
    );
  }

  return (
    <Tag {...linkProps} style={style}>
      <span dangerouslySetInnerHTML={{ __html: content }} />
    </Tag>
  );
}
