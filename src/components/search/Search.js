import React, { useMemo } from 'react';
import { useQuery } from '@apollo/client';
import { useLocation } from 'react-router-dom';
import { useSyncBreadcrumbs } from '../../context/BreadcrumbContext';
import ProductList from '../catalog/ProductList';
import CategorySkeleton from '../catalog/CategorySkeleton';
import useFilters from '../../hooks/useFilters';
import { GET_SEARCH_RESULTS } from '../../queries/search';

const Search = () => {
    const location = useLocation();
    const pageSize = 12;

    const searchParams = new URLSearchParams(location.search);
    const searchTerm = searchParams.get('q') || '';

    useSyncBreadcrumbs(
        searchTerm
            ? [
                { label: 'Home', path: '/' },
                { label: `Search: "${searchTerm}"`, path: location.pathname + location.search },
            ]
            : [
                { label: 'Home', path: '/' },
                { label: 'Search', path: '/search' },
            ]
    );

    const {
        currentPage,
        currentSort,
        activeFilters,
        hasActiveFilters,
        isLayerNavigationVisible,
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
        applyFilters,
    } = useFilters(null, true);

    const queryVariables = useMemo(() => {
        const vars = {
            inputText: searchTerm,
            currentPage: currentPage,
            pageSize: pageSize
        };

        if (graphqlFilters && Object.keys(graphqlFilters).length > 0) {
            vars.filters = graphqlFilters;
        }

        if (graphqlSort) {
            vars.sort = graphqlSort;
        }

        return vars;
    }, [searchTerm, currentPage, graphqlFilters, graphqlSort]);

    const { data, loading, error } = useQuery(GET_SEARCH_RESULTS, {
        variables: queryVariables,
        skip: !searchTerm
    });

    const handlePageChange = (page) => {
        setPage(page);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    if (!searchTerm) {
        return (
            <div className="search-message p-8 text-center">
                <h1>Search</h1>
                <p>Please enter a search term to find products.</p>
            </div>
        );
    }

    if (loading) {
        return <CategorySkeleton count={pageSize} />;
    }

    if (error) {
        return (
            <div className="search-message p-8 text-center">
                <h1>Search Error</h1>
                <p>An error occurred while searching for "{searchTerm}": {error.message}</p>
            </div>
        );
    }

    const products = data?.products?.items || [];
    const totalCount = data?.products?.total_count || 0;
    const pageInfo = data?.products?.page_info || {};
    const totalPages = pageInfo.total_pages || 1;

    return (
        <div className="category-page pt-10 max768:pt-4">
            <h1 className="page-title text-hero text-ink mb-1.5 tracking-[-0.02em] max768:text-2xl max768:leading-[1.2]">Search results for &ldquo;{searchTerm}&rdquo;</h1>
            {totalCount > 0 && (
                <div className="page-count-mobile hidden max768:block mt-1 mb-3.5 font-serif italic text-ink-2 text-md">
                    {totalCount}
                    {totalCount === 1 ? ' item' : ' items'}
                </div>
            )}

            <ProductList
                products={products}
                totalCount={totalCount}
                pageInfo={pageInfo}
                currentPage={currentPage}
                onPageChange={handlePageChange}
                currentSort={currentSort}
                onSortChange={setSort}
                enabledLayerNavigation={true}
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
                categoryId={null}
                searchTerm={searchTerm}
            />
        </div>
    );
};

export default Search;