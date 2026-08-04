import { gql } from '@apollo/client';

export const SET_PAYMENT_METHOD_AND_PLACE_ORDER = gql`
  mutation setPaymentMethodAndPlaceOrder($cartId: String!, $paymentMethod: PaymentMethodInput!) {
    setPaymentMethodOnCart(input: {
      cart_id: $cartId
      payment_method: $paymentMethod
    }) {
      cart {
        id
        selected_payment_method {
          code
          title
        }
      }
    }
    placeOrder(input: {
      cart_id: $cartId
    }) {
      order {
        order_number
      }
    }
  }
`;
