import {useState, useRef, useEffect} from 'react';
import {UI} from '../../../src/editor/Icon.jsx';
import {btnSaveCore, fieldInput, fieldLabel} from '../lib/cls.js';

const MENU_WIDTH = 168;

function copyDefaults(page, pages) {
    const taken = new Set(pages.map((p) => p.path));
    const base = page.path === '/' ? '/home-copy' : `${page.path.replace(/\/+$/, '')}-copy`;
    let path = base;
    let i = 2;
    while (taken.has(path)) path = `${base}-${i++}`;
    return {title: `Copy of ${page.title}`, path};
}

const menuItem =
    'page-menu-item w-full flex items-center gap-2 px-2.5 h-[30px] text-[12.5px] text-left bg-transparent border-none ' +
    'rounded cursor-pointer [transition:background_0.08s] text-ed-text hover:bg-ed-surface-hover [&>svg]:shrink-0 ' +
    '[&>svg]:text-ed-text-soft';
const menuItemDanger =
    'page-menu-item danger w-full flex items-center gap-2 px-2.5 h-[30px] text-[12.5px] text-left bg-transparent ' +
    'border-none rounded cursor-pointer [transition:background_0.08s] text-ed-danger hover:bg-ed-danger-soft ' +
    '[&>svg]:shrink-0';
const addBtn =
    'page-select-add w-full h-[34px] px-3 border-0 border-t border-solid border-ed-border bg-ed-bg text-ed-primary ' +
    'text-[12.5px] font-medium cursor-pointer text-left [transition:background_0.08s] flex items-center gap-2 ' +
    'enabled:hover:bg-ed-primary-soft disabled:text-ed-text-soft disabled:cursor-not-allowed';
const cancelBtn =
    'btn-icon inline-flex items-center justify-center w-auto px-3 h-[30px] text-[12.5px] text-ed-text-muted rounded ' +
    'bg-transparent border-none cursor-pointer [transition:all_0.1s] hover:bg-ed-surface-hover hover:text-ed-text';
const errorBox = 'page-select-error text-[11.5px] text-ed-danger bg-ed-danger-soft rounded px-2 py-[5px] whitespace-pre-wrap';
const groupTitle = 'page-select-group px-2.5 pt-2 pb-1 text-[10px] font-semibold tracking-[0.08em] uppercase text-ed-text-soft';

export function PageSelect({
                               pages,
                               currentPageId,
                               onChange,
                               onCreate,
                               onUpdate,
                               onDuplicate,
                               onToggleHidden,
                               onDelete,
                               onCreateRoute,
                               onSelectGlobal,
                               actionsDisabled = false,
                               actionsTooltip = null,
                           }) {
    const [open, setOpen] = useState(false);
    const [form, setForm] = useState(null);
    const [menu, setMenu] = useState(null);
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);
    const [query, setQuery] = useState('');
    const searchRef = useRef(null);
    const [sortDesc, setSortDesc] = useState(false);
    const rootRef = useRef(null);

    const closeAll = () => {
        setOpen(false);
        setForm(null);
        setMenu(null);
        setError('');
        setQuery('');
    };

    useEffect(() => {
        if (open && !form) searchRef.current?.focus();
    }, [open, form]);

    useEffect(() => {
        function onDocClick(e) {
            if (rootRef.current && !rootRef.current.contains(e.target)) closeAll();
        }

        document.addEventListener('mousedown', onDocClick);
        return () => document.removeEventListener('mousedown', onDocClick);
    }, []);

    const current = pages.find((p) => p.id === currentPageId);
    const isGlobalBlock = (p) => p.id.startsWith('__');
    const isRoute = (p) => p.kind === 'route';
    const q = query.trim().toLowerCase();
    const matches = (p) => !q || (p.title || '').toLowerCase().includes(q) || (p.path || '').toLowerCase().includes(q);
    const byTitle = (a, b) => {
        const cmp = (a.title || '').localeCompare(b.title || '');
        return sortDesc ? -cmp : cmp;
    };
    const visiblePages = pages
        .filter((p) => !isRoute(p) && (!isGlobalBlock(p) || p.id === '__maintenance__'))
        .filter(matches)
        .slice()
        .sort((a, b) => {
            if (a.path === '/') return -1;
            if (b.path === '/') return 1;
            return byTitle(a, b);
        });
    const routePages = pages.filter(isRoute).filter(matches).slice().sort(byTitle);
    const globalBlocks = pages
        .filter((p) => isGlobalBlock(p) && p.id !== '__maintenance__')
        .filter(matches)
        .slice()
        .sort((a, b) => (a.title || a.id).localeCompare(b.title || b.id));
    const nothingMatches = q && !visiblePages.length && !routePages.length && !globalBlocks.length;
    const canView = (p) => !p.hidden && !isGlobalBlock(p);
    const disabledTooltip = actionsDisabled && actionsTooltip ? actionsTooltip : undefined;

    const openMenu = (e, page) => {
        e.stopPropagation();
        if (menu?.id === page.id) {
            setMenu(null);
            return;
        }
        const rect = e.currentTarget.getBoundingClientRect();
        setMenu({id: page.id, top: rect.bottom + 4, left: Math.max(8, rect.right - MENU_WIDTH)});
    };

    const submit = async () => {
        if (!form || busy) return;
        setError('');
        setBusy(true);
        let res;
        try {
            if (form.mode === 'route') {
                res = await onCreateRoute(form.path.trim());
            } else {
                const title = form.title.trim();
                const path = form.path.trim();
                if (form.mode === 'create') res = await onCreate({title, path});
                else if (form.mode === 'duplicate') res = await onDuplicate(form.id, {title, path});
                else res = await onUpdate(form.id, {title, path, hidden: !!form.hidden});
            }
        } finally {
            setBusy(false);
        }
        if (res && res.error) {
            setError(res.error);
            return;
        }
        closeAll();
    };

    const formTitle = {create: 'New page', edit: 'Page settings', duplicate: 'Duplicate page'}[form?.mode];
    const submitLabel = {create: 'Create', edit: 'Save', duplicate: 'Duplicate'}[form?.mode];
    const busyLabel = form?.mode === 'route' ? 'Checking…' : 'Working…';
    const menuPage = menu ? visiblePages.find((p) => p.id === menu.id) : null;

    const renderOption = (p, meta, withActions = false) => {
        const active = p.id === currentPageId;
        return (
            <div
                key={p.id}
                className={
                    'page-select-row flex items-center gap-1 rounded ' +
                    (active ? 'active bg-ed-surface-hover' : 'hover:bg-ed-surface-hover')
                }
            >
                <button
                    type="button"
                    className={
                        'page-select-option flex-1 min-w-0 text-left flex items-center justify-between gap-2 ' +
                        'px-2.5 py-[7px] bg-transparent border-none rounded cursor-pointer text-[13px] ' +
                        (active ? 'text-ed-primary' : 'text-ed-text')
                    }
                    onClick={() => {
                        if (isGlobalBlock(p) && p.id !== '__maintenance__' && onSelectGlobal) onSelectGlobal(p.id);
                        else onChange(p.id);
                        closeAll();
                    }}
                >
                    <span className="page-select-option-title font-medium truncate flex items-center gap-1.5">
                        {p.hidden && (
                            <span className="page-select-option-hidden inline-flex text-ed-text-soft" data-tooltip="Hidden">
                                <UI.EyeOff size={13} strokeWidth={1.75}/>
                            </span>
                        )}
                        <span className="truncate">{p.title}</span>
                    </span>
                    <span
                        className={
                            'page-select-option-path text-[11px] font-ed-mono truncate shrink-0 max-w-[50%] ml-2 ' +
                            (active ? 'text-ed-primary opacity-80' : 'text-ed-text-soft')
                        }
                    >{meta}</span>
                </button>
                {withActions && (
                    <span className="inline-flex mr-1 shrink-0" data-tooltip={disabledTooltip}>
                        <button
                            type="button"
                            className="page-select-option-menu w-6 h-6 shrink-0 inline-flex items-center justify-center border-none bg-transparent text-ed-text-soft rounded cursor-pointer [transition:all_0.1s] enabled:hover:bg-ed-bg enabled:hover:text-ed-text disabled:opacity-35 disabled:cursor-not-allowed"
                            data-tooltip={actionsDisabled ? undefined : 'Page actions'}
                            aria-label={actionsDisabled && actionsTooltip ? `Actions for ${p.title} - ${actionsTooltip}` : `Actions for ${p.title}`}
                            disabled={actionsDisabled}
                            onClick={(e) => openMenu(e, p)}
                        >
                            <UI.More size={14} strokeWidth={2}/>
                        </button>
                    </span>
                )}
            </div>
        );
    };

    return (
        <div className="page-select relative flex-1 min-w-0" ref={rootRef}>
            <button
                type="button"
                className="page-select-trigger w-full h-8 flex items-center justify-between gap-2 px-2.5 text-[13px] border border-solid border-ed-border rounded bg-ed-surface text-ed-text cursor-pointer text-left [transition:border-color_0.1s,box-shadow_0.1s] hover:border-ed-border-strong focus:outline-none focus:border-ed-primary focus:shadow-[0_0_0_3px_rgba(15,76,92,0.12)]"
                onClick={() => {
                    setOpen((v) => !v);
                    setForm(null);
                    setMenu(null);
                }}
            >
                <span className="page-select-label truncate flex-1 min-w-0">{current?.title || '—'}</span>
                {current?.hidden && (
                    <span className="page-select-trigger-hidden text-ed-text-soft inline-flex shrink-0" data-tooltip="Hidden page">
                        <UI.EyeOff size={13} strokeWidth={1.75}/>
                    </span>
                )}
                <span className="page-select-chevron text-ed-text-soft inline-flex shrink-0">
                    <UI.ChevronDown size={14} strokeWidth={2}/>
                </span>
            </button>
            {open && (
                <div className="page-select-menu absolute top-[calc(100%+4px)] left-0 min-w-80 max-w-[min(480px,90vw)] w-max bg-ed-surface border border-solid border-ed-border rounded-lg shadow-ed-pop z-50 overflow-hidden">
                    {!form && (
                        <>
                            <div className="page-select-tools border-0 border-b border-solid border-ed-border bg-ed-bg">
                                <label className="flex items-center gap-2 h-[34px] px-3 cursor-text">
                                    <span className="inline-flex shrink-0 text-ed-text-soft"><UI.Search size={14} strokeWidth={1.75}/></span>
                                    <input
                                        ref={searchRef}
                                        className="flex-1 min-w-0 h-full border-0 outline-none bg-transparent [font-family:inherit] text-[13px] text-ed-text placeholder:text-ed-text-soft"
                                        type="text"
                                        placeholder="Search pages"
                                        value={query}
                                        onChange={(e) => { setQuery(e.target.value); setMenu(null); }}
                                        onKeyDown={(e) => { if (e.key === 'Escape' && query) { e.stopPropagation(); setQuery(''); } }}
                                    />
                                    {query && (
                                        <button
                                            type="button"
                                            className="inline-flex items-center justify-center w-5 h-5 shrink-0 border-none bg-transparent text-ed-text-soft rounded cursor-pointer hover:text-ed-text"
                                            onClick={() => setQuery('')}
                                            aria-label="Clear search"
                                        >
                                            <UI.Close size={13} strokeWidth={2}/>
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        className="inline-flex items-center justify-center w-7 h-7 shrink-0 border border-solid border-transparent bg-transparent text-ed-text-soft rounded cursor-pointer [transition:all_0.1s] hover:bg-ed-surface-hover hover:text-ed-text hover:border-ed-border"
                                        onMouseDown={(e) => e.preventDefault()}
                                        onClick={() => setSortDesc((v) => !v)}
                                        data-tooltip={sortDesc ? 'Sorted by title, Z to A' : 'Sorted by title, A to Z'}
                                        aria-label={sortDesc ? 'Sorted by title, Z to A' : 'Sorted by title, A to Z'}
                                    >
                                        <UI.Sort size={14} strokeWidth={1.75}/>
                                    </button>
                                </label>
                            </div>
                            <div
                                className="page-select-list max-h-[min(65vh,560px)] overflow-auto p-1"
                                onScroll={() => setMenu(null)}
                            >
                                {nothingMatches && (
                                    <div className="px-2.5 py-3 text-[12.5px] text-ed-text-muted">No pages match “{query.trim()}”.</div>
                                )}
                                {visiblePages.map((p) => renderOption(p, p.path, !isGlobalBlock(p)))}
                                {routePages.length > 0 && (
                                    <div className="page-select-routes mt-1 pt-1 border-0 border-t border-solid border-ed-border">
                                        <div className={groupTitle}>Storefront pages</div>
                                        {routePages.map((p) => renderOption(p, p.path))}
                                    </div>
                                )}
                                {globalBlocks.length > 0 && (
                                    <div className="page-select-globals mt-1 pt-1 border-0 border-t border-solid border-ed-border">
                                        <div className={groupTitle}>Global blocks</div>
                                        {globalBlocks.map((p) => renderOption(p, 'global block'))}
                                    </div>
                                )}
                            </div>
                            <span className="block" data-tooltip={disabledTooltip}>
                                <button
                                    type="button"
                                    className={addBtn}
                                    disabled={actionsDisabled}
                                    aria-label={actionsDisabled && actionsTooltip ? `New page - ${actionsTooltip}` : undefined}
                                    onClick={() => {
                                        setMenu(null);
                                        setError('');
                                        setForm({mode: 'create', id: null, title: '', path: '/', hidden: false});
                                    }}
                                >
                                    <UI.Plus size={14} strokeWidth={2}/> New page
                                </button>
                            </span>
                            {onCreateRoute && (
                                <span className="block" data-tooltip={disabledTooltip}>
                                    <button
                                        type="button"
                                        className={addBtn}
                                        disabled={actionsDisabled}
                                        aria-label={actionsDisabled && actionsTooltip ? `Storefront page by URL - ${actionsTooltip}` : undefined}
                                        onClick={() => {
                                            setMenu(null);
                                            setError('');
                                            setForm({mode: 'route', id: null, title: '', path: ''});
                                        }}
                                    >
                                        <UI.Plus size={14} strokeWidth={2}/> Storefront page by URL
                                    </button>
                                </span>
                            )}
                        </>
                    )}
                    {form?.mode === 'route' && (
                        <div className="page-select-form p-3 flex flex-col gap-2">
                            <label className={fieldLabel}>URL on the storefront</label>
                            <input
                                className={fieldInput}
                                autoFocus
                                value={form.path}
                                placeholder="/gear.html"
                                onChange={(e) => setForm((f) => ({...f, path: e.target.value}))}
                                onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
                            />
                            <div className="text-[11.5px] leading-[1.45] text-ed-text-muted">
                                Magento is asked what lives at this URL. Category pages can take blocks;
                                products and CMS pages cannot yet.
                            </div>
                            {error && <div className={errorBox}>{error}</div>}
                            <div className="page-select-form-actions flex justify-end gap-1.5 mt-0.5">
                                <button type="button" className={cancelBtn} onClick={() => { setForm(null); setError(''); }}>Cancel</button>
                                <button type="button" className={`${btnSaveCore} h-[30px] px-3.5`} onClick={submit} disabled={busy}>
                                    {busy ? busyLabel : 'Open'}
                                </button>
                            </div>
                        </div>
                    )}
                    {form && form.mode !== 'route' && (
                        <div className="page-select-form p-3 flex flex-col gap-2">
                            <div className="page-select-form-title text-[12.5px] font-semibold text-ed-text mb-0.5">{formTitle}</div>
                            <label className={fieldLabel}>Title</label>
                            <input
                                className={fieldInput}
                                autoFocus
                                value={form.title}
                                placeholder="My new page"
                                onChange={(e) => setForm((f) => ({...f, title: e.target.value}))}
                                onKeyDown={(e) => e.key === 'Enter' && submit()}
                            />
                            <label className={fieldLabel}>Path (URL)</label>
                            <input
                                className={fieldInput}
                                value={form.path}
                                placeholder="/about-us"
                                onChange={(e) => setForm((f) => ({...f, path: e.target.value}))}
                                onKeyDown={(e) => e.key === 'Enter' && submit()}
                            />
                            {form.mode === 'edit' && (
                                <label className="page-select-form-hidden flex items-center gap-2 mt-0.5 text-[12px] text-ed-text cursor-pointer select-none">
                                    <input
                                        type="checkbox"
                                        checked={!!form.hidden}
                                        onChange={(e) => setForm((f) => ({...f, hidden: e.target.checked}))}
                                    />
                                    Hidden
                                </label>
                            )}
                            {error && <div className={errorBox}>{error}</div>}
                            <div className="page-select-form-actions flex justify-end gap-1.5 mt-0.5">
                                <button
                                    type="button"
                                    className={cancelBtn}
                                    onClick={() => {
                                        setForm(null);
                                        setError('');
                                    }}>
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    className={`${btnSaveCore} h-[30px] px-3.5`}
                                    disabled={busy}
                                    onClick={submit}
                                >{busy ? busyLabel : submitLabel}</button>
                            </div>
                        </div>
                    )}
                </div>
            )}
            {menuPage && (
                <div
                    className="page-menu fixed z-[220] p-1 bg-ed-surface border border-solid border-ed-border rounded-lg shadow-ed-pop"
                    style={{top: menu.top, left: menu.left, width: MENU_WIDTH}}
                >
                    <button
                        type="button"
                        className={menuItem}
                        onClick={() => {
                            setMenu(null);
                            setError('');
                            setForm({
                                mode: 'edit',
                                id: menuPage.id,
                                title: menuPage.title,
                                path: menuPage.path,
                                hidden: !!menuPage.hidden,
                            });
                        }}
                    >
                        <UI.Edit size={14} strokeWidth={1.75}/> Edit
                    </button>
                    <button
                        type="button"
                        className={menuItem}
                        onClick={() => {
                            setMenu(null);
                            setError('');
                            setForm({mode: 'duplicate', id: menuPage.id, ...copyDefaults(menuPage, pages)});
                        }}
                    >
                        <UI.Copy size={14} strokeWidth={1.75}/> Duplicate
                    </button>
                    <button
                        type="button"
                        className={menuItem}
                        onClick={() => {
                            setMenu(null);
                            onToggleHidden(menuPage);
                        }}
                    >
                        {menuPage.hidden
                            ? <><UI.Eye size={14} strokeWidth={1.75}/> Show</>
                            : <><UI.EyeOff size={14} strokeWidth={1.75}/> Hide</>}
                    </button>
                    {!menuPage.locked && (
                        <button
                            type="button"
                            className={menuItemDanger}
                            onClick={() => {
                                closeAll();
                                onDelete(menuPage);
                            }}
                        >
                            <UI.Trash size={14} strokeWidth={1.75}/> Delete
                        </button>
                    )}
                    {canView(menuPage) && (
                        <a
                            className={`${menuItem} no-underline`}
                            href={menuPage.path}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => setMenu(null)}
                        >
                            <UI.Eye size={14} strokeWidth={1.75}/> View
                        </a>
                    )}
                </div>
            )}
        </div>
    );
}
