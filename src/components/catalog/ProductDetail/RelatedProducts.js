import React, { useEffect, useState } from 'react';
import { useQuery } from '@apollo/client';
import ProductCard from '../ProductCard';
import { GET_PRODUCT_RELATED } from '../../../queries/product';
import { useAuth } from '../../../context/AuthContext';

const RelatedProducts = ({ urlKey, ready = true }) => {
  const { isAuthenticated } = useAuth();
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (ready) setStarted(true);
  }, [ready]);

  const { data } = useQuery(GET_PRODUCT_RELATED, {
    variables: { urlKey },
    skip: !urlKey || !started,
    ssr: false,
    fetchPolicy: isAuthenticated ? 'cache-and-network' : 'cache-first',
  });

  const owner = (data?.products?.items || []).find((p) => p.url_key === urlKey);
  const seen = new Set();
  const items = (owner?.related_products || []).filter((p) => p && !seen.has(p.id) && seen.add(p.id));
  if (items.length === 0) return null;

  return (
    <section className="pdp-related pt-10 pb-12 border-t border-line" aria-labelledby="pdp-related-title">
      <h2 id="pdp-related-title" className="text-2xl font-semibold text-ink tracking-[-0.015em] mt-0 mb-6">Related Products</h2>
      <div className="pdp-related-grid grid grid-cols-4 gap-y-[clamp(16px,2vw,32px)] gap-x-[clamp(12px,1.6vw,24px)] max900:grid-cols-3 max600:grid-cols-2">
        {items.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
};

export default RelatedProducts;
