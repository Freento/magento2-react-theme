import React from 'react';
import { renderToString } from 'react-dom/server';
import { escapeInject, dangerouslySkipEscape } from 'vike/server';
import { PageShell } from './PageShell';

export default async function onRenderHtml(pageContext) {
  const { Page, pageProps } = pageContext;
  const ssrEnabled = pageContext.config?.serverRender !== false;
  let pageHtml = '';
  if (ssrEnabled) {
    try {
      pageHtml = renderToString(
        <PageShell pageContext={pageContext}>
          {Page ? <Page {...(pageProps || {})} /> : null}
        </PageShell>
      );
    } catch (err) {
      console.error('[renderToString] failed:', err?.message || err);
    }
  }

  const title = pageContext.config?.title || 'Page Editor';

  return {
    documentHtml: escapeInject`<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
  </head>
  <body>
    <div id="react-root">${dangerouslySkipEscape(pageHtml)}</div>
  </body>
</html>`,
  };
}
