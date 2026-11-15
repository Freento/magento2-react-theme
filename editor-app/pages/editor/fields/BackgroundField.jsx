import {useState} from 'react';
import {ColorField} from './ColorField.jsx';
import {ImageField} from './ImageField.jsx';
import {segmentedWrap, segmentedItem} from '../lib/cls.js';

export function BackgroundField({color, image, onColor, onImage}) {
    const [mode, setMode] = useState(image ? 'image' : color ? 'color' : 'none');
    const pick = (next) => {
        if (next === mode) return;
        setMode(next);
        if (next !== 'image' && image) onImage('');
        if (next !== 'color' && color) onColor('');
    };
    return (
        <div className="background-field flex flex-col gap-2">
            <div className={segmentedWrap} style={{gridTemplateColumns: 'repeat(3, 1fr)'}}>
                <button type="button" className={segmentedItem(mode === 'none')} onClick={() => pick('none')}>None</button>
                <button type="button" className={segmentedItem(mode === 'color')} onClick={() => pick('color')}>Color</button>
                <button type="button" className={segmentedItem(mode === 'image')} onClick={() => pick('image')}>Image</button>
            </div>
            {mode === 'image' && <ImageField value={image} onChange={onImage}/>}
            {mode === 'color' && <ColorField value={color} fallback="#ffffff" onChange={onColor}/>}
        </div>
    );
}
