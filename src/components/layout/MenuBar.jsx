import React from 'react';
import DesktopMenu from './Menu/DesktopMenu';
import MenuTileIcon from './Menu/MenuTileIcon';
import { TILE_BASE } from './Menu/MobileMenuDrawer';
import { manualToCategories } from './Menu/menuItems';

export default function MenuBar({ items = [], _editor }) {
  const categories = manualToCategories(items);
  if (!categories.length) return null;
  return (
    <>
      <div className="max900:hidden">
        <DesktopMenu mainCategories={categories} />
      </div>
      {_editor && (
        <div className="hidden max900:grid grid-cols-2 gap-2 p-3">
          {categories.map((category) => (
            <div key={category.id} className={TILE_BASE}>
              <MenuTileIcon category={category} />
              <span className="mobile-menu-tile-label leading-[1.25]">{category.name}</span>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
