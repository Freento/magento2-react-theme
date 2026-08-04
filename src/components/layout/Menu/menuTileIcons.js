import React from 'react';

const TILE_ICON_PATHS = {
  new: (
    <>
      <path d="M9.94 15.5A2 2 0 0 0 8.5 14.06l-6.14-1.58a.5.5 0 0 1 0-.96L8.5 9.94A2 2 0 0 0 9.94 8.5l1.58-6.14a.5.5 0 0 1 .96 0L14.06 8.5A2 2 0 0 0 15.5 9.94l6.14 1.58a.5.5 0 0 1 0 .96L15.5 14.06a2 2 0 0 0-1.44 1.44l-1.58 6.14a.5.5 0 0 1-.96 0z" />
      <path d="M20 3v4M22 5h-4" />
      <path d="M4 17v2M5 18H3" />
    </>
  ),
  women: (
    <>
      <path d="M10 3h4l-1 4 3 14H8l3-14z" />
    </>
  ),
  men: (
    <>
      <path d="M4 7l4-3 4 2 4-2 4 3-2 3h-2v11H8V10H6z" />
    </>
  ),
  gear: (
    <>
      <path d="M6 7h12l-1 13H7L6 7z" />
      <path d="M9 7V5a3 3 0 0 1 6 0v2" />
    </>
  ),
  training: (
    <>
      <path d="M3 9v6M21 9v6M5 6v12M19 6v12M7 12h10" />
    </>
  ),
  sale: (
    <>
      <path d="M21 12L12 3H4v8l9 9 8-8z" />
      <circle cx="8.5" cy="7.5" r="1" />
      <path d="M14 13l-4 4" />
    </>
  ),
  default: (
    <>
      <path d="M9 6l6 6-6 6" />
    </>
  ),
};

const TILE_ICON_ALIASES = {
  whatsnew: 'new',
  whatisnew: 'new',
  new: 'new',
  arrivals: 'new',
  newarrivals: 'new',
  women: 'women',
  woman: 'women',
  ladies: 'women',
  men: 'men',
  man: 'men',
  gear: 'gear',
  accessories: 'gear',
  bags: 'gear',
  training: 'training',
  sport: 'training',
  sports: 'training',
  fitness: 'training',
  sale: 'sale',
  outlet: 'sale',
  clearance: 'sale',
};

export function getTileIcon(name) {
  const key = (name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const slot = TILE_ICON_ALIASES[key] || 'default';
  return TILE_ICON_PATHS[slot];
}
