import {useState, useRef, useEffect} from 'react';
import {loadCategoryRoots, getCachedRoots, findCategory} from './categoryData.js';

// Keep nodes whose name matches, plus any ancestor of a match so the path stays
// visible. A matched node keeps its full subtree so the user can still drill in.
function filterTree(nodes, q) {
    const out = [];
    for (const node of nodes) {
        const selfMatch = node.name.toLowerCase().includes(q);
        const kids = node.children ? filterTree(node.children, q) : [];
        if (selfMatch) {
            out.push(node);
        } else if (kids.length) {
            out.push({...node, children: kids});
        }
    }
    return out;
}

function CategoryTree({nodes, value, onPick, expanded, toggle, expandAll}) {
    return (
        // [&_.category-tree]:pl-3.5 = the old nested-list indent rule.
        <ul className="category-tree list-none m-0 p-0 [&_.category-tree]:pl-3.5">
            {nodes.map((node) => {
                const hasChildren = !!(node.children && node.children.length);
                const isOpen = expandAll || expanded.has(node.id);
                const selected = String(node.id) === String(value);
                return (
                    <li key={node.id} className="category-node">
                        <div
                            className={
                                'category-row flex items-center gap-0.5 rounded ' +
                                (selected ? 'selected bg-[rgba(15,76,92,0.14)]' : 'hover:bg-ed-bg')
                            }
                        >
                            {hasChildren && !expandAll ? (
                                <button
                                    type="button"
                                    className={
                                        'category-caret w-[18px] h-[26px] shrink-0 flex items-center justify-center border-none ' +
                                        'bg-transparent text-ed-text-soft text-[9px] cursor-pointer ' +
                                        '[transition:transform_0.12s_ease,color_0.1s] hover:text-ed-text' +
                                        (isOpen ? ' open rotate-90' : '')
                                    }
                                    onClick={() => toggle(node.id)}
                                    aria-label={isOpen ? 'Collapse' : 'Expand'}
                                >
                                    ▸
                                </button>
                            ) : (
                                <span className="category-caret-spacer w-[18px] h-[26px] shrink-0"/>
                            )}
                            <button
                                type="button"
                                className={
                                    'category-name flex items-center gap-2 flex-1 min-w-0 h-[26px] px-1.5 border-none ' +
                                    'bg-transparent text-left text-[12px] cursor-pointer ' +
                                    (selected ? 'text-ed-primary font-semibold' : 'text-ed-text')
                                }
                                onClick={() => onPick(node)}
                            >
                                <span className="category-name-text flex-1 min-w-0 truncate">{node.name}</span>
                                <span className="category-id shrink-0 text-[11px] text-ed-text-soft [font-variant-numeric:tabular-nums]">(ID: {node.id})</span>
                            </button>
                        </div>
                        {hasChildren && isOpen && (
                            <CategoryTree
                                nodes={node.children}
                                value={value}
                                onPick={onPick}
                                expanded={expanded}
                                toggle={toggle}
                                expandAll={expandAll}
                            />
                        )}
                    </li>
                );
            })}
        </ul>
    );
}

export function CategoryField({value, onChange}) {
    const [roots, setRoots] = useState(getCachedRoots());
    const [status, setStatus] = useState(getCachedRoots() ? 'ready' : 'idle');
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [expanded, setExpanded] = useState(() => new Set());
    const fieldRef = useRef(null);

    useEffect(() => {
        if (roots) return;
        setStatus('loading');
        let cancelled = false;
        loadCategoryRoots()
            .then((r) => {
                if (!cancelled) {
                    setRoots(r);
                    setStatus('ready');
                }
            })
            .catch(() => {
                if (!cancelled) setStatus('error');
            });
        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        if (!open) return;
        const onDocClick = (e) => {
            if (fieldRef.current?.contains(e.target)) return;
            setOpen(false);
        };
        document.addEventListener('mousedown', onDocClick);
        return () => document.removeEventListener('mousedown', onDocClick);
    }, [open]);

    const toggle = (id) =>
        setExpanded((prev) => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    const pick = (node) => {
        onChange(String(node.id));
        setOpen(false);
    };

    const selectedNode = roots ? findCategory(roots, value) : null;
    const selectedName = selectedNode?.name || null;
    const label = selectedName
        ? `${selectedName} (ID: ${value})`
        : (value ? `Category (ID: ${value})` : 'Select a category…');

    const q = query.trim().toLowerCase();
    const visibleNodes = roots ? (q ? filterTree(roots, q) : roots) : [];

    return (
        <div className="category-field relative" ref={fieldRef}>
            <button
                type="button"
                className={`category-field-trigger${selectedName ? '' : ' is-empty'} flex items-center gap-1.5 w-full h-[30px] px-2 bg-ed-surface border border-solid border-ed-border rounded cursor-pointer [transition:background-color_0.1s,border-color_0.1s] hover:bg-ed-surface hover:border-ed-border-strong`}
                onClick={() => setOpen((o) => !o)}
            >
                <span
                    className={
                        'category-field-value flex-1 min-w-0 text-left text-[12px] truncate ' +
                        (selectedName ? 'text-ed-text' : 'text-ed-text-soft')
                    }
                >{label}</span>
                <span className="category-field-chevron shrink-0 text-[10px] text-ed-text-soft">▾</span>
            </button>
            {open && (
                <div className="category-popup absolute top-[calc(100%+8px)] left-0 right-0 z-[1000] max-h-80 overflow-y-auto p-1.5 bg-ed-surface border border-solid border-ed-border rounded shadow-[0_12px_32px_rgba(0,0,0,0.14),0_2px_6px_rgba(0,0,0,0.06)]">
                    <input
                        type="text"
                        className="category-search w-full h-[30px] mb-1.5 px-2 bg-ed-surface border border-solid border-ed-border rounded text-[12px] text-ed-text outline-none [transition:background-color_0.1s,border-color_0.1s] placeholder:text-ed-text-soft focus:bg-ed-surface focus:border-ed-primary"
                        placeholder="Search by name…"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        autoFocus
                    />
                    {status === 'loading' && <div className="category-popup-note px-2 py-2.5 text-[12px] text-ed-text-soft text-center">Loading categories…</div>}
                    {status === 'error' && <div className="category-popup-note px-2 py-2.5 text-[12px] text-ed-text-soft text-center">Couldn’t load categories.</div>}
                    {status === 'ready' && visibleNodes.length > 0 && (
                        <CategoryTree
                            nodes={visibleNodes}
                            value={value}
                            onPick={pick}
                            expanded={expanded}
                            toggle={toggle}
                            expandAll={!!q}
                        />
                    )}
                    {status === 'ready' && visibleNodes.length === 0 && (
                        <div className="category-popup-note px-2 py-2.5 text-[12px] text-ed-text-soft text-center">
                            {q ? 'No categories match.' : 'No categories found.'}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
