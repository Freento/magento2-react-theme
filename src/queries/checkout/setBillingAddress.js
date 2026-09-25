import { gql } from '@apollo/client';
import { CHECKOUT_CART_PRICES } from './cartPricesFragment';
import { CART_BILLING_ADDRESS_FIELDS } from '../cart/cartBillingAddressFields';

export const SET_BILLING_ADDRESS = gql`
  ${CHECKOUT_CART_PRICES}
  ${CART_BILLING_ADDRESS_FIELDS}
  mutation setBillingAddress($cartId: String!, $billingAddress: CartAddressInput, $billingCustomerAddressId: Int, $sameAsShipping: Boolean!) {
    setBillingAddressOnCart(input: {
      cart_id: $cartId
      billing_address: {
        customer_address_id: $billingCustomerAddressId
        address: $billingAddress
        same_as_shipping: $sameAsShipping
      }
    }) {
      cart {
        id
        prices {
          ...CheckoutCartPrices
        }
        billing_address {
          ...CartBillingAddressFields
        }
      }
    }
  }
`;
