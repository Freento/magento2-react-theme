import React, { useMemo } from 'react';
import { useQuery } from '@apollo/client';
import { useLocation, Navigate } from 'react-router-dom';
import { useSyncBreadcrumbs } from '../../context/BreadcrumbContext';
import { getCategoryUid } from '../../hooks/filters/filterUrl';
import useFilters from '../../hooks/useFilters';
import { useResolvedUrl } from '../../hooks/useResolvedUrl';
import useMenuData from '../layout/Menu/hooks/useMenuData';
import ProductDetail from './ProductDetail';
import ProductList from './ProductList';
import CategorySkeleton from './CategorySkeleton';
import NotFound from '../ui/NotFound';
import { GET_CATEGORY_PRODUCTS } from '../../queries/category';
import { CATEGORY_PAGE_SIZE } from '../../lib/catalog';

const findCategoryNameById = (menuData, id) => {
  if (id == null) return null;
  const want = String(id);
  const walk = (nodes) => {
    for (const n of nodes || []) {
      if (String(n.id) === want) return n.name;
      const found = walk(n.children);
      if (found) return found;
    }
    return null;
  };
  return walk(menuData?.categoryList || []);
};

const Category = ({ enabledLayerNavigation = true }) => {
  const location = useLocation();
  const urlPath = location.pathname;

  const { loading: urlLoading, error: urlError, data: routeData } = useResolvedUrl(urlPath);

  const categoryId = routeData?.id;

  const { menuData } = useMenuData({ isOpen: true });
  const categoryName = findCategoryNameById(menuData, categoryId) || 'Category';

  // Use filters hook for filtering functionality
  const {
    activeFilters,
    hasActiveFilters,
    currentPage,
    currentSort,
    isLayerNavigationVisible,
    enabledLayerNavigation: isEnabled,
    addFilter,
    removeFilter,
    clearAllFilters,
    setSort,
    setPage,
    hideLayerNavigation,
    showLayerNavigation,
    setPriceRange,
    graphqlFilters,
    graphqlSort
  } = useFilters(categoryId, enabledLayerNavigation);

  // Prepare variables for GraphQL query
  const queryVariables = useMemo(() => {
    const vars = {
      filters: graphqlFilters,
      // categoryList in the same query resolves the breadcrumb trail for this
      // category (no extra request); keyed by the same uid used in `filters`.
      categoryUid: getCategoryUid(categoryId),
      currentPage: currentPage,
      pageSize: CATEGORY_PAGE_SIZE
    };

    if (graphqlSort) {
      vars.sort = graphqlSort;
    }

    return vars;
  }, [graphqlFilters, graphqlSort, currentPage, categoryId]);

  const { loading: productsLoading, error: productsError, data: productsData } = useQuery(GET_CATEGORY_PRODUCTS, {
    variables: queryVariables,
    skip: !categoryId || routeData?.type !== 'category',
    fetchPolicy: 'cache-first',
  });

  // Breadcrumb trail from the categoryList metadata returned by the same query
  // (ancestors root-first by level; the current category is the last, unlinked
  // crumb). `null` unless this is a loaded category page — so on a product URL,
  // where this component renders <ProductDetail>, the child owns the crumbs.
  const categoryMeta = productsData?.categoryList?.[0] || null;
  const categorySuffix = categoryMeta?.url_suffix || '';
  const categoryCrumbs = (routeData?.type === 'category' && categoryMeta) ? [
    { label: 'Home', path: '/' },
    ...[...(categoryMeta.breadcrumbs || [])]
      .sort((a, b) => (a.category_level ?? 0) - (b.category_level ?? 0))
      .map((c) => ({
        label: c.category_name,
        path: c.category_url_path ? `/${c.category_url_path}${categorySuffix}` : undefined,
        categoryId: c.category_id,
      })),
    { label: categoryMeta.name },
  ] : null;
  useSyncBreadcrumbs(categoryCrumbs);

  // Handle loading and errors
  if (urlLoading) return <CategorySkeleton />;
  if (urlError) return <div>Error resolving URL: {urlError.message || 'unknown'}</div>;

  // Handle redirects
  if (routeData?.redirect_code) {
    return <Navigate to={routeData.relative_url} replace />;
  }

  // Handle product URLs
  if (routeData?.type === 'product') {
    // Extract product url_key from the path
    const urlKey = urlPath.substring(urlPath.lastIndexOf('/') + 1).replace('.html', '');
    return <ProductDetail urlKey={urlKey} />;
  }

  if (routeData?.type === 'cms-page') {
    return <NotFound />;
  }

  if (!routeData || routeData.type !== 'category') {
    return <NotFound />;
  }

  if (productsLoading && !productsData) return <CategorySkeleton />;
  if (productsError && !productsData) return <div>Error: {productsError.message}</div>;

  const products = productsData?.products?.items || [];
  const totalCount = productsData?.products?.total_count || 0;
  const pageInfo = productsData?.products?.page_info;

  return (
    <div className="category-page">
      <h1 className="page-title">{categoryMeta?.name || categoryName}</h1>
      {totalCount > 0 && (
        <div className="page-count-mobile">
          {totalCount}
          {totalCount === 1 ? ' item' : ' items'}
        </div>
      )}

      <ProductList
        products={products}
        totalCount={totalCount}
        pageInfo={pageInfo}
        currentPage={currentPage}
        onPageChange={setPage}
        currentSort={currentSort}
        onSortChange={setSort}
        enabledLayerNavigation={isEnabled}
        activeFilters={activeFilters}
        onAddFilter={addFilter}
        onRemoveFilter={removeFilter}
        onClearAllFilters={clearAllFilters}
        hasActiveFilters={hasActiveFilters}
        isLayerNavigationVisible={isLayerNavigationVisible}
        onHideLayerNavigation={hideLayerNavigation}
        onShowLayerNavigation={showLayerNavigation}
        onSetPriceRange={setPriceRange}
        categoryId={categoryId}
      />
    </div>
  );
};

export default Category;