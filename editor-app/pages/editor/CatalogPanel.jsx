import { BlockIcon } from '../../src/editor/Icon.jsx';

export function CatalogPanel({ categories, handleCatalogDragStart, handleDragEnd }) {
  return Object.entries(categories).map(([catId, cat]) => (
    <div key={catId} className="catalog-section mb-[18px]">
      <div className="catalog-section-title text-[11px] font-semibold text-[#424242] uppercase tracking-[0.04em] mb-2 pt-1.5">
        {cat.label}
      </div>
      <div className="catalog-grid grid grid-cols-2 gap-1.5">
        {cat.items.map((item) => (
          <div
            key={item.name}
            className="catalog-item group px-2 py-3 bg-ed-surface border border-solid border-ed-border rounded cursor-grab text-center text-[12px] text-ed-text flex flex-col items-center gap-1.5 select-none [transition:all_0.12s] hover:border-ed-primary hover:bg-ed-primary-soft hover:text-ed-primary active:scale-[0.97]"
            draggable
            onDragStart={(e) => handleCatalogDragStart(e, item.name)}
            onDragEnd={handleDragEnd}
          >
            <span className="catalog-item-icon text-ed-text-muted inline-flex group-hover:text-ed-primary">
              <BlockIcon name={item.icon} size={20} />
            </span>
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  ));
}
