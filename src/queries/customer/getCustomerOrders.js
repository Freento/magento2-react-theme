import { gql } from '@apollo/client';

export const GET_CUSTOMER_ORDERS = gql`
  query getCustomerOrders($pageSize: Int!, $currentPage: Int!) {
    customer {
      orders(pageSize: $pageSize, currentPage: $currentPage) {
        items {
          id
          number
          order_date
          status
          total {
            grand_total {
              value
              currency
            }
            base_grand_total {
              value
              currency
            }
            subtotal {
              value
              currency
            }
            total_tax {
              value
              currency
            }
            total_shipping {
              value
              currency
            }
          }
          items {
            id
            product_name
            product_sku
            quantity_ordered
            product_sale_price {
              value
              currency
            }
            product_url_key
          }
          shipping_address {
            firstname
            lastname
            street
            city
            region
            postcode
            country_code
            telephone
          }
          billing_address {
            firstname
            lastname
            street
            city
            region
            postcode
            country_code
            telephone
          }
          payment_methods {
            name
            type
          }
          shipments {
            id
            tracking {
              title
              number
            }
          }
        }
        page_info {
          page_size
          current_page
          total_pages
        }
        total_count
      }
    }
  }
`;
