import { gql } from '@apollo/client';

export const GET_CUSTOMER_DATA = gql`
  query getCustomer {
    customer {
      id
      email
      firstname
      lastname
      date_of_birth
      gender
      created_at
      is_subscribed
      addresses {
        id
        firstname
        lastname
        street
        city
        region {
          region
          region_id
        }
        postcode
        country_code
        country_id
        telephone
        company
        default_shipping
        default_billing
      }
    }
  }
`;
