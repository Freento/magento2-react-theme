import React from 'react';
import MobileMenuDrawer from './MobileMenuDrawer';
import DesktopMenu from './DesktopMenu';
import MenuSkeleton from './MenuSkeleton';
import useMenuData from './hooks/useMenuData';
import { manualToCategories } from './menuItems';

const Menu = ({ isMobile = false, isOpen = false, onClose = () => {}, items = null }) => {
  const manual = Array.isArray(items) && items.length > 0;
  const { menuData, loading, error } = useMenuData({ isMobile, isOpen, disabled: manual });

  const mainCategories = manual ? manualToCategories(items) : (menuData?.categoryList || [])
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

  if (manual) return <DesktopMenu mainCategories={mainCategories} />;
  if (loading && !menuData) return <MenuSkeleton />;
  if (error || !menuData?.categoryList) return null;

  return <DesktopMenu mainCategories={mainCategories} />;
};

export default Menu;
