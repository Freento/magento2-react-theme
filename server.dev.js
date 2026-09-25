import 'dotenv/config';
import express from 'express';
import compression from 'compression';
import fs from 'node:fs';
import path from 'node:path';
import { createServer as createHttpServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { resolveUrl, toRouteHint } from './server/resolveUrl.js';
import { readRouteAreas, routeAreaPaths, findRouteArea } from './server/routeAreas.js';
import { readCustomerTokenCookie } from './server/customerToken.js';
import { ssrDebugEnabled, mergeStats, applyDebugHeaders, logSsrStats, writeSsrStats } from './server/ssrDebug.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT      = __dirname;
const PORT      = Number(process.env.PORT || 5173);
const PAGES_DIR = path.join(ROOT, 'editor-app/content/pages');
const ROUTES_DIR = path.join(ROOT, 'editor-app/content/routes');

if (!process.env.GRAPHQL_ORIGIN) {
  throw new Error('GRAPHQL_ORIGIN is not set — add it to .env');
}
const GRAPHQL_TARGET   = process.env.GRAPHQL_ORIGIN;
const GRAPHQL_INSECURE = String(process.env.GRAPHQL_INSECURE || '').toLowerCase() === 'true';
if (GRAPHQL_INSECURE) process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const GRAPHQL_URI = `${GRAPHQL_TARGET.replace(/\/$/, '')}/graphql`;

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

// Client-side navigation into a category whose area was not in the landing
// document. Served here rather than proxied to the editor's /api/render so it
// keeps working with EDITOR_ENABLED=off.
app.get('/api/route-area', (req, res) => {
  const area = findRouteArea(readRouteAreas(ROUTES_DIR), String(req.query.path || ''));
  if (!area) return res.status(404).json({ error: 'Not found' });
  res.set('Cache-Control', 'no-store');
  res.json({ area });
});

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
  const startedAt = performance.now();
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

    const resolvedUrl = pageData ? null : await resolveUrl(pathname);
    // entry-server reads `routeHint` (flattened, carries `path`) for the router
    // state; the client hydrates from `resolvedUrl` ({ path, data }).
    const routeHint = toRouteHint(resolvedUrl);

    // Only this path's area document travels in the document; the rest of the
    // catalog gets a list of paths and fetches on demand.
    const routeDocs = readRouteAreas(ROUTES_DIR);
    const routeArea = findRouteArea(routeDocs, pathname);

    const initialData = {
      pageData, footerData, editorPages, routeHint, resolvedUrl,
      routeArea, routeAreaPaths: routeAreaPaths(routeDocs),
    };
    // Same as prod: render as the customer when their cookie is present, with one
    // guest re-render if Magento rejects the token.
    const customerToken = readCustomerTokenCookie(req);
    const debug = ssrDebugEnabled();
    let rendered = await renderApp(req.url, initialData, { graphqlUri: GRAPHQL_URI, customerToken, debug });
    // Both renders count: the rejected one already paid for the full query set.
    let debugStats = debug ? mergeStats(rendered.stats) : null;
    if (rendered.authRejected) {
      const rejected = rendered;
      rendered = await renderApp(req.url, initialData, { graphqlUri: GRAPHQL_URI, debug });
      debugStats = debug ? mergeStats(rejected.stats, rendered.stats) : null;
    }
    const { html: appHtml, apolloState, personalized } = rendered;

    const initialJson = JSON.stringify({ ...initialData, apolloCache: apolloState, personalized })
      .replace(/</g, '\\u003c');
    const html = template.replace(
      '<div id="root"></div>',
      `<script>window.__INITIAL_DATA__=${initialJson}</script>\n    <div id="root">${appHtml}</div>`,
    );
    applyDebugHeaders(res, debugStats, performance.now() - startedAt);
    logSsrStats(req, debugStats, performance.now() - startedAt);
    writeSsrStats(req, debugStats, performance.now() - startedAt);
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
