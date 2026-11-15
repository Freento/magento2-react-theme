import {useEffect, useRef, useState} from 'react';
import {createPortal} from 'react-dom';

const TIP_TARGETS = '.editor-root [data-tooltip], .ec-text-toolbar [data-tooltip], .product-search [data-tooltip]';

export function TooltipLayer() {
    const [tip, setTip] = useState(null);
    const boxRef = useRef(null);
    useEffect(() => {
        let current = null;
        const show = (el) => {
            current = el;
            const r = el.getBoundingClientRect();
            setTip({text: el.getAttribute('data-tooltip'), x: r.left + r.width / 2, top: r.top, bottom: r.bottom});
        };
        const hide = () => { current = null; setTip(null); };
        const over = (e) => {
            const el = e.target.closest?.(TIP_TARGETS);
            if (el && el !== current && el.getAttribute('data-tooltip')) show(el);
            else if (!el && current) hide();
        };
        const focus = (e) => {
            const el = e.target.closest?.(TIP_TARGETS);
            if (el && el.matches(':focus-visible')) show(el);
        };
        document.addEventListener('mouseover', over);
        document.addEventListener('focusin', focus);
        document.addEventListener('focusout', hide);
        document.addEventListener('mousedown', hide);
        window.addEventListener('scroll', hide, true);
        return () => {
            document.removeEventListener('mouseover', over);
            document.removeEventListener('focusin', focus);
            document.removeEventListener('focusout', hide);
            document.removeEventListener('mousedown', hide);
            window.removeEventListener('scroll', hide, true);
        };
    }, []);
    const [pos, setPos] = useState(null);
    useEffect(() => {
        if (!tip || !boxRef.current) { setPos(null); return; }
        const w = boxRef.current.offsetWidth;
        const h = boxRef.current.offsetHeight;
        const left = Math.max(6, Math.min(tip.x - w / 2, window.innerWidth - w - 6));
        const above = tip.top - h - 6;
        setPos({left, top: above >= 6 ? above : tip.bottom + 6});
    }, [tip]);
    if (!tip || typeof document === 'undefined') return null;
    return createPortal(
        <div
            ref={boxRef}
            role="tooltip"
            className="fixed z-[2147483647] pointer-events-none px-2 py-1 rounded bg-ed-text text-white text-[11px] font-medium leading-[1.2] whitespace-nowrap"
            style={{left: pos ? pos.left : -9999, top: pos ? pos.top : -9999}}
        >
            {tip.text}
        </div>,
        document.body
    );
}
