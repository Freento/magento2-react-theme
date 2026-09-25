import { gql } from '@apollo/client';
import { CHECKOUT_CART_PRICES } from './cartPricesFragment';

export const APPLY_COUPON_TO_CART = gql`
  ${CHECKOUT_CART_PRICES}
  mutation applyCouponToCart($cartId: String!, $code: String!) {
    applyCouponToCart(input: { cart_id: $cartId, coupon_code: $code }) {
      cart {
        id
        applied_coupons { code }
        prices {
          ...CheckoutCartPrices
        }
      }
    }
  }
`;
