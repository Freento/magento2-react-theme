import { useParams } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import { useSyncBreadcrumbs } from '../../../../context/BreadcrumbContext';
import { GET_PRODUCT_DETAILS } from '../../../../queries/product';

export default function useProductData(urlKeyProp) {
  const { urlKey: urlKeyParam } = useParams();
  const urlKey = urlKeyProp || urlKeyParam;

  const { loading, error, data, refetch } = useQuery(GET_PRODUCT_DETAILS, {
    variables: { urlKey },
    fetchPolicy: 'cache-first',
  });

  // Magento's url_key `eq` filter can return related products too (e.g. a bundle
  // that contains this simple), so pick the exact url_key match, not just items[0].
  const items = data?.products?.items || [];
  const product = items.find((p) => p.url_key === urlKey) || items[0];
  const isConfigurable = product?.__typename === 'ConfigurableProduct';

  const cats = product?.categories?.[0]?.breadcrumbs || [];
  const eyebrowCrumbs = cats.slice(-2).map((c) => c.category_name);
  const eyebrowText = eyebrowCrumbs.length
    ? eyebrowCrumbs.join(' / ')
    : (product?.categories?.[0]?.name || '');

  // Breadcrumb trail, reusing the categories already returned by the PDP query
  // (no extra request). A product sits in several categories (incl. brand ones);
  // pick the most specific — deepest breadcrumb chain, tie-broken by url_path — so
  // the trail follows the catalog hierarchy, not e.g. /brands. Ancestors come from
  // that category's `breadcrumbs` (root-first by level); url_suffix is store-global
  // so reuse the leaf's for ancestors. Product name is the current, unlinked crumb.
  // `null` while loading keeps the bar empty.
  const productCats = product?.categories || [];
  const primaryCat = productCats.length
    ? productCats.reduce((best, c) => {
        const bl = best?.breadcrumbs?.length || 0;
        const cl = c?.breadcrumbs?.length || 0;
        if (cl !== bl) return cl > bl ? c : best;
        return (c?.url_path?.length || 0) > (best?.url_path?.length || 0) ? c : best;
      }, productCats[0])
    : null;
  const primarySuffix = primaryCat?.url_suffix || '';
  const productCrumbs = product ? [
    { label: 'Home', path: '/' },
    ...[...(primaryCat?.breadcrumbs || [])]
      .sort((a, b) => (a.category_level ?? 0) - (b.category_level ?? 0))
      .map((c) => ({
        label: c.category_name,
        path: c.category_url_path ? `/${c.category_url_path}${primarySuffix}` : undefined,
        categoryId: c.category_id,
      })),
    ...(primaryCat?.name
      ? [{
          label: primaryCat.name,
          path: primaryCat.url_path ? `/${primaryCat.url_path}${primarySuffix}` : undefined,
          categoryId: primaryCat.id,
        }]
      : []),
    { label: product.name },
  ] : null;
  useSyncBreadcrumbs(productCrumbs);

  return {
    product,
    loading,
    error,
    refetch,
    isConfigurable,
    eyebrowText,
    reviews: product?.reviews?.items || [],
    reviewCount: product?.review_count || 0,
    ratingSummary: product?.rating_summary || 0,
  };
}
