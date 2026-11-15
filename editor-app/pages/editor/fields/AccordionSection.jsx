import {UI} from '../../../src/editor/Icon.jsx';

export function AccordionSection({name, open, onToggle, children}) {
    return (
        <div className={`accordion${open ? ' open' : ''} -mx-3.5 px-3.5 border-y border-solid border-ed-border`}>
            <button
                type="button"
                className="accordion-trigger group w-full flex items-center gap-2 py-3 px-0.5 bg-transparent border-none cursor-pointer text-left text-ed-text [transition:color_0.1s]"
                onClick={onToggle}
            >
        <span
            className={
                'accordion-chevron inline-flex items-center justify-center w-3.5 h-3.5 shrink-0 [transition:color_0.1s] ' +
                (open ? 'text-ed-text' : 'text-ed-text-soft group-hover:text-ed-primary')
            }
        >
          {open ? <UI.ChevronDown size={13} strokeWidth={2}/> : <UI.ChevronRight size={13} strokeWidth={2}/>}
        </span>
                <span
                    className={
                        'accordion-title text-[15px] font-bold tracking-[-0.01em] flex-1 text-ed-text' +
                        (open ? '' : ' group-hover:text-ed-primary')
                    }
                >{name}</span>
            </button>
            {open && <div className="accordion-body pb-[18px] flex flex-col gap-3">{children}</div>}
        </div>
    );
}
