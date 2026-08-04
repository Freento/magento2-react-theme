import { gql } from '@apollo/client';

export const ADD_PRODUCTS_TO_CART_FROM_WISHLIST = gql`
  mutation addSimpleProductsToCart($cartId: String!, $cartItems: [SimpleProductCartItemInput!]!) {
    addSimpleProductsToCart(input: {
      cart_id: $cartId
      cart_items: $cartItems
    }) {
      cart {
        id
        total_quantity
        items {
          id
          quantity
          product {
            id
            name
            sku
            url_key
            thumbnail {
                w150: url(width: 150)
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
        prices {
          grand_total {
            currency
            value
          }
        }
      }
    }
  }
`;
