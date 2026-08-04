import { gql } from '@apollo/client';

export const UPDATE_WISHLIST_ITEMS = gql`
  mutation updateProductsInWishlist($wishlistId: ID!, $wishlistItems: [WishlistItemUpdateInput!]!) {
    updateProductsInWishlist(
      wishlistId: $wishlistId
      wishlistItems: $wishlistItems
    ) {
      wishlist {
        id
        items_count
        items_v2(currentPage: 1, pageSize: 100) {
          items {
            id
            quantity
            product {
              id
              name
              sku
            }
          }
        }
      }
    }
  }
`;
