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
        <div className="image-field">
            <div
                className={`image-field-preview${value ? '' : ' empty'}`}
                onClick={pick}
                title="Upload image"
            >
                {value ? (
                    <img src={value} alt=""/>
                ) : (
                    <span className="image-field-placeholder">
            <UI.Plus size={18} strokeWidth={2}/>
            Upload
          </span>
                )}
            </div>
            <div className="image-field-controls">
                <div className="image-field-actions">
                    <button type="button" className="image-field-btn" onClick={pick} disabled={uploading}>
                        {uploading ? 'Uploading…' : (value ? 'Replace' : 'Choose file')}
                    </button>
                    {value && (
                        <button
                            type="button"
                            className="image-field-btn danger"
                            onClick={() => onChange('')}
                            title="Clear"
                        >
                            <UI.Close size={14} strokeWidth={2}/>
                        </button>
                    )}
                </div>
                <input
                    className="field-input image-field-url"
                    type="text"
                    placeholder="or paste URL"
                    value={value || ''}
                    onChange={(e) => onChange(e.target.value)}
                />
                <div className="image-field-hint">Allowed formats: AVIF, WebP</div>
                {error && <div className="image-field-error">{error}</div>}
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
