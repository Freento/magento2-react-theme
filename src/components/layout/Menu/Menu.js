import React from 'react';
import MobileMenuDrawer from './MobileMenuDrawer';
import DesktopMenu from './DesktopMenu';
import MenuSkeleton from './MenuSkeleton';
import useMenuData from './hooks/useMenuData';

const Menu = ({ isMobile = false, isOpen = false, onClose = () => {} }) => {
  const { menuData, loading, error } = useMenuData({ isMobile, isOpen });

  const mainCategories = (menuData?.categoryList || [])
    .flatMap((root) => root.children || [])
    .filter((cat) => cat.include_in_menu)
    .sort((a, b) => (a.position || 0) - (b.position || 0));

  if (isMobile) {
    return (
      <MobileMenuDrawer
        mainCategories={mainCategories}
        isOpen={isOpen}
        onClose={onClose}
        mobileTilesLoading={mainCategories.length === 0}
      />
    );
  }

  if (loading && !menuData) return <MenuSkeleton />;
  if (error || !menuData?.categoryList) return null;

  return <DesktopMenu mainCategories={mainCategories} />;
};

export default Menu;
