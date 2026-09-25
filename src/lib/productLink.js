export const productHref = (product) => `/${product.url_key}${product.url_suffix || ''}`;

export const productResolvedState = (product) => ({ resolved: {
  type: 'product',
  id: Number(product.id),
  path: `${product.url_key}${product.url_suffix || ''}`,
}});
