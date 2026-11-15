import { gql } from '@apollo/client';

// What the site-wide wishlist state needs on every page: which SKUs are saved
// (the hearts on product cards), their item ids (to remove them) and the count.
// The product cards themselves come from getCustomerWishlist, on the account tab.
// `product { id }` is not optional: both queries must store the product under the
// same cache key, or each would overwrite the other's copy of the item.
export const GET_WISHLIST_SKUS = gql`
  query getWishlistSkus($pageSize: Int = 100) {
    customer {
      wishlists {
        id
        items_count
        items_v2(currentPage: 1, pageSize: $pageSize) {
          items {
            id
            product {
              id
              sku
            }
          }
        }
      }
    }
  }
`;

const WISHLIST_QUERY_NAMES = new Set(['getWishlistSkus', 'getCustomerWishlist']);

// Mutation options that refresh whichever wishlist queries are on screen. Naming
// them in `refetchQueries` instead makes Apollo warn about each one not mounted
// (the account tab's query, on every page but the account).
export const REFETCH_WISHLIST = {
  refetchQueries: 'active',
  onQueryUpdated: (query) => (WISHLIST_QUERY_NAMES.has(query.queryName) ? query.refetch() : false),
  awaitRefetchQueries: true,
};
