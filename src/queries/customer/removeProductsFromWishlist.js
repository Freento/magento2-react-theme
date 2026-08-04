import { gql } from '@apollo/client';

export const REMOVE_PRODUCTS_FROM_WISHLIST = gql`
  mutation removeProductsFromWishlist($wishlistId: ID!, $wishlistItemsIds: [ID!]!) {
    removeProductsFromWishlist(
      wishlistId: $wishlistId
      wishlistItemsIds: $wishlistItemsIds
    ) {
      wishlist {
        id
        items_count
        items_v2(currentPage: 1, pageSize: 100) {
          items {
            id
            quantity
            description
            added_at
            product {
              id
              name
              sku
              url_key
              image {
                url
                label
              }
              price_range {
                minimum_price {
                  regular_price {
                    value
                    currency
                  }
                  final_price {
                    value
                    currency
                  }
                }
              }
            }
          }
        }
      }
    }
  }
`;
