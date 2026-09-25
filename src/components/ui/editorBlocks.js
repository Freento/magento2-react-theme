import * as defaultBlocks from 'editor-core/blocks';
import HostProductsCarousel from '../catalog/ProductsCarousel';
import HostNewsletterForm from '../layout/NewsletterForm';
import HostContactForm from '../contact/ContactForm';

/**
 * The block map the storefront renders editor content with: editor-core's own
 * blocks plus the host overrides for the ones that need the shop's data layer.
 * Shared by full editor pages and by route areas so a block added to one shows
 * up in the other.
 */
export const storefrontBlocks = {
  ...defaultBlocks,
  ProductsCarousel: HostProductsCarousel,
  NewsletterForm: HostNewsletterForm,
  ContactForm: HostContactForm,
};
