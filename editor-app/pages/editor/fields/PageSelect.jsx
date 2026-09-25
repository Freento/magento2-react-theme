import {useState, useRef, useEffect} from 'react';
import {UI} from '../../../src/editor/Icon.jsx';

export function PageSelect({pages, currentPageId, onChange, onCreate, onCreateRoute, onSelectGlobal}) {
    const [open, setOpen] = useState(false);
    const [adding, setAdding] = useState(false);
    const [addingRoute, setAddingRoute] = useState(false);
    const [busy, setBusy] = useState(false);
    const [title, setTitle] = useState('');
    const [urlPath, setUrlPath] = useState('/');
    const [routePath, setRoutePath] = useState('');
    const [error, setError] = useState('');
    const rootRef = useRef(null);

    const closeForms = () => {
        setAdding(false);
        setAddingRoute(false);
        setError('');
    };

    useEffect(() => {
        function onDocClick(e) {
            if (rootRef.current && !rootRef.current.contains(e.target)) {
                setOpen(false);
                closeForms();
            }
        }

        document.addEventListener('mousedown', onDocClick);
        return () => document.removeEventListener('mousedown', onDocClick);
    }, []);

    const current = pages.find((p) => p.id === currentPageId);
    const isGlobalBlock = (p) => p.id.startsWith('__');
    const isRoute = (p) => p.kind === 'route';
    const regularPages = pages
        .filter((p) => !isGlobalBlock(p) && !isRoute(p))
        .slice()
        .sort((a, b) => {
            if (a.path === '/') return -1;
            if (b.path === '/') return 1;
            return a.path.localeCompare(b.path);
        });
    const routePages = pages
        .filter(isRoute)
        .slice()
        .sort((a, b) => a.path.localeCompare(b.path));
    const globalBlocks = pages
        .filter(isGlobalBlock)
        .slice()
        .sort((a, b) => (a.title || a.id).localeCompare(b.title || b.id));

    const renderOption = (p, meta) => (
        <button
            key={p.id}
            type="button"
            className={`page-select-option w-full text-left flex items-center justify-between gap-2 py-[7px] px-2.5 border-0 bg-transparent rounded-e-sm cursor-pointer text-e-text transition-colors duration-[80ms] text-[13px] hover:bg-e-surface-hover [&.active]:bg-e-surface-sel [&.active]:text-e-primary${p.id === currentPageId ? ' active' : ''}`}
            onClick={() => {
                if (isGlobalBlock(p) && onSelectGlobal) onSelectGlobal(p.id);
                else onChange(p.id);
                setOpen(false);
            }}
        >
            <span className="page-select-option-title font-medium whitespace-nowrap overflow-hidden text-ellipsis">{p.title}</span>
            <span className="page-select-option-path text-[11px] text-e-text-soft font-mono whitespace-nowrap overflow-hidden text-ellipsis flex-shrink-0 max-w-[50%] ml-2 [.page-select-option.active_&]:text-e-primary [.page-select-option.active_&]:opacity-80">{meta}</span>
        </button>
    );

    const submit = async () => {
        setError('');
        const res = await onCreate({title: title.trim(), path: urlPath.trim()});
        if (res && res.error) {
            setError(res.error);
            return;
        }
        setAdding(false);
        setTitle('');
        setUrlPath('/');
        setOpen(false);
    };

    const submitRoute = async () => {
        setError('');
        setBusy(true);
        try {
            const res = await onCreateRoute(routePath.trim());
            if (res && res.error) {
                setError(res.error);
                return;
            }
            setAddingRoute(false);
            setRoutePath('');
            setOpen(false);
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="page-select relative flex-1 min-w-0" ref={rootRef}>
            <button
                type="button"
                className="page-select-trigger w-full h-8 flex items-center justify-between gap-2 px-2.5 text-[13px] border border-e-border rounded-e bg-e-surface text-e-text cursor-pointer text-left transition-[border-color,box-shadow] duration-100 hover:border-e-border-strong focus:outline-none focus:border-e-primary focus:shadow-[0_0_0_3px_rgba(37,99,235,0.12)]"
                onClick={() => {
                    setOpen((v) => !v);
                    setAdding(false);
                }}
            >
                <span className="page-select-label whitespace-nowrap overflow-hidden text-ellipsis flex-1 min-w-0">{current?.title || '—'}</span>
                <span className="page-select-chevron text-e-text-soft inline-flex flex-shrink-0">
          <UI.ChevronDown size={14} strokeWidth={2}/>
        </span>
            </button>
            {open && (
                <div className="page-select-menu absolute top-[calc(100%+4px)] left-0 min-w-[320px] max-w-[min(480px,90vw)] w-max bg-e-surface border border-e-border rounded-e-lg shadow-e-pop z-50 overflow-hidden">
                    {!adding && !addingRoute && (
                        <>
                            <div className="page-select-list max-h-[280px] overflow-auto p-1">
                                {regularPages.map((p) => renderOption(p, p.path))}
                            </div>
                            {routePages.length > 0 && (
                                <div className="page-select-globals px-1 pb-1 border-t border-e-border">
                                    <div className="page-select-group px-2.5 pt-2 pb-1 text-[10px] font-semibold tracking-[0.08em] uppercase text-e-text-soft">Storefront pages</div>
                                    {routePages.map((p) => renderOption(p, p.path))}
                                </div>
                            )}
                            {globalBlocks.length > 0 && (
                                <div className="page-select-globals px-1 pb-1 border-t border-e-border">
                                    <div className="page-select-group px-2.5 pt-2 pb-1 text-[10px] font-semibold tracking-[0.08em] uppercase text-e-text-soft">Global blocks</div>
                                    {globalBlocks.map((p) => renderOption(p, 'global block'))}
                                </div>
                            )}
                            <button
                                type="button"
                                className="page-select-add w-full h-[34px] px-3 border-0 border-t border-e-border bg-e-surface-alt text-e-primary text-[12.5px] font-medium cursor-pointer text-left transition-colors duration-[80ms] flex items-center gap-2 hover:bg-e-primary-soft"
                                onClick={() => {
                                    setAdding(true);
                                    setError('');
                                }}
                            >
                                <UI.Plus size={14} strokeWidth={2}/> New page
                            </button>
                            <button
                                type="button"
                                className="page-select-add w-full h-[34px] px-3 border-0 border-t border-e-border bg-e-surface-alt text-e-primary text-[12.5px] font-medium cursor-pointer text-left transition-colors duration-[80ms] flex items-center gap-2 hover:bg-e-primary-soft"
                                onClick={() => {
                                    setAddingRoute(true);
                                    setError('');
                                }}
                            >
                                <UI.Plus size={14} strokeWidth={2}/> Storefront page by URL
                            </button>
                        </>
                    )}
                    {addingRoute && (
                        <div className="page-select-form p-3 flex flex-col gap-2">
                            <label className="field-label block text-[11.5px] font-normal text-e-text-muted mb-1.5">URL on the storefront</label>
                            <input
                                className="field-input"
                                autoFocus
                                value={routePath}
                                placeholder="/gear.html"
                                onChange={(e) => setRoutePath(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter' && !busy) submitRoute(); }}
                            />
                            <div className="text-[11.5px] leading-[1.45] text-e-text-muted">
                                Magento is asked what lives at this URL. Category pages can take blocks;
                                products and CMS pages cannot yet.
                            </div>
                            {error && <div className="page-select-error text-[11.5px] text-e-danger bg-e-danger-soft rounded-e-sm py-[5px] px-2">{error}</div>}
                            <div className="page-select-form-actions flex justify-end gap-1.5 mt-0.5">
                                <button type="button" className="btn-icon inline-flex items-center justify-center border-0 bg-transparent cursor-pointer transition-all duration-100 w-auto px-3 h-[30px] text-[12.5px] text-e-text-muted rounded-e hover:bg-e-surface-hover hover:text-e-text" onClick={closeForms}>Cancel</button>
                                <button type="button" className="btn-save h-[30px] px-[14px] text-[13px] font-medium border border-transparent rounded-e cursor-pointer transition-all duration-100 text-white bg-e-text inline-flex items-center gap-1.5 whitespace-nowrap enabled:hover:bg-e-text-hover disabled:bg-e-border disabled:text-e-text-soft disabled:cursor-default" onClick={submitRoute} disabled={busy}>
                                    {busy ? 'Checking…' : 'Open'}
                                </button>
                            </div>
                        </div>
                    )}
                    {adding && (
                        <div className="page-select-form p-3 flex flex-col gap-2">
                            <label className="field-label block text-[11.5px] font-normal text-e-text-muted mb-1.5">Title</label>
                            <input
                                className="field-input"
                                autoFocus
                                value={title}
                                placeholder="My new page"
                                onChange={(e) => setTitle(e.target.value)}
                            />
                            <label className="field-label block text-[11.5px] font-normal text-e-text-muted mb-1.5">Path (URL)</label>
                            <input
                                className="field-input"
                                value={urlPath}
                                placeholder="/about-us"
                                onChange={(e) => setUrlPath(e.target.value)}
                            />
                            {error && <div className="page-select-error text-[11.5px] text-e-danger bg-e-danger-soft rounded-e-sm py-[5px] px-2">{error}</div>}
                            <div className="page-select-form-actions flex justify-end gap-1.5 mt-0.5">
                                <button type="button" className="btn-icon inline-flex items-center justify-center border-0 bg-transparent cursor-pointer transition-all duration-100 w-auto px-3 h-[30px] text-[12.5px] text-e-text-muted rounded-e hover:bg-e-surface-hover hover:text-e-text" onClick={() => {
                                    setAdding(false);
                                    setError('');
                                }}>
                                    Cancel
                                </button>
                                <button type="button" className="btn-save h-[30px] px-[14px] text-[13px] font-medium border border-transparent rounded-e cursor-pointer transition-all duration-100 text-white bg-e-text inline-flex items-center gap-1.5 whitespace-nowrap enabled:hover:bg-e-text-hover disabled:bg-e-border disabled:text-e-text-soft disabled:cursor-default" onClick={submit}>Create</button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
