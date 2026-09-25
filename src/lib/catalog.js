import { getCategoryUid } from '../hooks/filters/filterUrl';

// Default number of products per category / PLP page.
// Shared by the category query and the hover prefetch so the prefetched query
// (same variables) is a cache hit on click.
export const CATEGORY_PAGE_SIZE = 20;

export const categoryProductsVariables = (categoryId, { filters, sort, page = 1 } = {}) => {
  const uid = getCategoryUid(categoryId);
  const vars = {
    filters: filters || { category_uid: { eq: uid } },
    categoryUid: uid,
    currentPage: page,
    pageSize: CATEGORY_PAGE_SIZE,
  };
  if (sort) vars.sort = sort;
  return vars;
};
