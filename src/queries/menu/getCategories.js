import { gql } from '@apollo/client';

export const GET_CATEGORIES = gql`
    query getMegaMenu {
        categoryList {
            id
            uid
            name
            children {
                id
                uid
                include_in_menu
                name
                position
                url_path
                url_suffix
                children {
                    id
                    uid
                    include_in_menu
                    name
                    position
                    url_path
                    url_suffix
                    children {
                        id
                        uid
                        include_in_menu
                        name
                        position
                        url_path
                        url_suffix
                    }
                }
            }
        }
    }
`;
