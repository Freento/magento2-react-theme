import {UI} from '../../../src/editor/Icon.jsx';

export function AccordionSection({name, open, onToggle, children}) {
    return (
        <div className={`accordion${open ? ' open' : ''} border-b border-e-border last:border-b-0 [&.open_.accordion-chevron]:text-e-text [&:not(.open):hover_.accordion-title]:text-e-primary [&:not(.open):hover_.accordion-chevron]:text-e-primary`}>
            <button type="button" className="w-full flex items-center gap-2 pt-4 px-0.5 pb-[14px] bg-transparent border-none cursor-pointer text-left text-e-text transition-colors duration-100" onClick={onToggle}>
        <span className="accordion-chevron inline-flex items-center justify-center w-3.5 h-3.5 text-e-text-soft shrink-0 transition-colors duration-100">
          {open ? <UI.ChevronDown size={13} strokeWidth={2}/> : <UI.ChevronRight size={13} strokeWidth={2}/>}
        </span>
                <span className="accordion-title text-[15px] font-bold text-e-text tracking-[-0.01em] flex-1">{name}</span>
            </button>
            {open && <div className="pb-[18px] flex flex-col gap-3">{children}</div>}
        </div>
    );
}
