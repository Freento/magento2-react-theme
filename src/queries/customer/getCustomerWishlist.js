import { gql } from '@apollo/client';

export const GET_CUSTOMER_WISHLIST = gql`
  query getCustomerWishlist($currentPage: Int = 1, $pageSize: Int = 100) {
    customer {
      wishlists {
        id
        items_count
        sharing_code
        updated_at
        items_v2(currentPage: $currentPage, pageSize: $pageSize) {
          items {
            id
            quantity
            description
            added_at
            product {
              __typename
              id
              name
              sku
              url_key
              url_suffix
              stock_status
              rating_summary
              review_count
              image {
                url
                label
              }
              small_image {
                  w450: url(width: 450)
                  label
              }
              price_range {
                minimum_price {
                  regular_price {
                    value
                    currency
                  }
                  final_price {
                    value
                    currency
                  }
                }
              }
            }
          }
          page_info {
            page_size
            current_page
            total_pages
          }
        }
      }
    }
  }
`;
