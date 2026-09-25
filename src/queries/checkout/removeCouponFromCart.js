import { gql } from '@apollo/client';
import { CHECKOUT_CART_PRICES } from './cartPricesFragment';

export const REMOVE_COUPON_FROM_CART = gql`
  ${CHECKOUT_CART_PRICES}
  mutation removeCouponFromCart($cartId: String!) {
    removeCouponFromCart(input: { cart_id: $cartId }) {
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
