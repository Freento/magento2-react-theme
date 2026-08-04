import { gql } from '@apollo/client';

export const REMOVE_COUPON_FROM_CART = gql`
  mutation removeCouponFromCart($cartId: String!) {
    removeCouponFromCart(input: { cart_id: $cartId }) {
      cart {
        id
        applied_coupons { code }
        prices {
          grand_total { currency value }
          subtotal_excluding_tax { currency value }
          discounts { amount { currency value } label }
        }
      }
    }
  }
`;
