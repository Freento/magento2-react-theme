import { DISPLAY_MODES } from 'editor-core/routes';
import { Segmented } from './fields/Segmented.jsx';

/**
 * Page-level settings for a route document: which area is being edited, and
 * what the storefront's own content on that route does next to the blocks.
 */
export function RouteSettings({ doc, areas, activeArea, onAreaChange, onDisplayChange }) {
  if (!doc) return null;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2.5 mx-[-14px] py-3 px-[14px] bg-e-code-bg border-b border-solid border-e-code-border">
        <div className="text-[13px] font-semibold text-e-text">{doc.title || doc.path}</div>
      </div>

      <div className="flex items-center gap-2 flex-wrap mt-3">
        <span className="text-[10px] font-semibold tracking-[0.08em] uppercase text-e-text-muted bg-e-surface-hover rounded-e py-[3px] px-[7px]">{doc.route?.type}</span>
        <span className="text-[12px] text-e-text-muted break-all">{doc.path}</span>
      </div>

      {areas.length > 1 && (
        <div className="flex flex-col gap-1.5">
          <label className="field-label block text-[11.5px] font-normal text-e-text-muted mb-1.5">Area</label>
          <Segmented
            value={activeArea}
            options={areas.map((a) => ({ value: a.id, label: a.label }))}
            onChange={onAreaChange}
          />
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <label className="field-label block text-[11.5px] font-normal text-e-text-muted mb-1.5">Display</label>
        <Segmented
          value={doc.display}
          options={DISPLAY_MODES.map((m) => ({ value: m.value, label: m.label }))}
          cols={1}
          onChange={onDisplayChange}
        />
      </div>

      <p className="m-0 text-[11.5px] leading-[1.5] text-e-text-muted [&_strong]:text-e-text [&_strong]:font-semibold">
        Blocks you add here go into <strong>{areas.find((a) => a.id === activeArea)?.label || activeArea}</strong>.
        The rest of the page stays the storefront&apos;s.
      </p>
    </div>
  );
}
