import { gql } from '@apollo/client';

export const CHECKOUT_CART_PRICES = gql`
  fragment CheckoutCartPrices on CartPrices {
    grand_total {
      currency
      value
    }
    subtotal_excluding_tax {
      currency
      value
    }
    applied_taxes {
      amount {
        currency
        value
      }
      label
    }
    discounts {
      amount {
        currency
        value
      }
      label
    }
  }
`;
