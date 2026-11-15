import { gql } from '@apollo/client';

export const GET_BRAINTREE_CHECKOUT_CONFIG = gql`
  query getBraintreeCheckoutConfig {
    storeConfig {
      store_code
      braintree_environment
      braintree_paypal_merchant_country
      braintree_paypal_button_location_checkout_type_paypal_label
      braintree_paypal_button_location_checkout_type_paypal_color
      braintree_paypal_button_location_checkout_type_paypal_shape
    }
  }
`;
