import { useRef, useContext } from 'react';
import { InsideLinkContext } from '../link-context.js';
import { INLINE_EDIT_STYLE } from '../inline-edit-style';
import { contentUrl } from '../lib/contentUrl.js';
import { sanitizeRichText, plainToRich, isSafeHref } from '../lib/richText.js';
import { FormatToolbar } from './FormatToolbar.jsx';
import './Text.css';

const HEADING_SIZES = { 1: 36, 2: 28, 3: 22, 4: 18 };

const legacyHtml = (text, href) => {
  const body = plainToRich(text);
  return href && isSafeHref(href) ? `<a class="plain" href="${String(href).replace(/"/g, '&quot;')}">${body}</a>` : body;
};

/**
 * The text element's inline style for a set of props. Pure, so
 * lib/responsiveCss.js can compute it for each device and state the difference
 * as media rules for markup rendered before the app knows the screen.
 */
export function textStyle({
  level = 'p',
  fontSize,
  lineHeight,
  color = '',
  textAlign = 'left',
  fontWeight,
  fontStyle = 'normal',
  textDecoration = 'none',
  textTransform = 'none',
  fontFamily = 'inherit',
  letterSpacing = 'normal',
  backgroundImage = '',
} = {}) {
  const heading = [1, 2, 3, 4].includes(Number(level));
  return {
    fontSize: fontSize || (heading ? HEADING_SIZES[Number(level)] : 14),
    lineHeight: lineHeight || (heading ? undefined : 1.6),
    fontWeight: fontWeight || (heading ? 'bold' : 400),
    color: color || (heading ? '#000000' : '#333'),
    margin: 0,
    overflowWrap: 'anywhere',
    wordBreak: 'normal',
    whiteSpace: 'pre-line',
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
}

export default function Text({ html, text = '', href = '', _editor, ...props }) {
  const { level = 'p' } = props;
  const heading = [1, 2, 3, 4].includes(Number(level));
  const editing = !!_editor?.isSelected;
  const insideLink = useContext(InsideLinkContext);
  const rich = html != null && html !== '' ? sanitizeRichText(html, { lists: !heading }) : legacyHtml(text, href);
  const content = insideLink ? rich.replace(/<a\b[^>]*>/gi, '<span class="plain">').replace(/<\/a>/gi, '</span>') : rich;
  const Tag = heading ? `h${Number(level)}` : editing || /<[ou]l>/.test(content) ? 'div' : 'p';
  const ref = useRef(null);
  const style = textStyle(props);

  if (editing) {
    const save = () => {
      const el = ref.current;
      if (!el) return;
      const next = sanitizeRichText(el.innerHTML, { lists: !heading });
      if (next !== content) _editor.onUpdateProp?.(_editor.blockId, 'html', next);
      if (href) _editor.onUpdateProp?.(_editor.blockId, 'href', '');
    };
    return (
      <>
        <Tag
          ref={ref}
          className="ec-text"
          style={{ ...style, ...INLINE_EDIT_STYLE }}
          contentEditable
          suppressContentEditableWarning
          onPaste={(e) => {
            const sel = document.getSelection();
            if (!sel || sel.isCollapsed) return;
            const raw = (e.clipboardData?.getData('text/plain') || '').trim();
            const href = /^www\.\S+$/i.test(raw) ? `https://${raw}` : raw;
            if (!/^(?:https?:\/\/|mailto:|tel:)\S+$/i.test(href) || !isSafeHref(href)) return;
            e.preventDefault();
            document.execCommand('styleWithCSS', false, false);
            document.execCommand('createLink', false, href);
          }}
          onBlur={(e) => {
            if (e.relatedTarget?.closest?.('.ec-text-toolbar')) return;
            save();
          }}
          dangerouslySetInnerHTML={{ __html: content }}
        />
        <FormatToolbar
          editableRef={ref}
          level={level}
          onLevel={(next) => {
            save();
            _editor.onUpdateProp?.(_editor.blockId, 'level', next);
            _editor.onUpdateProp?.(_editor.blockId, 'fontSize', '');
            _editor.onUpdateProp?.(_editor.blockId, 'fontWeight', '');
          }}
        />
      </>
    );
  }

  return <Tag className="ec-text" style={style} dangerouslySetInnerHTML={{ __html: content }} />;
}
