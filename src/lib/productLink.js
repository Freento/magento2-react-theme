export const productHref = (product) => `/${product.url_key}${product.url_suffix || ''}`;

export const productPrefetchAttrs = (product) => (
  product?.url_key ? { 'data-prefetch': 'product', 'data-prefetch-key': product.url_key } : {}
);

export const productResolvedState = (product) => ({ resolved: {
  type: 'product',
  id: Number(product.id),
  path: `${product.url_key}${product.url_suffix || ''}`,
}});
