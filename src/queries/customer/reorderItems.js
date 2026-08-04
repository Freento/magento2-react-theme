import { gql } from '@apollo/client';

export const REORDER_ITEMS = gql`
  mutation reorderItems($orderNumber: String!) {
    reorderItems(orderNumber: $orderNumber) {
      cart {
        id
        items {
          id
          product {
            name
            sku
          }
          quantity
        }
      }
      userInputErrors {
        message
        path
      }
    }
  }
`;
