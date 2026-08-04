import { gql } from '@apollo/client';

export const ADD_PRODUCT_TO_WISHLIST = gql`
  mutation addProductToWishlist($wishlistId: ID!, $wishlistItems: [WishlistItemInput!]!) {
    addProductsToWishlist(
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
