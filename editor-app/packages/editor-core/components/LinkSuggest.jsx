import { useEffect, useRef, useState } from 'react';
import { filterLinkTargets, getLinkSearch, useLinkTargets } from '../lib/linkTargets.js';
import './LinkSuggest.css';

const searchable = (q) => q.length >= 2 && !/^(?:https?:|mailto:|tel:|#|\/\/)/i.test(q);

export function useLinkSuggest(value, open) {
  const targets = useLinkTargets();
  const query = String(value || '').trim();
  const [remote, setRemote] = useState({ query: '', items: [], loading: false });
  useEffect(() => {
    const lookup = getLinkSearch();
    if (!open || !lookup || !searchable(query)) {
      setRemote({ query: '', items: [], loading: false });
      return undefined;
    }
    let cancelled = false;
    setRemote((r) => ({ ...r, loading: true }));
    const t = setTimeout(() => {
      lookup(query)
        .then((items) => { if (!cancelled) setRemote({ query, items: items || [], loading: false }); })
        .catch(() => { if (!cancelled) setRemote({ query, items: [], loading: false }); });
    }, 250);
    return () => { cancelled = true; clearTimeout(t); };
  }, [query, open]);
  const pages = open ? filterLinkTargets(targets, query, searchable(query) ? 3 : 8).map((t) => ({ ...t, group: 'Pages' })) : [];
  const seen = new Set(pages.map((t) => t.path));
  const extra = open && searchable(query) ? remote.items.filter((t) => t.path !== query && !seen.has(t.path) && seen.add(t.path)) : [];
  const pending = open && searchable(query) && !!getLinkSearch() && (remote.loading || remote.query !== query);
  const fresh = [...pages, ...extra];
  const lastRef = useRef([]);
  const items = pending && lastRef.current.length && fresh.length < lastRef.current.length ? lastRef.current : fresh;
  if (!pending) lastRef.current = fresh;
  else if (items === fresh && fresh.length) lastRef.current = fresh;
  if (!open) lastRef.current = [];
  const loading = pending && !items.length;
  const [active, setActive] = useState(-1);
  const key = items.map((t) => t.path).join('|');
  useEffect(() => setActive(-1), [key]);
  const onKeyDown = (e, pick) => {
    if (!items.length) return false;
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((i) => (i + 1) % items.length); return true; }
    if (e.key === 'ArrowUp') { e.preventDefault(); setActive((i) => (i <= 0 ? items.length - 1 : i - 1)); return true; }
    if (e.key === 'Enter' && active >= 0) { e.preventDefault(); pick(items[active].path); return true; }
    return false;
  };
  return { items, active, setActive, onKeyDown, loading };
}

export function LinkSuggestList({ items, active, setActive, onPick, loading, className = '' }) {
  if (!items.length && !loading) return null;
  return (
    <div className={`ec-link-suggest ${className}`} role="listbox">
      {items.map((t, i) => (
        <div key={t.path} className="ec-link-suggest-row">
          {(i === 0 || items[i - 1].group !== t.group) && <div className="ec-link-suggest-head">{t.group}</div>}
          <button
            type="button"
            role="option"
            aria-selected={i === active}
            className="ec-link-suggest-item"
            onMouseDown={(e) => e.preventDefault()}
            onMouseEnter={() => setActive(i)}
            onClick={() => onPick(t.path)}
          >
            <span className="ec-link-suggest-title">{t.title || t.path}</span>
            <span className="ec-link-suggest-path">{t.path}</span>
          </button>
        </div>
      ))}
      {loading && (
        <div className="ec-link-suggest-loading" aria-label="Searching" aria-busy="true">
          <span style={{ width: '62%' }} />
          <span style={{ width: '38%' }} />
        </div>
      )}
    </div>
  );
}
