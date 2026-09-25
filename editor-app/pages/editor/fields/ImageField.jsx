import {useRef, useState} from 'react';
import {UI} from '../../../src/editor/Icon.jsx';

export function ImageField({value, onChange}) {
    const inputRef = useRef(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');

    const pick = () => inputRef.current?.click();

    const handleFile = async (e) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file) return;
        setError('');
        const ext = (file.name.match(/\.[^.]+$/)?.[0] || '').toLowerCase();
        const allowed = ['.avif', '.webp'];
        if (!allowed.includes(ext)) {
            setError(`Only AVIF or WebP allowed — "${file.name}" is ${ext || 'unknown'}.`);
            return;
        }
        setUploading(true);
        try {
            const fd = new FormData();
            fd.append('file', file);
            const res = await fetch('/api/editor/upload', {method: 'POST', body: fd});
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Upload failed');
            }
            const {url} = await res.json();
            onChange(url);
        } catch (err) {
            setError(err.message || 'Upload failed');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="flex flex-col gap-2">
            <div
                className="group relative w-full h-[110px] border border-dashed border-e-dashed rounded-e bg-e-code-bg-soft cursor-pointer overflow-hidden flex items-center justify-center transition-colors duration-100 hover:border-e-primary hover:bg-e-primary-soft"
                onClick={pick}
                title="Upload image"
            >
                {value ? (
                    <img src={value} alt="" className="max-w-full max-h-full object-contain block"/>
                ) : (
                    <span className="text-e-muted-2 text-[12px] font-medium inline-flex items-center gap-1.5 group-hover:text-e-primary">
            <UI.Plus size={18} strokeWidth={2}/>
            Upload
          </span>
                )}
            </div>
            <div className="flex flex-col gap-1.5">
                <div className="flex gap-1.5">
                    <button type="button"
                            className="flex-1 h-[30px] border border-e-dashed bg-e-surface text-e-text rounded-e text-[12.5px] font-medium cursor-pointer transition-all duration-100 inline-flex items-center justify-center gap-1.5 disabled:opacity-60 disabled:cursor-default enabled:hover:border-e-primary enabled:hover:text-e-primary enabled:hover:bg-e-primary-soft"
                            onClick={pick} disabled={uploading}>
                        {uploading ? 'Uploading…' : (value ? 'Replace' : 'Choose file')}
                    </button>
                    {value && (
                        <button
                            type="button"
                            className="flex-none w-[30px] h-[30px] p-0 border border-e-dashed bg-e-surface text-e-text rounded-e text-[12.5px] font-medium cursor-pointer transition-all duration-100 inline-flex items-center justify-center gap-1.5 disabled:opacity-60 disabled:cursor-default enabled:hover:bg-e-danger-soft enabled:hover:border-e-danger-border enabled:hover:text-e-danger"
                            onClick={() => onChange('')}
                            title="Clear"
                        >
                            <UI.Close size={14} strokeWidth={2}/>
                        </button>
                    )}
                </div>
                <input
                    className="field-input !h-7 text-[12px] !font-['SF_Mono',ui-monospace,Menlo,monospace]"
                    type="text"
                    placeholder="or paste URL"
                    value={value || ''}
                    onChange={(e) => onChange(e.target.value)}
                />
                <div className="text-[11px] text-e-text-muted mt-0.5">Allowed formats: AVIF, WebP</div>
                {error && <div className="text-[11.5px] text-e-danger bg-e-danger-soft rounded-e px-1.5 py-1">{error}</div>}
            </div>
            <input
                ref={inputRef}
                type="file"
                accept=".avif,.webp,image/avif,image/webp"
                style={{display: 'none'}}
                onChange={handleFile}
            />
        </div>
    );
}
