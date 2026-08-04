import 'dotenv/config';
import express from 'express';
import compression from 'compression';
import fs from 'node:fs';
import path from 'node:path';
import { createServer as createHttpServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import { createProxyMiddleware } from 'http-proxy-middleware';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT      = __dirname;
const PORT      = Number(process.env.PORT || 5173);
const PAGES_DIR = path.join(ROOT, 'editor-app/content/pages');

if (!process.env.GRAPHQL_ORIGIN) {
  throw new Error('GRAPHQL_ORIGIN is not set — add it to .env');
}
const GRAPHQL_TARGET   = process.env.GRAPHQL_ORIGIN;
const GRAPHQL_INSECURE = String(process.env.GRAPHQL_INSECURE || '').toLowerCase() === 'true';
if (GRAPHQL_INSECURE) process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const GRAPHQL_URI    = `${GRAPHQL_TARGET.replace(/\/$/, '')}/graphql`;
const RESOLVE_URL_EP = `${GRAPHQL_TARGET.replace(/\/$/, '')}/getReactResolveUrl.php`;
// "graphql" → the client resolves URLs itself; the server then skips resolution.
const RESOLVE_VIA_GRAPHQL = process.env.VITE_URL_RESOLVE_MODE === 'graphql';

const readAllPages = () => {
  let files;
  try { files = fs.readdirSync(PAGES_DIR); } catch { return []; }
  const out = [];
  for (const f of files) {
    if (!f.endsWith('.json')) continue;
    try { out.push(JSON.parse(fs.readFileSync(path.join(PAGES_DIR, f), 'utf8'))); } catch {}
  }
  return out;
};
const findPageByPath = (p) => p ? readAllPages().find((j) => j.path === p) || null : null;
const collectEditorPagesByPath = () => {
  const map = {};
  for (const j of readAllPages()) if (j.path && !j.path.startsWith('/__')) map[j.path] = j;
  return map;
};

const TARGET_PATH_REGEX = {
  category:   /^catalog\/category\/view\/id\/(\d+)/,
  product:    /^catalog\/product\/view\/id\/(\d+)/,
  'cms-page': /^cms\/page\/view\/page_id\/(\d+)/,
};

const resolveCatalogUrl = async (pathname) => {
  if (RESOLVE_VIA_GRAPHQL) return null;
  const requestPath = pathname.replace(/^\/+/, '');
  if (!requestPath) return null;
  try {
    const res = await fetch(`${RESOLVE_URL_EP}?prefix=${encodeURIComponent(requestPath)}`, {
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return null;
    const json = await res.json();
    const exact = (json.matches || []).find((m) => m.request_path === requestPath);
    if (!exact) return null;
    const matcher = TARGET_PATH_REGEX[exact.entity_type];
    const targetMatch = matcher ? exact.target_path.match(matcher) : null;
    return {
      type:          exact.entity_type,
      id:            targetMatch ? Number(targetMatch[1]) : null,
      redirect_code: exact.redirect_type || null,
      relative_url:  exact.redirect_type ? `/${exact.target_path}` : `/${exact.request_path}`,
    };
  } catch {
    return null;
  }
};

const app = express();
app.use(compression());

const targetHost = new URL(GRAPHQL_TARGET).host;
const magentoProxy = createProxyMiddleware({
  target: GRAPHQL_TARGET,
  changeOrigin: true,
  secure: !GRAPHQL_INSECURE,
  pathFilter: (p) =>
    p === '/graphql' || p.startsWith('/graphql/') ||
    p.startsWith('/customer/ajax/') || p.startsWith('/checkout/index/') ||
    p === '/getReactResolveUrl.php',
  on: {
    proxyRes: (proxyRes) => {
      const loc = proxyRes.headers.location;
      if (loc) {
        proxyRes.headers.location = loc.replace(
          new RegExp(`^https?://${targetHost.replace(/\./g, '\\.')}`, 'i'), '',
        );
      }
      const sc = proxyRes.headers['set-cookie'];
      if (sc) {
        proxyRes.headers['set-cookie'] = (Array.isArray(sc) ? sc : [sc]).map((cookie) => {
          let next = cookie.replace(/;\s*Domain=[^;]+/gi, '').replace(/;\s*Secure/gi, '');
          if (/^\s*customer_token=/i.test(next)) next = next.replace(/;\s*HttpOnly/gi, '');
          return next;
        });
      }
    },
  },
});
app.use(magentoProxy);

const EDITOR_APP_URL = process.env.EDITOR_APP_URL;
const EDITOR_ENABLED = String(process.env.EDITOR_ENABLED ?? 'on').toLowerCase() !== 'off';
if (EDITOR_ENABLED && EDITOR_APP_URL) {
  app.use(createProxyMiddleware({
    target: EDITOR_APP_URL,
    changeOrigin: true,
    ws: true,
    pathFilter: (p) =>
      p === '/editor' || p.startsWith('/editor/') ||
      p === '/__preview__' || p.startsWith('/__preview__/') ||
      p.startsWith('/api/editor') || p.startsWith('/api/render') ||
      p.startsWith('/_editor/'),
  }));
}

const httpServer = createHttpServer(app);
const vite = await import('vite');
const viteDevServer = await vite.createServer({
  root: ROOT,
  appType: 'custom',
  server: { middlewareMode: true, hmr: { server: httpServer } },
});

app.use('/uploads', express.static(path.join(ROOT, 'editor-app/public/uploads'), { maxAge: 0 }));
app.use(viteDevServer.middlewares);

const ASSET_RE = /\.(?:js|mjs|jsx|css|png|jpe?g|gif|svg|webp|avif|ico|woff2?|ttf|map|json|txt|xml)$/i;

app.get('*', async (req, res, next) => {
  const pathname = new URL(req.url, 'http://x').pathname;
  if (ASSET_RE.test(pathname)) return next();

  try {
    const template = await viteDevServer.transformIndexHtml(
      req.url,
      fs.readFileSync(path.join(ROOT, 'index.html'), 'utf-8'),
    );
    const { renderApp } = await viteDevServer.ssrLoadModule('/src/entry-server.jsx');

    const pageData    = findPageByPath(pathname);
    const footerData  = findPageByPath('/__footer__');
    const editorPages = collectEditorPagesByPath();

    // Categories resolve from the map (id synchronously → products render in SSR);
    // products resolve on the client via GraphQL `route`.
    const category = !pageData ? resolveCategoryFromMap(pathname) : null;
    const routeHint = category || null;
    const resolvedUrl = category ? { path: category.path, data: category } : null;

    const initialData = { pageData, footerData, editorPages, routeHint, resolvedUrl };
    const { html: appHtml, apolloState } = await renderApp(
      req.url,
      initialData,
      { graphqlUri: GRAPHQL_URI },
    );

    const initialJson = JSON.stringify({ ...initialData, apolloCache: apolloState })
      .replace(/</g, '\\u003c');
    const html = template.replace(
      '<div id="root"></div>',
      `<script>window.__INITIAL_DATA__=${initialJson}</script>\n    <div id="root">${appHtml}</div>`,
    );
    res.status(200).type('html').end(html);
  } catch (err) {
    viteDevServer.ssrFixStacktrace(err);
    console.error('[ssr-dev]', err);
    next(err);
  }
});

httpServer.listen(PORT, () => {
  console.log(`Storefront dev (SSR) listening on http://localhost:${PORT}`);
});
