import { gql } from '@apollo/client';

export const APPLY_COUPON_TO_CART = gql`
  mutation applyCouponToCart($cartId: String!, $code: String!) {
    applyCouponToCart(input: { cart_id: $cartId, coupon_code: $code }) {
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
