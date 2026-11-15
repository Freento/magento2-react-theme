import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { isSafeHref } from '../lib/richText.js';
import { IconLink, IconListOrdered, IconListUnordered, IconTextGrow, IconTextShrink } from '../overlay/icons.jsx';
import { useIsoLayoutEffect } from '../lib/useIsoLayoutEffect.js';
import { useLinkSuggest, LinkSuggestList } from '../components/LinkSuggest.jsx';
import './FormatToolbar.css';

const FONT_SIZES = [10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 64];
const HIGHLIGHT = 'ec-text-kept-selection';
const hotkey = (key) => (typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform) ? `⌘${key}` : `Ctrl+${key}`);

function readState(el) {
  const sel = document.getSelection();
  const node = sel?.anchorNode?.nodeType === 1 ? sel.anchorNode : sel?.anchorNode?.parentElement;
  const linkEl = node?.closest?.('a');
  const range = sel?.rangeCount ? sel.getRangeAt(0) : null;
  let first = range?.startContainer;
  if (first?.nodeType === 1 && first.childNodes[range.startOffset]) first = first.childNodes[range.startOffset];
  const sizeEl = first?.nodeType === 1 ? first : first?.parentElement;
  return {
    bold: document.queryCommandState('bold'),
    italic: document.queryCommandState('italic'),
    underline: !!(sizeEl?.closest?.('u') && el.contains(sizeEl.closest('u'))),
    strike: document.queryCommandState('strikeThrough'),
    list: document.queryCommandState('insertOrderedList'),
    bullets: document.queryCommandState('insertUnorderedList'),
    link: linkEl && el.contains(linkEl) ? linkEl.getAttribute('href') : null,
    size: sizeEl ? Math.round(parseFloat(getComputedStyle(sizeEl).fontSize)) : null,
  };
}

export function FormatToolbar({ editableRef, level, onLevel, links = true, lists = true }) {
  const [pos, setPos] = useState(null);
  const [state, setState] = useState({});
  const [linkMode, setLinkMode] = useState(false);
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const rangeRef = useRef(null);
  const barRef = useRef(null);
  const sideRef = useRef(null);
  const heading = [1, 2, 3, 4].includes(Number(level));

  useEffect(() => {
    const update = () => {
      if (linkMode) return;
      const el = editableRef.current;
      const sel = document.getSelection();
      if (!el || !sel || sel.rangeCount === 0 || sel.isCollapsed || !el.contains(sel.anchorNode) || !el.contains(sel.focusNode)) {
        setPos(null);
        return;
      }
      const range = sel.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      if (!rect.width && !rect.height) { setPos(null); return; }
      rangeRef.current = range.cloneRange();
      setState(readState(el));
      setPos({ left: rect.left + rect.width / 2, top: rect.top, bottom: rect.bottom });
    };
    document.addEventListener('selectionchange', update);
    document.addEventListener('input', update);
    window.addEventListener('scroll', update, true);
    return () => {
      document.removeEventListener('selectionchange', update);
      document.removeEventListener('input', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [editableRef, linkMode]);

  useEffect(() => {
    if (!linkMode || !rangeRef.current || typeof CSS === 'undefined' || !CSS.highlights) return undefined;
    CSS.highlights.set(HIGHLIGHT, new Highlight(rangeRef.current));
    return () => CSS.highlights.delete(HIGHLIGHT);
  }, [linkMode]);

  useIsoLayoutEffect(() => {
    const bar = barRef.current;
    if (!bar || !pos) return;
    const w = bar.offsetWidth;
    const h = bar.offsetHeight;
    const vw = document.documentElement.clientWidth;
    bar.style.left = `${Math.round(Math.min(Math.max(8, pos.left - w / 2), vw - w - 8))}px`;
    const vh = window.innerHeight;
    const below = pos.bottom + 8;
    if (linkMode && !sideRef.current) sideRef.current = vh - below >= 220 || vh - below >= pos.top ? 'below' : 'above';
    if (!linkMode) sideRef.current = null;
    const room = sideRef.current === 'below' ? vh - below - 8 : pos.top - 16;
    bar.style.setProperty('--ec-suggest-max', `${Math.max(120, room - 60)}px`);
    const top = sideRef.current === 'below'
      ? below
      : sideRef.current === 'above'
        ? Math.max(8, pos.top - h - 8)
        : (pos.top - h - 8 >= 8 ? pos.top - h - 8 : below);
    bar.style.top = `${Math.round(top)}px`;
  });

  const suggest = useLinkSuggest(url, linkMode);
  const startLinkRef = useRef(null);
  useEffect(() => {
    const el = editableRef.current;
    if (!el || !links) return undefined;
    const onKey = (e) => {
      if (!(e.ctrlKey || e.metaKey) || e.altKey || e.shiftKey || e.key.toLowerCase() !== 'k') return;
      if (document.getSelection()?.isCollapsed) return;
      e.preventDefault();
      startLinkRef.current?.();
    };
    el.addEventListener('keydown', onKey);
    return () => el.removeEventListener('keydown', onKey);
  }, [editableRef, links]);

  if (!pos || typeof document === 'undefined') return null;

  const restore = () => {
    const sel = document.getSelection();
    if (!rangeRef.current || !sel) return;
    editableRef.current?.focus();
    sel.removeAllRanges();
    sel.addRange(rangeRef.current);
  };
  const after = () => {
    const sel = document.getSelection();
    if (sel && sel.rangeCount) rangeRef.current = sel.getRangeAt(0).cloneRange();
    if (editableRef.current) setState(readState(editableRef.current));
  };
  const run = (cmd, value) => {
    restore();
    document.execCommand('styleWithCSS', false, false);
    document.execCommand(cmd, false, value);
    after();
  };
  const stepSize = (dir) => {
    const cur = state.size || 16;
    const px = dir > 0 ? FONT_SIZES.find((v) => v > cur) : [...FONT_SIZES].reverse().find((v) => v < cur);
    if (px) applySize(px);
  };
  const applySize = (px) => {
    restore();
    const el = editableRef.current;
    document.execCommand('styleWithCSS', false, false);
    document.execCommand('fontSize', false, '7');
    const spans = [];
    el.querySelectorAll('font[size="7"]').forEach((font) => {
      const span = document.createElement('span');
      span.style.fontSize = `${px}px`;
      while (font.firstChild) span.appendChild(font.firstChild);
      span.querySelectorAll('span').forEach((inner) => { inner.style.fontSize = ''; });
      font.replaceWith(span);
      spans.push(span);
    });
    if (spans.length) {
      const range = document.createRange();
      range.setStartBefore(spans[0]);
      range.setEndAfter(spans[spans.length - 1]);
      const sel = document.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
    }
    after();
  };
  const removeLink = () => {
    setLinkMode(false);
    const range = rangeRef.current;
    const el = editableRef.current;
    if (range && el) {
      const at = (n) => (n.nodeType === 1 ? n : n.parentElement)?.closest('a');
      const a = at(range.startContainer);
      const b = at(range.endContainer);
      if (a && el.contains(a)) range.setStartBefore(a);
      if (b && el.contains(b)) range.setEndAfter(b);
    }
    run('unlink');
  };
  const startLink = () => {
    setUrl(state.link || '');
    setError('');
    setLinkMode(true);
  };
  startLinkRef.current = startLink;
  const applyLink = (picked) => {
    const next = (typeof picked === 'string' ? picked : url).trim();
    if (!next) { removeLink(); return; }
    if (!isSafeHref(next)) { setError('Use https://…, /path, mailto: or tel:'); return; }
    setLinkMode(false);
    run('createLink', next);
  };

  return createPortal(
    <div
      ref={barRef}
      className={`ec-text-toolbar${linkMode ? ' ec-text-toolbar--link' : ''}`}
      onMouseDown={(e) => { if (e.target.tagName !== 'INPUT') e.preventDefault(); }}
    >
      {linkMode ? (
        <>
          <label className="ec-text-link-field">
            <IconLink />
            <input
              autoFocus
              onFocus={(e) => e.target.select()}
              type="text"
              placeholder="https://… or /page"
              value={url}
              onChange={(e) => { setUrl(e.target.value); setError(''); }}
              onKeyDown={(e) => {
                if (suggest.onKeyDown(e, applyLink)) return;
                if (e.key === 'Enter') { e.preventDefault(); applyLink(); }
                if (e.key === 'Escape') { e.preventDefault(); setLinkMode(false); restore(); }
              }}
            />
          </label>
          <button type="button" className="ec-text-link-apply" onClick={() => applyLink()}>Apply</button>
          {error && <span className="ec-text-toolbar-error">{error}</span>}
          <LinkSuggestList {...suggest} onPick={applyLink} className="ec-link-suggest--inline" />
        </>
      ) : (
        <>
          <button type="button" aria-pressed={!!state.bold} aria-label="Bold" data-tooltip={`Bold (${hotkey('B')})`} style={{ fontWeight: 700 }} onClick={() => run('bold')}>B</button>
          <button type="button" aria-pressed={!!state.italic} aria-label="Italic" data-tooltip={`Italic (${hotkey('I')})`} style={{ fontStyle: 'italic', fontFamily: 'Georgia, serif' }} onClick={() => run('italic')}>I</button>
          <button type="button" aria-pressed={!!state.underline} aria-label="Underline" data-tooltip={`Underline (${hotkey('U')})`} disabled={!!state.link} style={{ textDecoration: 'underline', textUnderlineOffset: 2 }} onClick={() => run('underline')}>U</button>
          <button type="button" aria-pressed={!!state.strike} aria-label="Strikethrough" data-tooltip="Strikethrough" style={{ textDecoration: 'line-through' }} onClick={() => run('strikeThrough')}>S</button>
          {onLevel && <span className="ec-text-toolbar-sep" />}
          {onLevel && [1, 2, 3].map((n) => (
            <button
              key={n}
              type="button"
              aria-label={`Heading ${n}`} data-tooltip={`Heading ${n}`}
              aria-pressed={Number(level) === n}
              onClick={() => onLevel(Number(level) === n ? 'p' : n)}
            >
              H{n}
            </button>
          ))}
          <span className="ec-text-toolbar-sep" />
          <button type="button" aria-label={`Larger text (${state.size || ''}px)`} data-tooltip={`Larger text (${state.size || ''}px)`} disabled={(state.size || 16) >= FONT_SIZES[FONT_SIZES.length - 1]} onClick={() => stepSize(1)}><IconTextGrow /></button>
          <button type="button" aria-label={`Smaller text (${state.size || ''}px)`} data-tooltip={`Smaller text (${state.size || ''}px)`} disabled={(state.size || 16) <= FONT_SIZES[0]} onClick={() => stepSize(-1)}><IconTextShrink /></button>
          {(links || (lists && !heading)) && <span className="ec-text-toolbar-sep" />}
          {links && <button type="button" aria-pressed={!!state.link} aria-label={state.link ? `Edit link (${state.link})` : 'Add link'} data-tooltip={`${state.link ? `Edit link (${state.link})` : 'Add link'} (${hotkey('K')})`} onClick={startLink}><IconLink /></button>}
          {lists && !heading && (
            <>
              <button type="button" aria-pressed={!!state.bullets} aria-label="Bulleted list" data-tooltip="Bulleted list" onClick={() => run('insertUnorderedList')}><IconListUnordered /></button>
              <button type="button" aria-pressed={!!state.list} aria-label="Numbered list" data-tooltip="Numbered list" onClick={() => run('insertOrderedList')}><IconListOrdered /></button>
            </>
          )}
        </>
      )}
    </div>,
    document.body
  );
}
