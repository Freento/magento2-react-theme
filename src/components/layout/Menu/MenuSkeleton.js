import React from 'react';
import '../../../styles/layout/Menu.less';

const MenuSkeleton = () => (
  <nav className="menu-skel-nav">
    <ul className="menu-skel-list">
      {[60, 70, 50, 60, 70, 50].map((w, i) => (
        <li key={i} aria-hidden="true" className="menu-skel-item">
          <span className="menu-skel-bar" style={{ width: w }} />
        </li>
      ))}
    </ul>
  </nav>
);

export default MenuSkeleton;
