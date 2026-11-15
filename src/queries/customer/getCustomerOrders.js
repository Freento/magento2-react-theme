import { gql } from '@apollo/client';

const customerOrdersQuery = (extraFields, sortArg) => gql`
  query getCustomerOrders($pageSize: Int!, $currentPage: Int!) {
    customer {
      orders(pageSize: $pageSize, currentPage: $currentPage${sortArg}) {
        items {
          id
          number
          order_date
          status
          ${extraFields}
          total {
            discounts {
              amount {
                value
                currency
              }
              label
            }
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

const COUPONS_FIELDS = `
          applied_coupons {
            code
          }
`;

const NEWEST_FIRST_SORT = ', sort: { sort_field: CREATED_AT, sort_direction: DESC }';

const customerOrdersQueries = new Map();

export const getCustomerOrdersQuery = ({ withCoupons = false, withSort = false } = {}) => {
  const key = `${withCoupons}:${withSort}`;
  if (!customerOrdersQueries.has(key)) {
    customerOrdersQueries.set(key, customerOrdersQuery(withCoupons ? COUPONS_FIELDS : '', withSort ? NEWEST_FIRST_SORT : ''));
  }
  return customerOrdersQueries.get(key);
};
