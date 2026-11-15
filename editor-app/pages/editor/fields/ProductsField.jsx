import {useEffect, useRef, useState} from 'react';
import {createPortal} from 'react-dom';
import {gql} from '@apollo/client';
import {UI} from '../../../src/editor/Icon.jsx';
import {getClientApolloClient} from '@host/apollo/client';
import {ListEditorField} from './ListEditorField.jsx';
import {fieldInput} from '../lib/cls.js';

const GET_PRODUCTS_BY_SKU = gql`
    query editorProductsBySku($skus: [String!]!, $pageSize: Int!) {
        products(filter: {sku: {in: $skus}}, pageSize: $pageSize) {
            items { sku name }
        }
    }
`;

const SEARCH_PRODUCTS = gql`
    query editorProductSearch($text: String!, $page: Int!) {
        products(search: $text, currentPage: $page, pageSize: 20) {
            items { sku name small_image { url(width: 100) } }
            page_info { current_page total_pages }
        }
    }
`;

function ProductSearch({propKey, taken, onAdd}) {
    const [text, setText] = useState('');
    const [results, setResults] = useState([]);
    const [state, setState] = useState('idle');
    const [pos, setPos] = useState(null);
    const [retry, setRetry] = useState(0);
    const [page, setPage] = useState({current: 0, total: 0, loading: false});
    const queryRef = useRef(0);
    const triggerRef = useRef(null);
    const popRef = useRef(null);
    const inputRef = useRef(null);
    const open = !!pos;
    const place = () => {
        const t = triggerRef.current?.getBoundingClientRect();
        const side = triggerRef.current?.closest?.('.editor-sidebar')?.getBoundingClientRect();
        if (!t) return;
        const height = Math.min(460, window.innerHeight - 16);
        setPos({left: (side ? side.right : t.right) + 8, top: Math.max(8, Math.min(t.top, window.innerHeight - height - 8)), height});
    };
    const fetchPage = (term, n) => getClientApolloClient()
        .query({query: SEARCH_PRODUCTS, variables: {text: term, page: n}, fetchPolicy: 'cache-first'})
        .then((res) => ({items: res.data?.products?.items || [], total: res.data?.products?.page_info?.total_pages || 1}));
    useEffect(() => {
        const term = text.trim();
        const id = ++queryRef.current;
        setPage({current: 0, total: 0, loading: false});
        if (term.length < 2) { setResults([]); setState('idle'); return undefined; }
        setState('loading');
        const t = setTimeout(() => {
            fetchPage(term, 1)
                .then(({items, total}) => {
                    if (id !== queryRef.current) return;
                    setResults(items);
                    setPage({current: 1, total, loading: false});
                    setState('done');
                })
                .catch(() => { if (id === queryRef.current) { setResults([]); setState('error'); } });
        }, 300);
        return () => clearTimeout(t);
    }, [text, retry]);
    const loadMore = () => {
        if (state !== 'done' || page.loading || page.current >= page.total) return;
        const id = queryRef.current;
        const next = page.current + 1;
        setPage((p) => ({...p, loading: true}));
        fetchPage(text.trim(), next)
            .then(({items, total}) => {
                if (id !== queryRef.current) return;
                setResults((prev) => {
                    const seen = new Set(prev.map((p) => p.sku));
                    return [...prev, ...items.filter((p) => !seen.has(p.sku))];
                });
                setPage({current: next, total, loading: false});
            })
            .catch(() => { if (id === queryRef.current) setPage((p) => ({...p, loading: false})); });
    };
    useEffect(() => {
        const onOpen = (e) => {
            if (e.detail?.key !== propKey) return;
            if (pos && triggerRef.current === e.detail.anchor) { setPos(null); return; }
            triggerRef.current = e.detail.anchor;
            place();
        };
        window.addEventListener('editor:product-search', onOpen);
        return () => window.removeEventListener('editor:product-search', onOpen);
    });
    useEffect(() => {
        if (!open) return undefined;
        inputRef.current?.focus();
        const close = (e) => {
            if (popRef.current?.contains(e.target) || triggerRef.current?.contains(e.target)) return;
            setPos(null);
        };
        const key = (e) => { if (e.key === 'Escape') setPos(null); };
        window.addEventListener('resize', place);
        document.addEventListener('mousedown', close);
        document.addEventListener('keydown', key);
        return () => {
            window.removeEventListener('resize', place);
            document.removeEventListener('mousedown', close);
            document.removeEventListener('keydown', key);
        };
    }, [open]);
    return (
        <>
            {open && createPortal(
                <div
                    ref={popRef}
                    role="dialog"
                    aria-label="Add products"
                    className="product-search fixed z-[2000] w-[360px] flex flex-col bg-ed-surface border border-solid border-ed-border rounded-lg shadow-[0_12px_32px_rgba(0,0,0,0.14),0_2px_6px_rgba(0,0,0,0.06)] overflow-hidden"
                    style={{left: pos.left, top: pos.top, height: pos.height}}
                >
                    <div className="flex items-center gap-2 pl-3.5 pr-2 h-11 shrink-0 border-0 border-b border-solid border-ed-border">
                        <span className="flex-1 text-[13px] font-semibold text-ed-text">Add products</span>
                        <button
                            type="button"
                            className="w-7 h-7 inline-flex items-center justify-center rounded border-none bg-transparent cursor-pointer text-[#424242] hover:bg-ed-surface-hover hover:text-ed-text"
                            aria-label="Close"
                            data-tooltip="Close"
                            onClick={() => setPos(null)}
                        >
                            <UI.Close size={16} strokeWidth={2}/>
                        </button>
                    </div>
                    <div className="p-3 shrink-0">
                        <label className="flex items-center gap-2 h-9 px-2.5 bg-ed-surface border border-solid border-ed-border rounded text-[#424242] cursor-text [transition:border-color_0.1s,box-shadow_0.1s] hover:border-ed-border-strong focus-within:border-ed-primary focus-within:shadow-[0_0_0_2px_rgba(15,76,92,0.18)]">
                            <UI.Search size={15} strokeWidth={2} className="shrink-0"/>
                            <input
                                ref={inputRef}
                                className="flex-1 min-w-0 h-full p-0 border-none outline-none bg-transparent [font-family:inherit] text-[13px] text-ed-text placeholder:text-[#6b6b6b] focus-visible:outline-none"
                                type="text"
                                placeholder="Product name or SKU"
                                value={text}
                                onChange={(e) => setText(e.target.value)}
                            />
                            {text && (
                                <button
                                    type="button"
                                    className="w-6 h-6 -mr-1 shrink-0 inline-flex items-center justify-center rounded-full border-none bg-transparent cursor-pointer text-[#424242] hover:bg-ed-surface-hover hover:text-ed-text"
                                    aria-label="Clear search"
                                    data-tooltip="Clear search"
                                    onClick={() => { setText(''); inputRef.current?.focus(); }}
                                >
                                    <UI.Close size={14} strokeWidth={2}/>
                                </button>
                            )}
                        </label>
                    </div>
                    <div
                        className="flex-1 min-h-0 overflow-auto pb-1.5"
                        onScroll={(e) => {
                            const el = e.currentTarget;
                            if (el.scrollHeight - el.scrollTop - el.clientHeight < 120) loadMore();
                        }}
                    >
                        {state === 'idle' && (
                            <div className="h-full flex flex-col items-center justify-center gap-2 px-6 text-center text-[12px] text-[#424242]">
                                <UI.Search size={22} strokeWidth={1.75} className="text-ed-text-soft"/>
                                Search by product name or SKU
                            </div>
                        )}
                        {state === 'loading' && (
                            <div aria-busy="true" aria-label="Searching">
                                {[72, 56, 84, 64, 48, 76].map((w, i) => (
                                    <div key={i} className="flex items-center gap-2.5 px-3 py-2">
                                        <span className="w-10 h-10 shrink-0 rounded bg-[#E2E2DE] animate-pulse"/>
                                        <span className="flex-1 min-w-0 flex flex-col gap-1.5">
                                            <span className="block h-2.5 rounded bg-[#E2E2DE] animate-pulse" style={{width: `${w}%`}}/>
                                            <span className="block h-2 w-1/3 rounded bg-[#E2E2DE] animate-pulse"/>
                                        </span>
                                        <span className="w-12 h-7 shrink-0 rounded bg-[#E2E2DE] animate-pulse"/>
                                    </div>
                                ))}
                            </div>
                        )}
                        {state === 'error' && (
                            <div className="h-full flex flex-col items-center justify-center gap-2.5 px-6 text-center text-[12px] text-[#424242]">
                                Couldn't load products
                                <button
                                    type="button"
                                    className="h-7 px-3 rounded border border-solid border-ed-border bg-ed-surface text-[12px] font-medium text-ed-text cursor-pointer hover:border-ed-primary hover:text-ed-primary"
                                    onClick={() => setRetry((n) => n + 1)}
                                >
                                    Try again
                                </button>
                            </div>
                        )}
                        {state === 'done' && results.length === 0 && (
                            <div className="h-full flex items-center justify-center px-6 text-center text-[12px] text-[#424242]">
                                No products match “{text.trim()}”
                            </div>
                        )}
                        {state === 'done' && results.map((p) => {
                            const added = taken.has(p.sku);
                            return (
                                <div key={p.sku} className="flex items-center gap-2.5 px-3 py-2 hover:bg-ed-surface-hover">
                                    {p.small_image?.url
                                        ? <img src={p.small_image.url} alt="" className="w-10 h-10 shrink-0 rounded object-contain bg-white border border-solid border-ed-border"/>
                                        : <span className="w-10 h-10 shrink-0 rounded bg-ed-surface-hover"/>}
                                    <span className="flex-1 min-w-0">
                                        <span className="block text-[12px] leading-[1.35] text-ed-text line-clamp-2">{p.name}</span>
                                        <span className="block mt-0.5 text-[11px] text-[#424242] truncate">{p.sku}</span>
                                    </span>
                                    {added ? (
                                        <span className="h-7 px-2 shrink-0 inline-flex items-center gap-1 text-[12px] font-medium text-ed-primary">
                                            <UI.Check size={14} strokeWidth={2.25}/> Added
                                        </span>
                                    ) : (
                                        <button
                                            type="button"
                                            className="h-7 px-3 shrink-0 rounded border border-solid border-ed-primary bg-ed-surface text-[12px] font-medium text-ed-primary cursor-pointer [transition:background-color_0.1s,color_0.1s] hover:bg-ed-primary hover:text-white"
                                            onClick={() => onAdd(p.sku)}
                                        >
                                            Add
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                        {state === 'done' && page.loading && [64, 48].map((w, i) => (
                            <div key={`more-${i}`} className="flex items-center gap-2.5 px-3 py-2" aria-hidden="true">
                                <span className="w-10 h-10 shrink-0 rounded bg-[#E2E2DE] animate-pulse"/>
                                <span className="flex-1 min-w-0 flex flex-col gap-1.5">
                                    <span className="block h-2.5 rounded bg-[#E2E2DE] animate-pulse" style={{width: `${w}%`}}/>
                                    <span className="block h-2 w-1/3 rounded bg-[#E2E2DE] animate-pulse"/>
                                </span>
                                <span className="w-12 h-7 shrink-0 rounded bg-[#E2E2DE] animate-pulse"/>
                            </div>
                        ))}
                    </div>
                    <div className="flex items-center justify-end px-3 h-12 shrink-0 border-0 border-t border-solid border-ed-border">
                        <button
                            type="button"
                            className="h-8 px-4 rounded border-none bg-ed-primary text-white text-[12.5px] font-semibold cursor-pointer hover:bg-ed-primary-dark"
                            onClick={() => setPos(null)}
                        >
                            Done
                        </button>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
}

// Session cache of sku -> product name. A stored `null` means "looked up, not
// found" so we can tell the user and don't keep refetching unknown SKUs.
const nameCache = new Map();

// Resolve names for the current SKUs. Lookups are debounced so typing a SKU
// character-by-character fires one batched request after a pause (and doesn't
// flash "not found" mid-typing). Returns a resolver: sku -> lookup state.
function useProductNames(skus) {
    const [, force] = useState(0);
    const missingKey = skus.filter((s) => s && !nameCache.has(s)).join(',');
    const [debouncedKey, setDebouncedKey] = useState(missingKey);

    useEffect(() => {
        const t = setTimeout(() => setDebouncedKey(missingKey), 400);
        return () => clearTimeout(t);
    }, [missingKey]);

    useEffect(() => {
        const toFetch = debouncedKey ? debouncedKey.split(',').filter((s) => !nameCache.has(s)) : [];
        if (!toFetch.length) return;
        let cancelled = false;
        getClientApolloClient()
            .query({
                query: GET_PRODUCTS_BY_SKU,
                variables: {skus: toFetch, pageSize: toFetch.length},
                fetchPolicy: 'cache-first',
            })
            .then((res) => {
                (res.data?.products?.items || []).forEach((p) => nameCache.set(p.sku, p.name));
                // Anything the server didn't return doesn't exist → mark as not found.
                toFetch.forEach((s) => {
                    if (!nameCache.has(s)) nameCache.set(s, null);
                });
                if (!cancelled) force((n) => n + 1);
            })
            .catch(() => {
                // Leave un-cached on network error so it stays "loading" (shows the
                // raw SKU) rather than falsely reporting "not found".
            });
        return () => {
            cancelled = true;
        };
    }, [debouncedKey]);

    return (sku) => {
        if (!nameCache.has(sku)) return {state: 'loading'};
        const name = nameCache.get(sku);
        return name ? {state: 'found', name} : {state: 'missing'};
    };
}

export function ProductsField(props) {
    const {selectedBlock, propKey} = props;
    const items = selectedBlock.props[propKey] || [];
    const skus = items.map((it) => it?.sku).filter(Boolean);
    const resolve = useProductNames(skus);

    const getItemPreview = (item) => {
        const sku = item?.sku;
        if (!sku) return null;
        const info = resolve(sku);
        return (
            <>
                {info.state === 'found' && <span className="block text-[12px] font-medium text-ed-text truncate" data-tooltip={info.name}>{info.name}</span>}
                {info.state === 'missing' && <span className="block text-[12px] font-medium text-ed-danger truncate">Product not found</span>}
                {info.state === 'loading' && <span className="block h-2.5 my-[3px] w-3/4 rounded bg-[#E2E2DE] animate-pulse"/>}
                <span className="block mt-0.5 text-[11px] text-[#424242] truncate">SKU: {sku}</span>
            </>
        );
    };

    const add = (sku) => {
        if (skus.includes(sku)) return;
        nameCache.delete(sku);
        props.updateBlockProp(selectedBlock.id, propKey, [...items, {sku}]);
    };
    return (
        <>
            <ProductSearch propKey={propKey} taken={new Set(skus)} onAdd={add}/>
            {items.length ? (
                <ListEditorField {...props} getItemPreview={getItemPreview} readOnly/>
            ) : (
                <div className="products-empty flex flex-col items-start gap-2.5 p-3 rounded bg-ed-bg border border-solid border-ed-border">
                    <p className="m-0 text-[12px] leading-[1.45] text-[#424242]">Add products from your catalog to feature on this page.</p>
                    <button
                        type="button"
                        className="h-7 px-3 rounded border border-solid border-ed-primary bg-ed-surface text-[12px] font-medium text-ed-primary cursor-pointer [transition:background-color_0.1s,color_0.1s] hover:bg-ed-primary hover:text-white"
                        onClick={(e) => window.dispatchEvent(new CustomEvent('editor:product-search', {detail: {key: propKey, anchor: e.currentTarget.closest('.field')?.querySelector('.btn-add-item') || e.currentTarget}}))}
                    >
                        Add product
                    </button>
                </div>
            )}
        </>
    );
}
