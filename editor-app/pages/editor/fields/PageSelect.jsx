import {useState, useRef, useEffect} from 'react';
import {UI} from '../../../src/editor/Icon.jsx';

export function PageSelect({pages, currentPageId, onChange, onCreate}) {
    const [open, setOpen] = useState(false);
    const [adding, setAdding] = useState(false);
    const [title, setTitle] = useState('');
    const [urlPath, setUrlPath] = useState('/');
    const [error, setError] = useState('');
    const rootRef = useRef(null);

    useEffect(() => {
        function onDocClick(e) {
            if (rootRef.current && !rootRef.current.contains(e.target)) {
                setOpen(false);
                setAdding(false);
                setError('');
            }
        }

        document.addEventListener('mousedown', onDocClick);
        return () => document.removeEventListener('mousedown', onDocClick);
    }, []);

    const current = pages.find((p) => p.id === currentPageId);

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

    return (
        <div className="page-select" ref={rootRef}>
            <button
                type="button"
                className="page-select-trigger"
                onClick={() => {
                    setOpen((v) => !v);
                    setAdding(false);
                }}
            >
                <span className="page-select-label">{current?.title || '—'}</span>
                <span className="page-select-chevron">
          <UI.ChevronDown size={14} strokeWidth={2}/>
        </span>
            </button>
            {open && (
                <div className="page-select-menu">
                    {!adding && (
                        <>
                            <div className="page-select-list">
                                {pages
                                    .filter((p) => !p.id.startsWith('__'))
                                    .slice()
                                    .sort((a, b) => {
                                        if (a.path === '/') return -1;
                                        if (b.path === '/') return 1;
                                        return a.path.localeCompare(b.path);
                                    })
                                    .map((p) => (
                                        <button
                                            key={p.id}
                                            type="button"
                                            className={`page-select-option${p.id === currentPageId ? ' active' : ''}`}
                                            onClick={() => {
                                                onChange(p.id);
                                                setOpen(false);
                                            }}
                                        >
                                            <span className="page-select-option-title">{p.title}</span>
                                            <span className="page-select-option-path">{p.path}</span>
                                        </button>
                                    ))}
                            </div>
                            <button
                                type="button"
                                className="page-select-add"
                                onClick={() => {
                                    setAdding(true);
                                    setError('');
                                }}
                            >
                                <UI.Plus size={14} strokeWidth={2}/> New page
                            </button>
                        </>
                    )}
                    {adding && (
                        <div className="page-select-form">
                            <label className="field-label">Title</label>
                            <input
                                className="field-input"
                                autoFocus
                                value={title}
                                placeholder="My new page"
                                onChange={(e) => setTitle(e.target.value)}
                            />
                            <label className="field-label">Path (URL)</label>
                            <input
                                className="field-input"
                                value={urlPath}
                                placeholder="/about-us"
                                onChange={(e) => setUrlPath(e.target.value)}
                            />
                            {error && <div className="page-select-error">{error}</div>}
                            <div className="page-select-form-actions">
                                <button type="button" className="btn-icon" onClick={() => {
                                    setAdding(false);
                                    setError('');
                                }}>
                                    Cancel
                                </button>
                                <button type="button" className="btn-save" onClick={submit}>Create</button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
