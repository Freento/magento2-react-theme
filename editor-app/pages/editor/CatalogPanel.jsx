import { BlockIcon } from '../../src/editor/Icon.jsx';

export function CatalogPanel({ categories, handleCatalogDragStart, handleDragEnd, addBlock }) {
  return Object.entries(categories).map(([catId, cat]) => (
    <div key={catId} className="catalog-section">
      <div className="catalog-section-title">{cat.label}</div>
      <div className="catalog-grid">
        {cat.items.map((item) => (
          <div
            key={item.name}
            className="catalog-item"
            draggable
            onDragStart={(e) => handleCatalogDragStart(e, item.name)}
            onDragEnd={handleDragEnd}
            onClick={() => addBlock(item.name)}
          >
            <span className="catalog-item-icon"><BlockIcon name={item.icon} size={20} /></span>
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  ));
}
