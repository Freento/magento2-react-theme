import {UI} from '../../../src/editor/Icon.jsx';
import {fieldOverrideReset} from '../lib/cls.js';
import {sideKeys} from '../lib/spacing.js';

const DEVICE_LABEL = {tablet: 'Tablet', mobile: 'Mobile'};

export const overrideKeysOf = (entry) => {
    if (entry.source === 'style') {
        const s = entry.schema;
        const style = s.type === 'spacing'
            ? [s.key, ...Object.values(sideKeys(s.key))]
            : [...(s.keys || [s.key]), ...(s.inlineNumber ? [s.inlineNumber.key] : [])];
        return {props: [], style};
    }
    const schema = entry.schema || {};
    return {
        props: [entry.key, ...(schema.inlineNumber ? [schema.inlineNumber.key] : [])],
        style: schema.type === 'background' ? ['backgroundColor'] : [],
    };
};

export const isOverridden = (keys, hasOverride) =>
    keys.props.some((k) => hasOverride('props', k)) || keys.style.some((k) => hasOverride('style', k));

export const resetKeys = (keys, resetOverride) => {
    keys.props.forEach((k) => resetOverride('props', k));
    keys.style.forEach((k) => resetOverride('style', k));
};

export function DeviceChip({device}) {
    const name = DEVICE_LABEL[device] || device;
    return (
        <span
            className="device-override-chip inline-flex items-center h-[18px] px-1.5 rounded bg-ed-primary-soft text-ed-primary text-[10.5px] font-semibold leading-none"
            data-tooltip={device === 'mobile' ? 'Changes here apply to mobile only' : 'Changes here apply to tablet and mobile'}
        >
            {name}
        </span>
    );
}

export function DeviceOverrideBadge({device, overridden, onReset}) {
    if (device === 'desktop') return null;
    const name = DEVICE_LABEL[device] || device;
    if (!overridden) return <span className="device-override inline-flex items-center shrink-0"><DeviceChip device={device}/></span>;
    return (
        <span className="device-override inline-flex items-center gap-1 shrink-0">
            <DeviceChip device={device}/>
            <button
                type="button"
                className={fieldOverrideReset}
                data-tooltip={`Remove the ${name.toLowerCase()} value`}
                aria-label={`Remove the ${name.toLowerCase()} value`}
                onClick={onReset}
            >
                <UI.Reset size={12} strokeWidth={2}/>
            </button>
        </span>
    );
}
