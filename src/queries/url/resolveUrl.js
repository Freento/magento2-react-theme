import { gql } from '@apollo/client';

export const RESOLVE_URL = gql`
    query resolveUrl($url: String!) {
        route(url: $url) {
            type
            relative_url
            redirect_code
            ... on CategoryTree {
                id
            }
        }
    }
`;
