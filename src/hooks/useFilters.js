import { useState, useCallback, useMemo, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  parseActiveFilters,
  countActiveFilters,
  buildFilterParams,
  addFilterValue,
  removeFilterValue,
} from './filters/filterUrl';
import { toGraphqlFilters, toGraphqlSort } from './filters/filterGraphql';

const useFilters = (categoryId, enabledLayerNavigation = true) => {
  const navigate = useNavigate();
  const location = useLocation();

  const isMobile = () => typeof window !== 'undefined' && window.innerWidth <= 768;
  const [isLayerNavigationVisible, setIsLayerNavigationVisible] = useState(true);
  useEffect(() => {
    setIsLayerNavigationVisible(!isMobile());
  }, []);

  const urlParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const activeFilters = useMemo(() => parseActiveFilters(urlParams, categoryId), [urlParams, categoryId]);

  const currentPage = parseInt(urlParams.get('page') || '1', 10);
  const currentSort = urlParams.get('sort') || null;

  const updateFilters = useCallback((newFilters) => {
    const params = buildFilterParams(newFilters, {
      categoryId,
      searchQuery: urlParams.get('q'),
      currentSort,
    });
    navigate(`${location.pathname}?${params.toString()}`, { replace: true });
  }, [navigate, location.pathname, currentSort, categoryId, urlParams]);

  const addFilter = useCallback((attribute, value) => {
    updateFilters(addFilterValue(activeFilters, attribute, value));
  }, [activeFilters, updateFilters]);

  const setPriceRange = useCallback((from, to) => {
    updateFilters({ ...activeFilters, price: { from, to } });
  }, [activeFilters, updateFilters]);

  const removeFilter = useCallback((attribute, value = null) => {
    updateFilters(removeFilterValue(activeFilters, attribute, value));
  }, [activeFilters, updateFilters]);

  const clearAllFilters = useCallback(() => {
    const params = new URLSearchParams();
    const searchQuery = urlParams.get('q');
    if (searchQuery) params.set('q', searchQuery);
    if (currentSort) params.set('sort', currentSort);
    const qs = params.toString();
    navigate(`${location.pathname}${qs ? '?' + qs : ''}`, { replace: true });
  }, [navigate, location.pathname, currentSort, urlParams]);

  const setSort = useCallback((sortValue) => {
    const params = new URLSearchParams(location.search);
    if (sortValue) params.set('sort', sortValue);
    else params.delete('sort');
    navigate(`${location.pathname}?${params.toString()}`, { replace: true });
  }, [navigate, location]);

  const setPage = useCallback((page) => {
    const params = new URLSearchParams(location.search);
    if (page > 1) params.set('page', page.toString());
    else params.delete('page');
    navigate(`${location.pathname}?${params.toString()}`, { replace: true });
  }, [navigate, location]);

  const hasActiveFilters = useMemo(() => countActiveFilters(urlParams) > 0, [urlParams]);

  const hideLayerNavigation = useCallback(() => setIsLayerNavigationVisible(false), []);
  const showLayerNavigation = useCallback(() => setIsLayerNavigationVisible(true), []);

  const graphqlFilters = useMemo(() => toGraphqlFilters(activeFilters), [activeFilters]);
  const graphqlSort = useMemo(() => toGraphqlSort(currentSort), [currentSort]);

  return {
    activeFilters,
    hasActiveFilters,
    currentPage,
    currentSort,
    isLayerNavigationVisible,
    enabledLayerNavigation,
    addFilter,
    removeFilter,
    clearAllFilters,
    setSort,
    setPage,
    hideLayerNavigation,
    showLayerNavigation,
    setPriceRange,
    graphqlFilters,
    graphqlSort,
  };
};

export default useFilters;
