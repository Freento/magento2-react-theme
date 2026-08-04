import { gql } from '@apollo/client';

export const GET_CUSTOMER_DOWNLOADABLE_PRODUCTS = gql`
  query getCustomerDownloadableProducts {
    customerDownloadableProducts {
      items {
        date
        download_url
        order_increment_id
        remaining_downloads
        status
      }
    }
  }
`;
