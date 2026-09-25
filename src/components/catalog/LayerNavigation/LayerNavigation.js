import React, { useState, useEffect } from 'react';
import { useQuery } from '@apollo/client';
import LayerNavigationSkeleton from './LayerNavigationSkeleton';
import PriceRangeSlider from './PriceRangeSlider';
import prepareGraphQLFilters from './prepareGraphQLFilters';
import { GET_AGGREGATIONS } from '../../../queries/category';

const LayerNavigation = ({
  filters,
  onAddFilter,
  onRemoveFilter,
  onClearAllFilters,
  hasActiveFilters,
  isVisible,
  onHide,
  onShow,
  onSetPriceRange,
  enabledLayerNavigation = true,
  searchTerm = null
}) => {
  const [expandedSections, setExpandedSections] = useState({});
  const [priceRange, setPriceRange] = useState({ min: 0, max: 1000 });
  const [sliderValues, setSliderValues] = useState([0, 1000]);

  // Prepare base filters (only category + search, no user filters)
  const baseFilters = {};
  if (filters.category_uid) {
    baseFilters.category_uid = filters.category_uid;
  }

  const queryVariables = {
    filters: prepareGraphQLFilters(baseFilters)
  };

  if (searchTerm) {
    queryVariables.search = searchTerm;
  }

  // Get aggregations (for all options)
  const { loading, error, data } = useQuery(GET_AGGREGATIONS, {
    variables: queryVariables,
    skip: !enabledLayerNavigation,
    fetchPolicy: 'cache-and-network',
    nextFetchPolicy: 'cache-first',
  });

  // Calculate price range from aggregations
  useEffect(() => {
    const priceAggregation = data?.products?.aggregations?.find(agg => agg.attribute_code === 'price');
    if (priceAggregation && priceAggregation.options) {
      let minPrice = Infinity;
      let maxPrice = -Infinity;

      priceAggregation.options.forEach(option => {
        if (option.value && option.value.includes('_')) {
          const [from, to] = option.value.split('_');
          const fromNum = parseFloat(from);
          const toNum = parseFloat(to);

          if (!isNaN(fromNum)) minPrice = Math.min(minPrice, fromNum);
          if (!isNaN(toNum)) maxPrice = Math.max(maxPrice, toNum);
        }
      });

      if (minPrice !== Infinity && maxPrice !== -Infinity) {
        setPriceRange({ min: minPrice, max: maxPrice });
        if (!filters.price) {
          setSliderValues([minPrice, maxPrice]);
        }
      }
    }
  }, [data, filters.price]);

  const toggleSection = (attributeCode) => {
    setExpandedSections(prev => ({
      ...prev,
      [attributeCode]: !prev[attributeCode]
    }));
  };

  const handleFilterChange = (attributeCode, value, isChecked) => {
    if (isChecked) {
      onAddFilter(attributeCode, value);
    } else {
      onRemoveFilter(attributeCode, value);
    }
  };

  const getActiveFilterValues = (attributeCode) => {
    const filterValue = filters[attributeCode];
    if (!filterValue) return [];

    if (attributeCode === 'price') {
      // For price, return count of active price ranges
      if (Array.isArray(filterValue)) {
        return filterValue; // Return array of price objects
      } else if (typeof filterValue === 'object' && filterValue.from && filterValue.to) {
        return [filterValue]; // Convert single price to array
      }
      return [];
    }

    return Array.isArray(filterValue) ? filterValue : [filterValue];
  };

  const isFilterActive = (attributeCode, value) => {
    if (attributeCode === 'price') {
      // For price, check if the current price range matches any of the active filters
      const filterValue = filters[attributeCode];
      if (!filterValue) return false;

      const [from, to] = value.split('_');

      if (Array.isArray(filterValue)) {
        // Check if any price range matches
        return filterValue.some(price => price.from === from && price.to === to);
      } else if (typeof filterValue === 'object' && filterValue.from && filterValue.to) {
        // Single price range
        return filterValue.from === from && filterValue.to === to;
      }

      return false;
    }

    const filterValue = filters[attributeCode];
    if (!filterValue) return false;

    if (Array.isArray(filterValue)) {
      return filterValue.includes(value);
    }

    return filterValue === value;
  };

  if (!enabledLayerNavigation) {
    return null;
  }

  if (!isVisible) {
    return (
      <div className="layer-navigation-collapsed mb-5">
        <button
          className="show-filters-btn inline-flex items-center gap-2 bg-transparent text-ink border border-line py-2.5 px-3.5 rounded cursor-pointer text-13 font-medium tracking-[0.02em] transition-colors duration-fast ease-[ease] hover:border-ink hover:bg-surface"
          onClick={onShow}
          aria-label="Show filters"
        >
          <span>📊</span> Show Filters
        </button>
      </div>
    );
  }

  if (loading && !data) {
    return <LayerNavigationSkeleton onHide={onHide} />;
  }

  if (error) {
    return (
      <div className="layer-navigation mb-6 max768:mb-3">
        <div className="layer-navigation-header flex justify-between items-center pb-3.5 max768:pb-2.5 border-b border-line [.plp-drawer-body_&]:hidden">
          <h3 className="m-0 text-sm font-medium tracking-[0.12em] uppercase text-ink">Filters</h3>
          <button
            className="hide-filters-btn cursor-pointer text-base py-1 px-2 rounded text-ink-2 [transition:color_120ms_ease] hover:text-ink hover:bg-surface"
            onClick={onHide}
            aria-label="Hide filters"
          >
            ✕
          </button>
        </div>
        <div className="error py-5 text-center text-sale text-13">Error loading filters</div>
      </div>
    );
  }

  // Use aggregations from data
  const aggregations = data?.products?.aggregations || [];

  // Keep all aggregations for label lookup
  const allAggregations = aggregations;

  // Filter out aggregations that don't have meaningful options for display
  // Exclude category_uid only on category pages (when base category filter exists)
  const validAggregations = aggregations.filter(agg => {
    if (!agg.options || agg.options.length <= 1) return false;

    // Exclude category_uid only on category pages (when it's a base filter with eq property)
    // On search pages, always show category filter even if one is selected
    if (agg.attribute_code === 'category_uid' && filters.category_uid && typeof filters.category_uid === 'object' && filters.category_uid.eq) {
      return false;
    }

    return true;
  });

  return (
    <div className="layer-navigation mb-6 max768:mb-3">
      <div className="layer-navigation-header flex justify-between items-center pb-3.5 max768:pb-2.5 border-b border-line [.plp-drawer-body_&]:hidden">
        <h3 className="m-0 text-sm font-medium tracking-[0.12em] uppercase text-ink">Shop By</h3>
        <button
          className="hide-filters-btn cursor-pointer text-base py-1 px-2 rounded text-ink-2 [transition:color_120ms_ease] hover:text-ink hover:bg-surface"
          onClick={onHide}
          aria-label="Hide filters"
          title="Hide filters"
        >
          ✕
        </button>
      </div>

      {hasActiveFilters && (
        <div className="active-filters-section py-3.5 max768:py-3 border-b border-line">
          <div className="active-filters-header flex justify-between items-center mb-2.5">
            <span className="active-filters-title font-medium text-ink text-sm tracking-[0.08em] uppercase">Active Filters:</span>
            <button
              className="clear-all-btn bg-transparent cursor-pointer text-ink-2 py-1 px-2 rounded text-sm font-medium underline underline-offset-2 [transition:color_120ms_ease] hover:text-ink"
              onClick={onClearAllFilters}
              title="Clear all filters"
            >
              Clear All
            </button>
          </div>

          <div className="active-filters-list flex flex-wrap gap-1.5">
            {Object.entries(filters).map(([attributeCode, value]) => {
              // Skip category_uid only if it's the base filter (object with eq property)
              // Show it if it's a user-selected filter (array or string)
              if (attributeCode === 'category_uid' && typeof value === 'object' && value.eq) {
                return null;
              }

              const values = Array.isArray(value) ? value : [value];
              // Use allAggregations to find labels, not validAggregations (which may have filtered out this attribute)
              const aggregation = allAggregations.find(agg => agg.attribute_code === attributeCode);
              const label = aggregation?.label || attributeCode;

              return values.map(val => {
                // Find the human-readable label for this value
                let displayValue = val;
                if (attributeCode === 'price' && typeof val === 'object') {
                  displayValue = `$${val.from} - $${val.to}`;
                } else if (aggregation && aggregation.options) {
                  // Find the option with matching value to get the label
                  const option = aggregation.options.find(opt => opt.value === val);
                  displayValue = option ? option.label : val;
                }

                return (
                  <div key={`${attributeCode}-${val}`} className="active-filter-tag inline-flex items-center bg-surface text-ink py-[5px] px-2.5 rounded-pill border border-line text-sm gap-1">
                    <span className="filter-label font-medium">{label}:</span>
                    <span className="filter-value text-ink-2">{displayValue}</span>
                    <button
                      className="remove-filter-btn cursor-pointer text-ink-2 pl-1 text-base leading-none [transition:color_120ms_ease] hover:text-ink"
                      onClick={() => onRemoveFilter(attributeCode, val)}
                      title="Remove filter"
                    >
                      ✕
                    </button>
                  </div>
                );
              });
            })}
          </div>
        </div>
      )}

      <div className="filters-list">
        {validAggregations.map((aggregation) => {
          const isExpanded = expandedSections[aggregation.attribute_code] === true;
          const hasActiveFilters = getActiveFilterValues(aggregation.attribute_code).length > 0;

          return (
            <div key={aggregation.attribute_code} className="filter-section border-b border-line py-1 last:border-b-0">
              <button
                className={`filter-header ${hasActiveFilters ? 'has-active-filters' : ''} w-full flex justify-between items-center py-3.5 max768:py-3 px-[2px] cursor-pointer text-sm font-medium tracking-[0.12em] uppercase text-ink text-left [transition:color_120ms_ease] hover:text-ink-2 [&.has-active-filters]:!text-ink`}
                onClick={() => toggleSection(aggregation.attribute_code)}
                aria-expanded={isExpanded}
              >
                <span className="filter-title flex items-center gap-1.5">
                  {aggregation.label}
                  {hasActiveFilters && (
                    <span className="active-count text-xs bg-ink text-bg py-[1px] px-1.5 rounded-pill font-medium tracking-normal normal-case">
                      ({getActiveFilterValues(aggregation.attribute_code).length})
                    </span>
                  )}
                </span>
                <span className={`expand-icon ${isExpanded ? 'expanded' : ''} [transition:transform_120ms_ease] text-2xs text-ink-2 [&.expanded]:rotate-180`}>
                  ▼
                </span>
              </button>

              {isExpanded && (
                <div className="filter-options pt-1 pb-3.5 max768:pb-3 flex flex-col gap-[2px]">
                  {aggregation.attribute_code === 'price' ? (
                    <PriceRangeSlider
                      min={priceRange.min}
                      max={priceRange.max}
                      values={sliderValues}
                      onChange={setSliderValues}
                      onChangeCommitted={(values) => {
                        onSetPriceRange(values[0], values[1]);
                      }}
                      currentFilter={filters.price}
                    />
                  ) : (
                    aggregation.options.map((option) => {
                      const isActive = isFilterActive(aggregation.attribute_code, option.value);

                      return (
                        <label
                          key={option.value}
                          className={`filter-option ${isActive ? 'active' : ''} flex items-center py-1.5 px-[2px] cursor-pointer text-13 gap-2.5 rounded [transition:color_120ms_ease] hover:text-ink [&_input]:w-3.5 [&_input]:h-3.5 [&_input]:accent-ink [&_input]:cursor-pointer`}
                        >
                          <input
                            type="checkbox"
                            checked={isActive}
                            onChange={(e) => handleFilterChange(
                              aggregation.attribute_code,
                              option.value,
                              e.target.checked
                            )}
                          />
                          <span className={`filter-option-label flex-1 text-ink ${isActive ? 'font-medium' : ''}`}>{option.label}</span>
                        </label>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {validAggregations.length === 0 && (
        <div className="no-filters py-5 text-center text-ink-2 text-13 italic">
          No filters available for this selection.
        </div>
      )}
    </div>
  );
};

export default LayerNavigation;