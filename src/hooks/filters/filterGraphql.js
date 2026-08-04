export const toGraphqlFilters = (activeFilters) => {
  const filters = {};

  Object.entries(activeFilters).forEach(([key, value]) => {
    if (key === 'price') {
      if (typeof value === 'object' && typeof value.from === 'number' && typeof value.to === 'number') {
        filters[key] = {
          from: value.from.toString(),
          to: value.to.toString()
        };
      }
    } else if (Array.isArray(value)) {
      filters[key] = { in: value };
    } else if (key === 'category_uid' && typeof value === 'object') {
      filters[key] = value;
    } else if (typeof value === 'string') {
      filters[key] = { eq: value };
    } else if (typeof value === 'number') {
      filters[key] = { eq: value.toString() };
    } else if (typeof value === 'object' && value !== null && (value.eq || value.in || value.from)) {
      filters[key] = value;
    }
  });

  return filters;
};

const SORT_MAP = {
  name_asc: { name: 'ASC' },
  name_desc: { name: 'DESC' },
  price_asc: { price: 'ASC' },
  price_desc: { price: 'DESC' },
  created_at_desc: { created_at: 'DESC' },
};

export const toGraphqlSort = (currentSort) => {
  if (!currentSort) return null;
  return SORT_MAP[currentSort] || null;
};
