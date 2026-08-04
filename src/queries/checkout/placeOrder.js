import { gql } from '@apollo/client';

export const PLACE_ORDER = gql`
  mutation placeOrder($cartId: String!) {
    placeOrder(input: {
      cart_id: $cartId
    }) {
      order {
        order_number
      }
    }
  }
`;
