import React from 'react';

const MenuSkeleton = () => (
  <nav className="menu-skel-nav relative flex">
    <ul className="menu-skel-list flex list-none m-0 p-0 gap-1 items-center">
      {[60, 70, 50, 60, 70, 50].map((w, i) => (
        <li key={i} aria-hidden="true" className="menu-skel-item py-2.5 px-3.5">
          <span className="menu-skel-bar block h-3.5 rounded bg-line animate-skeleton-pulse" style={{ width: w }} />
        </li>
      ))}
    </ul>
  </nav>
);

export default MenuSkeleton;
