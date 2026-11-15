import {useEffect, useMemo, useRef, useState} from 'react';
import {createPortal} from 'react-dom';
import {parseCustomCss, ALLOWED_PROPERTIES} from 'editor-core/lib/customCss';
import {UI} from '../../../src/editor/Icon.jsx';
import {btnSaveCore} from '../lib/cls.js';

const supported = (prop, value) =>
    typeof CSS === 'undefined' || typeof CSS.supports !== 'function' || CSS.supports(prop, value);

const check = (text) => {
    const {declarations, errors} = parseCustomCss(text);
    const all = [...errors];
    for (const d of declarations) {
        if (!supported(d.prop, d.value)) all.push({line: d.line, message: `"${d.value}" is not a valid value for ${d.prop}`});
    }
    const bad = new Set(all.map((e) => e.line));
    return {ok: declarations.filter((d) => !bad.has(d.line)).length, errors: all.sort((a, b) => a.line - b.line), bad};
};

const escape = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const highlight = (text, bad, active) =>
    String(text).split('\n').map((line, i) => {
        const n = i + 1;
        let html;
        if (/^\s*\/\*.*\*\/\s*$/.test(line)) html = `<span class="text-ed-text-soft">${escape(line)}</span>`;
        else {
            const m = line.match(/^(\s*)([a-zA-Z-]+)(\s*:\s*)(.*)$/);
            html = m
                ? `${m[1]}<span class="text-ed-primary">${escape(m[2])}</span>${escape(m[3])}<span class="text-ed-text">${escape(m[4])}</span>`
                : escape(line);
        }
        const cls = bad.has(n)
            ? (n === active ? 'bg-ed-danger-border/40 [box-shadow:inset_3px_0_0_#B91C1C]' : 'bg-ed-danger-soft [box-shadow:inset_3px_0_0_#B91C1C]')
            : '';
        return `<span class="block w-max min-w-full min-h-[1.5em] pl-3 pr-7 ${cls}">${html || ' '}</span>`;
    }).join('');

export function CustomCssField({value, onApply}) {
    const [draft, setDraft] = useState(value || '');
    const [applied, setApplied] = useState(null);
    const [showAllowed, setShowAllowed] = useState(false);
    const helpRef = useRef(null);
    const [helpPos, setHelpPos] = useState(null);
    const [activeLine, setActiveLine] = useState(null);
    const textRef = useRef(null);
    const preRef = useRef(null);
    useEffect(() => { setDraft(value || ''); setApplied(null); }, [value]);
    const result = useMemo(() => check(draft), [draft]);
    const goToLine = (line) => {
        const lines = draft.split('\n');
        const start = lines.slice(0, line - 1).reduce((n, l) => n + l.length + 1, 0);
        const end = start + (lines[line - 1] || '').length;
        setActiveLine(line);
        const el = textRef.current;
        if (!el) return;
        el.focus();
        el.setSelectionRange(start, end);
        const lineHeight = 18;
        el.scrollTop = Math.max(0, (line - 2) * lineHeight);
        sync();
    };
    const dirty = draft !== (value || '');
    const [flash, setFlash] = useState(0);
    const apply = () => {
        if (result.errors.length) {
            goToLine(result.errors[0].line);
            setFlash((n) => n + 1);
            return;
        }
        onApply(draft);
        setApplied(result);
    };
    const gutterRef = useRef(null);
    const sync = () => {
        const t = textRef.current;
        if (!t) return;
        if (preRef.current) { preRef.current.scrollTop = t.scrollTop; preRef.current.scrollLeft = t.scrollLeft; }
        if (gutterRef.current) gutterRef.current.scrollTop = t.scrollTop;
    };
    const mono = 'font-mono text-[12px] leading-[1.5] whitespace-pre';
    useEffect(() => {
        if (!showAllowed) return undefined;
        const place = () => {
            const r = helpRef.current?.getBoundingClientRect();
            if (!r) return;
            const width = 280;
            const height = Math.min(260, window.innerHeight - 16);
            const below = r.bottom + 6;
            const top = below + height <= window.innerHeight - 8 ? below : Math.max(8, r.top - 6 - height);
            setHelpPos({top, left: Math.max(8, Math.min(r.right - width, window.innerWidth - width - 8)), width, height});
        };
        place();
        window.addEventListener('scroll', place, true);
        window.addEventListener('resize', place);
        const close = (e) => { if (!e.target.closest?.('.custom-css-help')) setShowAllowed(false); };
        const key = (e) => { if (e.key === 'Escape') setShowAllowed(false); };
        document.addEventListener('mousedown', close);
        document.addEventListener('keydown', key);
        return () => {
            window.removeEventListener('scroll', place, true);
            window.removeEventListener('resize', place);
            document.removeEventListener('mousedown', close);
            document.removeEventListener('keydown', key);
        };
    }, [showAllowed]);
    return (
        <div className="custom-css-field flex flex-col gap-2">
            <div className="relative flex h-[140px] rounded border border-solid border-ed-border bg-ed-surface focus-within:border-ed-primary overflow-hidden">
                <div
                    ref={gutterRef}
                    aria-hidden="true"
                    className="font-mono text-[12px] leading-[1.5] w-8 shrink-0 h-full overflow-hidden py-1.5 pr-1.5 text-right select-none bg-ed-surface-hover border-0 border-r border-solid border-ed-border"
                >
                    {draft.split('\n').map((_, i) => (
                        <div key={i} className={`min-h-[1.5em] ${result.bad.has(i + 1) ? 'text-ed-danger font-semibold' : 'text-ed-text-soft'}`}>{i + 1}</div>
                    ))}
                </div>
                <div className="relative flex-1 min-w-0 h-full">
                <pre
                    ref={preRef}
                    aria-hidden="true"
                    className={`${mono} m-0 px-0 py-1.5 h-full overflow-hidden pointer-events-none text-ed-text`}
                    dangerouslySetInnerHTML={{__html: highlight(draft, result.bad, activeLine) || '<span class="block min-h-[1.5em] pl-3"> </span>'}}
                />
                <textarea
                    ref={textRef}
                    className={`${mono} absolute inset-0 w-full h-full pl-3 pr-7 py-1.5 bg-transparent text-transparent caret-ed-text border-none outline-none resize-none overflow-auto`}
                    value={draft}
                    spellCheck={false}
                    placeholder="align-items: center;"
                    onChange={(e) => { setDraft(e.target.value); setActiveLine(null); }}
                    onScroll={sync}
                />
                </div>
                <div className="custom-css-help absolute top-1 right-1" ref={helpRef}>
                    <button
                        type="button"
                        className={`w-6 h-6 inline-flex items-center justify-center rounded border-none cursor-pointer ${showAllowed ? 'bg-ed-primary text-white' : 'bg-transparent text-[#424242] hover:bg-ed-surface-hover hover:text-ed-primary'}`}
                        data-tooltip="Which properties can I use?"
                        aria-label="Which properties can I use?"
                        onClick={() => setShowAllowed((v) => !v)}
                    >
                        <UI.Help size={14} strokeWidth={1.75}/>
                    </button>
                    {showAllowed && helpPos && createPortal(
                        <div
                            className="custom-css-help fixed z-[2000] overflow-auto p-2.5 bg-ed-surface border border-solid border-ed-border rounded shadow-[0_12px_32px_rgba(0,0,0,0.14),0_2px_6px_rgba(0,0,0,0.06)]"
                            style={{top: helpPos.top, left: helpPos.left, width: helpPos.width, maxHeight: helpPos.height}}
                        >
                            <div className="mb-2 text-[11.5px] font-semibold text-ed-text">Allowed properties</div>
                            <div className="flex flex-wrap gap-1">
                                {ALLOWED_PROPERTIES.map((prop) => (
                                    <code key={prop} className="px-1.5 py-0.5 rounded bg-ed-surface-hover border border-solid border-ed-border text-[11px] text-ed-text">{prop}</code>
                                ))}
                            </div>
                        </div>,
                        document.body
                    )}
                </div>
            </div>
            <button
                type="button"
                className={`${btnSaveCore} w-full h-8 justify-center`}
                disabled={!dirty}
                onClick={apply}
            >
                {dirty ? 'Apply' : (applied || value ? 'Applied' : 'Apply')}
            </button>
            {result.errors.length > 0 && (
                <ul key={flash} className={`m-0 p-0 list-none flex flex-col gap-0.5 text-[11.5px] text-ed-danger${flash ? ' custom-css-shake' : ''}`}>
                    {result.errors.map((e, i) => (
                        <li key={i}>
                            <button type="button" className={`p-0 bg-transparent border-none cursor-pointer text-left text-[11.5px] text-ed-danger hover:underline ${activeLine === e.line ? 'font-semibold' : ''}`} onClick={() => goToLine(e.line)}>
                                Line {e.line}: {e.message}
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
