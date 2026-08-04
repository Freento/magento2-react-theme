import React, { useState } from 'react';
import { renderPageBlocks, useActiveDevices } from 'editor-core/renderer';
import * as defaultBlocks from 'editor-core/blocks';
import { useSyncBreadcrumbs } from '../../context/BreadcrumbContext';
import HostProductsCarousel from '../catalog/ProductsCarousel';
import HostNewsletterForm from '../layout/NewsletterForm';
import NotFound from './NotFound';

const blocks = {
  ...defaultBlocks,
  ProductsCarousel: HostProductsCarousel,
  NewsletterForm: HostNewsletterForm,
};

export default function EditorPageRoute({ slug, editorPages = {}, ssrHint }) {
  const devices = useActiveDevices(undefined, ssrHint);
  const path = slug === 'home' ? '/' : `/${slug}`;
  const initial = editorPages[path] || null;
  const [page] = useState(initial);

  // CMS/editor pages get a static "Home > {title}" trail. The home page itself
  // shows none (null is inert). Hook must run before any early return.
  useSyncBreadcrumbs(
    page && path !== '/'
      ? [{ label: 'Home', path: '/' }, { label: page.title || page.name || '', path }]
      : null
  );

  if (!page) return <NotFound />;
  const opts = { devices, blocks };
  return (
    <div
      className="editor-core-page"
      style={{ maxWidth: 1200, margin: '0 auto', padding: '0 16px', ...(page.style || {}) }}
    >
      {renderPageBlocks(page, opts)}
    </div>
  );
}
