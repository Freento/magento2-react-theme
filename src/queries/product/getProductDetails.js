import { gql } from '@apollo/client';

export const GET_PRODUCT_DETAILS = gql`
    query getProductDetails($urlKey: String!) {
        products(filter: {url_key: {eq: $urlKey}}) {
            items {
                id
                uid
                sku
                name
                url_key
                __typename
                description {
                    html
                }
                media_gallery {
                    thumb: url(width: 150)
                    w900: url(width: 900)
                    label
                }
                price_range {
                    minimum_price {
                        final_price {
                            currency
                            value
                        }
                        regular_price {
                            currency
                            value
                        }
                        discount {
                            amount_off
                            percent_off
                        }
                    }
                }
                stock_status
                only_x_left_in_stock
                categories {
                    id
                    name
                    url_path
                    url_suffix
                    breadcrumbs {
                        category_id
                        category_name
                        category_url_path
                        category_level
                    }
                }
                reviews {
                    items {
                        average_rating
                        ratings_breakdown {
                            name
                            value
                        }
                        nickname
                        summary
                        text
                        created_at
                    }
                }
                rating_summary
                review_count
                ... on ConfigurableProduct {
                    configurable_options {
                        id
                        attribute_id
                        label
                        position
                        use_default
                        attribute_code
                        values {
                            value_index
                            label
                            store_label
                            use_default_value
                            swatch_data {
                                value
                            }
                        }
                    }
                    variants {
                        product {
                            id
                            sku
                            name
                            stock_status
                            price_range {
                                minimum_price {
                                    final_price {
                                        currency
                                        value
                                    }
                                }
                            }
                            media_gallery {
                                thumb: url(width: 150)
                                w900: url(width: 900)
                                label
                            }
                            image {
                                w900: url(width: 900)
                                label
                            }
                            small_image {
                                w450: url(width: 450)
                                label
                            }
                        }
                        attributes {
                            code
                            value_index
                            label
                        }
                    }
                }
            }
        }
    }
`;
