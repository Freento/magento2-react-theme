import {UI} from '../../../src/editor/Icon.jsx';

export function AccordionSection({name, open, onToggle, children}) {
    return (
        <div className={`accordion${open ? ' open' : ''}`}>
            <button type="button" className="accordion-trigger" onClick={onToggle}>
        <span className="accordion-chevron">
          {open ? <UI.ChevronDown size={13} strokeWidth={2}/> : <UI.ChevronRight size={13} strokeWidth={2}/>}
        </span>
                <span className="accordion-title">{name}</span>
            </button>
            {open && <div className="accordion-body">{children}</div>}
        </div>
    );
}
