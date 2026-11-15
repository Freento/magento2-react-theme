import {useRef, useState} from 'react';
import {useLinkSuggest, LinkSuggestList} from 'editor-core/components/LinkSuggest';

export function LinkField({value, placeholder, onChange, className}) {
    const [open, setOpen] = useState(false);
    const inputRef = useRef(null);
    const suggest = useLinkSuggest(value, open);
    const pick = (path) => {
        onChange(path);
        setOpen(false);
    };
    return (
        <div className="link-field relative">
            <input
                ref={inputRef}
                className={className}
                type="text"
                value={value}
                placeholder={placeholder}
                onFocus={() => setOpen(true)}
                onBlur={() => setOpen(false)}
                onChange={(e) => { onChange(e.target.value); setOpen(true); }}
                onKeyDown={(e) => {
                    if (suggest.onKeyDown(e, pick)) return;
                    if (e.key === 'Escape') setOpen(false);
                }}
            />
            <LinkSuggestList {...suggest} onPick={pick} className="absolute left-0 right-0 top-[calc(100%+4px)] z-30"/>
        </div>
    );
}
