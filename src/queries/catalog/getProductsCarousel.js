import { gql } from '@apollo/client';

export const GET_PRODUCTS_CAROUSEL = gql`
  query getProductsCarousel($categoryId: String, $pageSize: Int!) {
    products(
      filter: { category_id: { eq: $categoryId } },
      currentPage: 1,
      pageSize: $pageSize
    ) {
      items {
        __typename
        id
        uid
        sku
        name
        small_image {
            w450: url(width: 450)
        }
        url_key
        url_suffix
        price_range {
          minimum_price {
            final_price { currency value }
          }
        }
        rating_summary
        review_count
        stock_status
      }
    }
  }
`;
