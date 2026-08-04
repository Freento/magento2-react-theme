import { gql } from '@apollo/client';

export const CREATE_PRODUCT_REVIEW = gql`
    mutation createProductReview($input: CreateProductReviewInput!) {
        createProductReview(input: $input) {
            review {
                nickname
                summary
                text
                average_rating
                ratings_breakdown {
                    name
                    value
                }
            }
        }
    }
`;
