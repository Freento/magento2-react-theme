import React, { useMemo } from 'react';
import { useQuery } from '@apollo/client';
import { useLocation, Navigate } from 'react-router-dom';
import { useSyncBreadcrumbs } from '../../context/BreadcrumbContext';
import useFilters from '../../hooks/useFilters';
import { useResolvedUrl } from '../../hooks/useResolvedUrl';
import useMenuData from '../layout/Menu/hooks/useMenuData';
import ProductDetail from './ProductDetail';
import ProductList from './ProductList';
import CategorySkeleton from './CategorySkeleton';
import NotFound from '../ui/NotFound';
import EditorArea from '../ui/EditorArea';
import { GET_CATEGORY_PRODUCTS, GET_CATEGORY_META } from '../../queries/category';
import { categoryProductsVariables } from '../../lib/catalog';
import { getCategoryUid } from '../../hooks/filters/filterUrl';
import { useRouteArea } from '../../hooks/useRouteArea';
import {
  CATEGORY_TOP_AREA, areaBlocks, displayModeOf, showsBlocks, showsRouteContent,
} from 'editor-core/routes';
import { useAuth } from '../../context/AuthContext';
import { isSsrPersonalized } from '../../lib/ssrPersonalized';

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

/**
 * The catalog route: a category listing, or the product page a product URL
 * resolves to.
 *
 * `resolved`, `areaSlot` and `displayOverride` exist for the page editor, which
 * mounts this same component to preview a category around the area being
 * edited. On the storefront none of them are passed and nothing changes.
 *
 * @param {object}  [props.resolved]         Route info instead of resolving the URL.
 * @param {ReactNode} [props.areaSlot]       Rendered in place of the saved area blocks.
 * @param {string}  [props.displayOverride]  Display mode instead of the document's.
 */
const Category = ({
  enabledLayerNavigation = true,
  routeArea = null,
  routeAreaPaths = [],
  ssrHint = null,
  resolved = null,
  areaSlot = null,
  displayOverride = null,
}) => {
  const location = useLocation();
  const urlPath = location.pathname;

  const resolvedFromUrl = useResolvedUrl(urlPath);
  const routeData = resolved || resolvedFromUrl;
  const { isAuthenticated } = useAuth();

  const categoryId = routeData?.id;

  // What the editor says goes on this URL, and what it says about the
  // storefront's own content next to it. No document means "products only" —
  // a category nobody has edited renders exactly as it always did.
  const { doc: areaDoc, pending: areaPending } = useRouteArea(urlPath, routeArea, routeAreaPaths);
  const displayMode = displayOverride || displayModeOf(areaDoc);
  const topBlocks = areaBlocks(areaDoc, CATEGORY_TOP_AREA);
  const areaContent = areaSlot
    || (topBlocks.length ? <EditorArea className="category-area mt-4 mb-8 max768:mt-3 max768:mb-6" blocks={topBlocks} ssrHint={ssrHint} /> : null);
  const showBlocks = showsBlocks(displayMode) && !!areaContent;
  const showProducts = showsRouteContent(displayMode);

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
    applyFilters,
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
  const queryVariables = useMemo(
    () => categoryProductsVariables(categoryId, {
      filters: graphqlFilters,
      sort: graphqlSort,
      page: currentPage,
    }),
    [graphqlFilters, graphqlSort, currentPage, categoryId]
  );

  const isCategory = !!categoryId && routeData?.type === 'category';

  // Both catalog queries wait for the document on a path that has one: it is
  // what says which of the two to run, and it comes off our own server in a
  // few milliseconds.
  const { loading: productsLoading, error: productsError, data, previousData } = useQuery(GET_CATEGORY_PRODUCTS, {
    variables: queryVariables,
    skip: !isCategory || !showProducts || areaPending,
    // Personalized SSR already put the customer's prices in the cache; otherwise
    // (prerender, rejected token, blocked cookie) they have to be fetched.
    fetchPolicy: isAuthenticated && !isSsrPersonalized() ? 'cache-and-network' : 'cache-first',
  });

  // The name and breadcrumbs ride along with the products; when the list is
  // hidden they still have to come from somewhere, so they come alone.
  const { data: metaOnly } = useQuery(GET_CATEGORY_META, {
    variables: { categoryUid: getCategoryUid(categoryId) },
    skip: !isCategory || showProducts || areaPending,
  });

  const productsData = data ?? previousData;

  // Breadcrumb trail from the categoryList metadata returned by the same query
  // (ancestors root-first by level; the current category is the last, unlinked
  // crumb). `null` unless this is a loaded category page — so on a product URL,
  // where this component renders <ProductDetail>, the child owns the crumbs.
  const categoryMeta = productsData?.categoryList?.[0] || metaOnly?.categoryList?.[0] || null;
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

  // Handle redirects
  if (routeData?.redirect_code) {
    const target = routeData.relative_url || '/';
    return (
      <Navigate
        to={target}
        replace
        state={{ resolved: { ...routeData, redirect_code: null, relative_url: target, path: target.replace(/^\/+/, '') } }}
      />
    );
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

  // "Hide everything" keeps the header, breadcrumbs and footer — the heading
  // alone over an empty page is worse than no page content at all.
  if (displayMode === 'none') return <div className="category-page pt-10 max768:pt-4" />;

  const listPending = showProducts && !productsData && (areaPending || productsLoading || !!productsError);

  // A page with no editor content of its own has nothing to show while the list
  // loads, so the skeleton still stands in for the whole page. With blocks they
  // render at once and the skeleton takes the list's place further down.
  if (listPending && !showBlocks) {
    return productsError ? <div>Error: {productsError.message}</div> : <CategorySkeleton />;
  }

  const products = productsData?.products?.items || [];
  const totalCount = productsData?.products?.total_count || 0;
  const pageInfo = productsData?.products?.page_info;

  // A category holding no products of its own is a landing page, whatever its
  // display mode says. Next to editor blocks an empty toolbar over "No products
  // found" tells the visitor nothing, so the list is left out. Without blocks it
  // stays — an empty state beats a blank page. An active filter always keeps it:
  // that empty result is an answer, and the visitor needs the control that
  // clears it.
  const emptyCategory = !!productsData && totalCount === 0 && !hasActiveFilters;
  const showList = showProducts && !listPending && !(emptyCategory && showBlocks);

  return (
    <div className="category-page pt-10 max768:pt-4">
      <h1 className="page-title text-hero text-ink mb-1.5 tracking-[-0.02em] max768:text-2xl max768:leading-[1.2]">{categoryMeta?.name || categoryName}</h1>
      {showProducts && totalCount > 0 && (
        <div className="page-count-mobile hidden max768:block mt-1 mb-3.5 font-serif italic text-ink-2 text-md">
          {totalCount}
          {totalCount === 1 ? ' item' : ' items'}
        </div>
      )}

      {showBlocks && areaContent}

      {listPending && (productsError ? <div>Error: {productsError.message}</div> : <CategorySkeleton />)}

      {showList && (
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
          onApplyFilters={applyFilters}
          onClearAllFilters={clearAllFilters}
          hasActiveFilters={hasActiveFilters}
          isLayerNavigationVisible={isLayerNavigationVisible}
          onHideLayerNavigation={hideLayerNavigation}
          onShowLayerNavigation={showLayerNavigation}
          onSetPriceRange={setPriceRange}
          categoryId={categoryId}
        />
      )}
    </div>
  );
};

export default Category;