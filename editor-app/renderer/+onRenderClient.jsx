import React from 'react';
import { hydrateRoot, createRoot } from 'react-dom/client';
import { PageShell } from './PageShell';

let root;

export default async function onRenderClient(pageContext) {
  const { Page, pageProps } = pageContext;
  const container = document.getElementById('react-root');
  const app = (
    <PageShell pageContext={pageContext}>
      {Page ? <Page {...(pageProps || {})} /> : null}
    </PageShell>
  );
  if (!root) {
    if (container.innerHTML !== '') {
      root = hydrateRoot(container, app);
    } else {
      root = createRoot(container);
      root.render(app);
    }
  } else {
    root.render(app);
  }
}
