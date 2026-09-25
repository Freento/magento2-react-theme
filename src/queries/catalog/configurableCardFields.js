import { gql } from '@apollo/client';

export const CONFIGURABLE_CARD_FIELDS = gql`
  fragment ConfigurableCardFields on ConfigurableProduct {
    configurable_options {
      id
      attribute_code
      label
      values {
        uid
        value_index
        label
        swatch_data {
          value
        }
      }
    }
    variants {
      attributes {
        code
        value_index
      }
      product {
        id
        sku
        stock_status
        small_image {
          w450: url(width: 450)
        }
        price_range {
          minimum_price {
            final_price {
              currency
              value
            }
          }
        }
      }
    }
  }
`;
