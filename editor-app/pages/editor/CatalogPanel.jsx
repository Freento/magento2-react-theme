import { BlockIcon } from '../../src/editor/Icon.jsx';

export function CatalogPanel({ categories, handleCatalogDragStart, handleDragEnd, addBlock }) {
  return Object.entries(categories).map(([catId, cat]) => (
    <div key={catId} className="catalog-section mb-[18px]">
      <div className="catalog-section-title text-[11px] font-semibold text-e-text-soft uppercase tracking-[0.04em] mb-2 pt-1.5">{cat.label}</div>
      <div className="catalog-grid grid grid-cols-2 gap-1.5">
        {cat.items.map((item) => (
          <div
            key={item.name}
            className="catalog-item group py-3 px-2 bg-e-surface border border-e-border rounded-e cursor-grab text-center text-[12px] text-e-text flex flex-col items-center gap-1.5 select-none transition-all duration-[120ms] hover:border-e-primary-border hover:bg-e-primary-soft hover:text-e-primary active:scale-[0.97]"
            draggable
            onDragStart={(e) => handleCatalogDragStart(e, item.name)}
            onDragEnd={handleDragEnd}
            onClick={() => addBlock(item.name)}
          >
            <span className="catalog-item-icon text-e-text-muted inline-flex group-hover:text-e-primary"><BlockIcon name={item.icon} size={20} /></span>
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  ));
}
