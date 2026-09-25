import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';

const DesktopMenu = ({ mainCategories }) => {
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [dropdownPosition, setDropdownPosition] = useState({});
  const menuRef = useRef(null);
  const timeoutRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!menuRef.current) return;
      const inMenuTree = menuRef.current.contains(event.target);
      const inDropdown = event.target.closest?.('[data-menu-dropdown="true"]');
      if (!inMenuTree && !inDropdown) setActiveDropdown(null);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleMouseEnter = (categoryId, event) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setActiveDropdown(categoryId);

    setTimeout(() => {
      const menuItem = event?.currentTarget;
      if (!menuItem) return;
      const rect = menuItem.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      let position = { left: '50%', transform: 'translateX(-50%)' };
      if (rect.right > viewportWidth * 0.6) position = { right: '0', transform: 'none' };
      else if (rect.left < viewportWidth * 0.4) position = { left: '0', transform: 'none' };
      setDropdownPosition((prev) => ({ ...prev, [categoryId]: position }));
    }, 10);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => setActiveDropdown(null), 150);
  };

  return (
    <nav ref={menuRef} className="dm-nav relative flex">
      <ul className="dm-list flex list-none m-0 p-0 gap-1 items-center relative">
        {mainCategories.map((category) => (
          <li
            key={category.id}
            className="dm-item relative"
            onMouseEnter={(e) => handleMouseEnter(category.id, e)}
            onMouseLeave={handleMouseLeave}
          >
            <Link
              to={`/${category.url_path}${category.url_suffix || ''}`}
              data-prefetch="category"
              data-prefetch-id={category.id}
              state={{ resolved: {
                type: 'category',
                id: Number(category.id),
                path: `${category.url_path}${category.url_suffix || ''}`,
              }}}
              className="dm-trigger no-underline text-ink font-medium text-[16px] tracking-[0.02em] py-2.5 px-3.5 block transition-colors duration-fast ease-[ease] whitespace-nowrap text-center"
              onMouseEnter={(e) => { e.currentTarget.style.color = '#6B6B6B'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = '#111111'; }}
            >
              {category.name}
            </Link>

            {/* Dropdown portaled into <header> so it lives as the header's
                last child (header grows to include it — no fixed/top math). */}
            {activeDropdown === category.id && category.children?.length > 0 && (() => {
              const headerEl = typeof document !== 'undefined' ? document.querySelector('header.header') : null;
              if (!headerEl) return null;
              return createPortal(
              <div
                data-menu-dropdown="true"
                className="dm-dropdown absolute left-0 right-0 max-w-[1320px] ml-auto mr-auto mt-[-12px] bg-bg shadow-[0_8px_24px_rgba(0,0,0,0.08)] border border-line rounded-lg pt-9 px-8 pb-6 z-40 grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-y-6 gap-x-8"
                onMouseEnter={(e) => handleMouseEnter(category.id, e)}
                onMouseLeave={handleMouseLeave}
              >
                {category.children
                  .filter(subCat => subCat.include_in_menu)
                  .sort((a, b) => (a.position || 0) - (b.position || 0))
                  .map((subCategory) => (
                    <div key={subCategory.id} className="dm-col min-w-[200px]">
                      <Link
                        to={`/${subCategory.url_path}${subCategory.url_suffix || ''}`}
                        data-prefetch="category"
                        data-prefetch-id={subCategory.id}
                        state={{ resolved: {
                          type: 'category',
                          id: Number(subCategory.id),
                          path: `${subCategory.url_path}${subCategory.url_suffix || ''}`,
                        }}}
                        className="dm-subhead block no-underline text-ink font-medium text-sm tracking-[0.12em] uppercase mb-2.5 pt-2 pb-2.5 border-b border-line text-left transition-colors duration-fast ease-[ease]"
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = '#6B6B6B';
                          e.currentTarget.style.borderBottomColor = '#111111';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = '#111111';
                          e.currentTarget.style.borderBottomColor = '#E8E8E5';
                        }}
                      >
                        {subCategory.name}
                      </Link>

                      {subCategory.children?.length > 0 && (
                        <ul className="dm-sublist list-none m-0 p-0 flex flex-col gap-1">
                          {subCategory.children
                            .filter(subSub => subSub.include_in_menu)
                            .sort((a, b) => (a.position || 0) - (b.position || 0))
                            .slice(0, 8)
                            .map((subSubCategory) => (
                              <li key={subSubCategory.id}>
                                <Link
                                  to={`/${subSubCategory.url_path}${subSubCategory.url_suffix || ''}`}
                                  data-prefetch="category"
                                  data-prefetch-id={subSubCategory.id}
                                  state={{ resolved: {
                                    type: 'category',
                                    id: Number(subSubCategory.id),
                                    path: `${subSubCategory.url_path}${subSubCategory.url_suffix || ''}`,
                                  }}}
                                  className="dm-sublink no-underline text-ink-2 text-13 py-1.5 block transition-colors duration-fast ease-[ease] text-left"
                                  onMouseEnter={(e) => { e.currentTarget.style.color = '#111111'; }}
                                  onMouseLeave={(e) => { e.currentTarget.style.color = '#6B6B6B'; }}
                                >
                                  {subSubCategory.name}
                                </Link>
                              </li>
                            ))}
                        </ul>
                      )}
                    </div>
                  ))}
              </div>,
              headerEl
              );
            })()}
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default DesktopMenu;
