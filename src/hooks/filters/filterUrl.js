const RESERVED = new Set(['page', 'sort', 'q']);

export const getCategoryUid = (categoryId) => {
  if (!categoryId) return null;
  return btoa(categoryId.toString()); // Convert to base64
};

export const parseActiveFilters = (urlParams, categoryId) => {
  const filters = {};
  for (const [key, value] of urlParams.entries()) {
    if (RESERVED.has(key)) continue;
    if (key === 'price') {
      const [from, to] = value.split('-');
      filters.price = { from: parseFloat(from), to: parseFloat(to) };
    } else {
      filters[key] = value.includes(',') ? value.split(',') : value;
    }
  }
  if (categoryId) {
    filters.category_uid = { eq: getCategoryUid(categoryId) };
  }
  return filters;
};

export const countActiveFilters = (urlParams) =>
  Array.from(urlParams.entries()).filter(([key]) => !RESERVED.has(key)).length;

export const countFilterValues = (filters) =>
  Object.entries(filters || {}).filter(([key, value]) => {
    if (key === 'category_uid' && value && typeof value === 'object' && value.eq) return false;
    if (Array.isArray(value)) return value.length > 0;
    if (key === 'price') return !!(value && value.from != null && value.to != null);
    return value != null && value !== '';
  }).length;

export const clearFilterValues = (filters) =>
  (filters?.category_uid ? { category_uid: filters.category_uid } : {});

export const buildFilterParams = (newFilters, { categoryId, searchQuery, currentSort }) => {
  const params = new URLSearchParams();

  if (searchQuery) {
    params.set('q', searchQuery);
  }

  Object.entries(newFilters).forEach(([key, value]) => {
    if (key === 'category_uid' && categoryId) {
      return;
    }

    if (key === 'price') {
      if (typeof value === 'object' && value.from && value.to) {
        params.set('price', `${value.from}-${value.to}`);
      }
    } else if (Array.isArray(value) && value.length > 0) {
      params.set(key, value.join(','));
    } else if (value && !Array.isArray(value) && typeof value !== 'object') {
      params.set(key, value.toString());
    }
  });

  if (currentSort) {
    params.set('sort', currentSort);
  }

  params.set('page', '1');
  return params;
};

export const addFilterValue = (activeFilters, attribute, value) => {
  const next = { ...activeFilters };

  if (attribute === 'price') {
    next.price = value;
  } else if (Array.isArray(next[attribute])) {
    if (!next[attribute].includes(value)) {
      next[attribute] = [...next[attribute], value];
    }
  } else if (next[attribute]) {
    if (next[attribute] !== value) {
      next[attribute] = [next[attribute], value];
    }
  } else {
    next[attribute] = [value];
  }

  return next;
};

export const removeFilterValue = (activeFilters, attribute, value = null) => {
  const next = { ...activeFilters };

  if (attribute === 'price') {
    delete next.price;
  } else if (value === null) {
    delete next[attribute];
  } else if (Array.isArray(next[attribute])) {
    next[attribute] = next[attribute].filter((v) => v !== value);
    if (next[attribute].length === 0) {
      delete next[attribute];
    } else if (next[attribute].length === 1) {
      next[attribute] = next[attribute][0];
    }
  } else if (next[attribute] === value) {
    delete next[attribute];
  }

  return next;
};
