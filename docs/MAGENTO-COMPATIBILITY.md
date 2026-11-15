# Notes: storefront dependence on the Magento version

The theme supports several Magento versions, so some blocks may not appear on the storefront - not because of an error, but because the backend does not expose the required part of the GraphQL schema. Such blocks are hidden quietly: no errors and no empty gaps.

## Contact Us form - requires Magento 2.4.7+

Submitting the form needs the `contactUs` mutation from the `Magento_ContactGraphQl` module, which appeared in 2.4.7. On older versions the theme hides the whole block, together with its heading and intro text; the rest of the `/contact` page stays the same.
