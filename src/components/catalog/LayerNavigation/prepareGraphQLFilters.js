export default function prepareGraphQLFilters(rawFilters) {
  const graphqlFilters = {};

  Object.entries(rawFilters || {}).forEach(([key, value]) => {
    if (key === 'price') {
      if (Array.isArray(value)) {
        if (value.length > 0 && typeof value[0] === 'object' && value[0].from && value[0].to) {
          graphqlFilters[key] = {
            from: value[0].from,
            to: value[0].to
          };
        }
      } else if (typeof value === 'object' && value.from && value.to) {
        graphqlFilters[key] = {
          from: value.from,
          to: value.to
        };
      }
    } else if (Array.isArray(value)) {
      // Handle arrays first (including category_uid arrays)
      graphqlFilters[key] = { in: value };
    } else if (key === 'category_uid' && typeof value === 'object') {
      // category_uid object (like { eq: "..." }) is already in correct format
      graphqlFilters[key] = value;
    } else if (typeof value === 'string') {
      graphqlFilters[key] = { eq: value };
    } else if (typeof value === 'object' && value !== null && (value.eq || value.in || value.from)) {
      graphqlFilters[key] = value;
    }
  });

  return graphqlFilters;
}
