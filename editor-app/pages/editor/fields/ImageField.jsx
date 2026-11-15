import {useRef, useState} from 'react';
import {UI} from '../../../src/editor/Icon.jsx';
import {fieldInputCore} from '../lib/cls.js';
import {addPendingUpload, pendingFileName, uploadedUrl, validateImageFile} from '../lib/pendingUploads.js';

const imageFieldBtn =
    'image-field-btn h-[30px] border border-solid border-ed-dashed bg-ed-surface rounded text-[12.5px] font-medium ' +
    '[font-family:inherit] cursor-pointer [transition:all_0.1s] inline-flex items-center justify-center gap-1.5 ' +
    'disabled:opacity-60 disabled:cursor-default';

export function ImageField({value, onChange}) {
    const inputRef = useRef(null);
    const [error, setError] = useState('');
    const pendingName = pendingFileName(value);

    const pick = () => inputRef.current?.click();

    const [dragOver, setDragOver] = useState(false);
    const acceptFile = (file) => {
        if (!file) return;
        const invalid = validateImageFile(file);
        setError(invalid);
        if (!invalid) onChange(addPendingUpload(file));
    };
    const handleFile = (e) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        acceptFile(file);
    };
    const onDragOver = (e) => {
        if (![...e.dataTransfer.types].includes('Files')) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
        setDragOver(true);
    };
    const onDrop = (e) => {
        e.preventDefault();
        setDragOver(false);
        acceptFile(e.dataTransfer.files?.[0]);
    };

    return (
        <div className="image-field flex flex-col gap-2">
            <div
                className={`image-field-preview${value ? '' : ' empty'} group relative w-full h-[110px] border border-dashed rounded bg-ed-code-bg-soft cursor-pointer overflow-hidden flex items-center justify-center [transition:border-color_0.1s,background_0.1s] hover:border-ed-primary hover:bg-ed-primary-soft ${dragOver ? 'border-ed-primary bg-ed-primary-soft' : 'border-ed-dashed'}`}
                onClick={pick}
                onDragOver={onDragOver}
                onDragEnter={onDragOver}
                onDragLeave={() => setDragOver(false)}
                onDrop={onDrop}
                data-tooltip="Upload image or drop a file here" aria-label="Upload image"
            >
                {value ? (
                    <img className="max-w-full max-h-full object-contain block" src={value} alt=""/>
                ) : (
                    <span className="image-field-placeholder text-ed-muted-2 text-[12px] font-medium inline-flex items-center gap-1.5 group-hover:text-ed-primary">
            <UI.Plus size={18} strokeWidth={2}/>
            Upload
          </span>
                )}
            </div>
            <div className="image-field-controls flex flex-col gap-1.5">
                <div className="image-field-actions flex gap-1.5">
                    <button
                        type="button"
                        className={`${imageFieldBtn} flex-1 text-ed-text enabled:hover:border-ed-primary enabled:hover:text-ed-primary enabled:hover:bg-ed-primary-soft`}
                        onClick={pick}
                    >
                        {value ? 'Replace' : 'Choose file'}
                    </button>
                    {value && (
                        <button
                            type="button"
                            className={`${imageFieldBtn} danger flex-none w-[30px] p-0 text-ed-text enabled:hover:bg-ed-danger-soft enabled:hover:border-ed-danger-border enabled:hover:text-ed-danger`}
                            onClick={() => onChange('')}
                            data-tooltip="Clear" aria-label="Clear"
                        >
                            <UI.Close size={14} strokeWidth={2}/>
                        </button>
                    )}
                </div>
                <input
                    className={`${fieldInputCore} image-field-url w-full h-7 px-2 font-ed-mono`}
                    type="text"
                    placeholder={pendingName ? `${pendingName} — uploads on Save` : 'or paste URL'}
                    value={pendingName ? '' : uploadedUrl(value) || value || ''}
                    onChange={(e) => onChange(e.target.value)}
                />
                <div className="image-field-hint text-[11px] text-ed-text-muted mt-0.5">Allowed formats: AVIF, WebP</div>
                {error && <div className="image-field-error text-[11.5px] text-ed-danger bg-ed-danger-soft rounded px-1.5 py-1">{error}</div>}
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
