import React from 'react';
import { getTileIcon } from './menuTileIcons';

const MenuTileIcon = ({ category }) => {
  if (category.image) {
    return <img className="mobile-menu-tile-icon w-7 h-7 rounded-full object-cover shrink-0" src={category.image} alt="" loading="lazy" />;
  }
  return (
    <svg
      className="mobile-menu-tile-icon text-ink shrink-0 transition-colors duration-fast ease-[ease]"
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {getTileIcon(category.name)}
    </svg>
  );
};

export default MenuTileIcon;
