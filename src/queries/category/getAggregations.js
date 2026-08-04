import { gql } from '@apollo/client';

export const GET_AGGREGATIONS = gql`
  query getAggregations($filters: ProductAttributeFilterInput!, $search: String) {
    products(filter: $filters, search: $search, pageSize: 1) {
      aggregations {
        attribute_code
        label
        count
        options {
          label
          value
          count
        }
      }
    }
  }
`;
