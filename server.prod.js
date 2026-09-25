import 'dotenv/config';
import express from 'express';
import compression from 'compression';
import sirv from 'sirv';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { resolveUrl, toRouteHint } from './server/resolveUrl.js';
import { readRouteAreas, routeAreaPaths, findRouteArea } from './server/routeAreas.js';
import { readCustomerTokenCookie } from './server/customerToken.js';
import { ssrDebugEnabled, mergeStats, applyDebugHeaders, logSsrStats, writeSsrStats } from './server/ssrDebug.js';

const __dirname  = path.dirname(fileURLToPath(import.meta.url));
const ROOT       = __dirname;
const PORT       = process.env.PORT || 3000;
const CLIENT_DIR = path.join(ROOT, 'dist/client');
const SERVER_BUNDLE      = path.join(ROOT, 'dist/server/entry-server.js');
const SPA_SHELL_PATH     = path.join(CLIENT_DIR, '_spa-shell.html');
const PAGES_INDEX_PATH   = path.join(CLIENT_DIR, '_pages-data.json');
const PAGES_DIR          = path.join(ROOT, 'editor-app/content/pages');
const ROUTES_DIR         = path.join(ROOT, 'editor-app/content/routes');
const UPLOADS_DIR_DIST   = path.join(CLIENT_DIR, 'uploads');
const UPLOADS_DIR_EDITOR = path.join(ROOT, 'editor-app/public/uploads');
const UPLOADS_DIR        = fs.existsSync(UPLOADS_DIR_DIST) ? UPLOADS_DIR_DIST : UPLOADS_DIR_EDITOR;

if (!fs.existsSync(SPA_SHELL_PATH) || !fs.existsSync(SERVER_BUNDLE)) {
  console.error(`Missing build artefacts. Run 'npm run build' first.`);
  process.exit(1);
}

if (!process.env.GRAPHQL_ORIGIN) {
  throw new Error('GRAPHQL_ORIGIN is not set — add it to .env');
}
const GRAPHQL_TARGET   = process.env.GRAPHQL_ORIGIN;
const GRAPHQL_INSECURE = String(process.env.GRAPHQL_INSECURE || '').toLowerCase() === 'true';
if (GRAPHQL_INSECURE) process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const GRAPHQL_URI      = `${GRAPHQL_TARGET.replace(/\/$/, '')}/graphql`;

const SPA_SHELL = fs.readFileSync(SPA_SHELL_PATH, 'utf8');
const { renderApp } = await import(SERVER_BUNDLE);

// Vite build manifest → the CSS chunk(s) a lazy route needs. They must go into
// the SSR <head>, otherwise that route's styles only load once its JS chunk does.
let manifest = {};
try { manifest = JSON.parse(fs.readFileSync(path.join(CLIENT_DIR, '.vite/manifest.json'), 'utf8')); } catch {}

const collectChunkCss = (moduleKey, seen = new Set()) => {
  const entry = manifest[moduleKey];
  if (!entry || seen.has(moduleKey)) return [];
  seen.add(moduleKey);
  const css = [...(entry.css || [])];
  for (const imported of entry.imports || []) css.push(...collectChunkCss(imported, seen));
  return css;
};

const cssLinksFor = (moduleKey) =>
  collectChunkCss(moduleKey)
    .map((href) => `<link rel="stylesheet" href="/${href}">`)
    .join('\n    ');

// The catalog route (/* → Category) is lazy; its styles must ship in the head.
const CATALOG_CSS_LINKS = cssLinksFor('src/components/catalog/Category.js');

let bakedPages = null;
if (fs.existsSync(PAGES_INDEX_PATH)) {
  try { bakedPages = JSON.parse(fs.readFileSync(PAGES_INDEX_PATH, 'utf8')); } catch {}
}
const editorDirExists = fs.existsSync(PAGES_DIR);
const routesDirExists = fs.existsSync(ROUTES_DIR);

// A deploy that ships only dist/ has no content directory — the prerender baked
// the documents into _pages-data.json for exactly that case.
const readRouteDocs = () =>
  (routesDirExists ? readRouteAreas(ROUTES_DIR) : bakedPages?.routes || []);

const readAllPages = () => {
  if (!editorDirExists && bakedPages) return bakedPages.pages || [];
  let files;
  try { files = fs.readdirSync(PAGES_DIR); } catch { return bakedPages?.pages || []; }
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
  for (const j of readAllPages()) {
    if (j.path && !j.path.startsWith('/__')) map[j.path] = j;
  }
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
    p === '/graphql' ||
    p.startsWith('/graphql/') ||
    p.startsWith('/customer/ajax/') ||
    p.startsWith('/checkout/index/'),
  on: {
    proxyRes: (proxyRes) => {
      const loc = proxyRes.headers.location;
      if (loc) {
        proxyRes.headers.location = loc.replace(
          new RegExp(`^https?://${targetHost.replace(/\./g, '\\.')}`, 'i'),
          ''
        );
      }
      const sc = proxyRes.headers['set-cookie'];
      if (sc) {
        proxyRes.headers['set-cookie'] = (Array.isArray(sc) ? sc : [sc]).map((cookie) => {
          let next = cookie.replace(/;\s*Domain=[^;]+/gi, '').replace(/;\s*Secure/gi, '');
          if (/^\s*customer_token=/i.test(next)) {
            next = next.replace(/;\s*HttpOnly/gi, '');
          }
          return next;
        });
      }
    }
  }
});
app.use(magentoProxy);

const EDITOR_APP_URL = process.env.EDITOR_APP_URL;
const EDITOR_ENABLED = String(process.env.EDITOR_ENABLED ?? 'on').toLowerCase() !== 'off';
if (EDITOR_ENABLED && EDITOR_APP_URL) {
  const editorProxy = createProxyMiddleware({
    target: EDITOR_APP_URL,
    changeOrigin: true,
    ws: true,
    pathFilter: (p) =>
      p === '/editor' || p.startsWith('/editor/') ||
      p === '/__preview__' || p.startsWith('/__preview__/') ||
      p.startsWith('/api/editor') || p.startsWith('/api/render') ||
      p.startsWith('/_editor/'),
  });
  app.use(editorProxy);
}

// Client-side navigation into a category whose area was not in the landing
// document. Served here rather than proxied to the editor's /api/render so it
// keeps working with EDITOR_ENABLED=off.
app.get('/api/route-area', (req, res) => {
  const area = findRouteArea(readRouteDocs(), String(req.query.path || ''));
  if (!area) return res.status(404).json({ error: 'Not found' });
  res.set('Cache-Control', 'no-store');
  res.json({ area });
});

app.use(sirv(CLIENT_DIR, { extensions: [] }));
app.use('/uploads', sirv(UPLOADS_DIR, { maxAge: 31536000, immutable: true, dev: true }));

const ASSET_RE = /\.(?:js|mjs|css|png|jpe?g|gif|svg|webp|avif|ico|woff2?|ttf|map|json|txt|xml)$/i;

const prerenderedFileFor = (pathname) => {
  if (pathname === '/') return path.join(CLIENT_DIR, 'index.html');
  const slug = pathname.replace(/^\/+|\/+$/g, '');
  return path.join(CLIENT_DIR, slug, 'index.html');
};

// Render as the customer when their cookie is present, so the catalog comes back
// with their group's prices. A token Magento rejects is only discovered mid-render,
// hence the one guest re-render.
const renderForRequest = async (req, url, initialData) => {
  const debug = ssrDebugEnabled();
  const customerToken = readCustomerTokenCookie(req);
  const rendered = await renderApp(url, initialData, { graphqlUri: GRAPHQL_URI, customerToken, debug });
  if (!rendered.authRejected) {
    return { ...rendered, debugStats: debug ? mergeStats(rendered.stats) : null };
  }
  const guest = await renderApp(url, initialData, { graphqlUri: GRAPHQL_URI, debug });
  // Both renders count: the rejected one already paid for the full query set.
  return { ...guest, debugStats: debug ? mergeStats(rendered.stats, guest.stats) : null };
};

const splice = (appHtml, initialData, headCss = '') => {
  const initialJson = JSON.stringify(initialData).replace(/</g, '\\u003c');
  return SPA_SHELL
    .replace('</head>', headCss ? `  ${headCss}\n  </head>` : '</head>')
    .replace(
      '<div id="root"></div>',
      `<script>window.__INITIAL_DATA__=${initialJson}</script>\n    <div id="root">${appHtml}</div>`
    );
};

app.get('*', async (req, res) => {
  const startedAt = performance.now();
  const pathname = new URL(req.url, 'http://x').pathname;
  if (ASSET_RE.test(pathname)) return res.status(404).end();

  // SSR documents are per-customer now, so no shared cache may store one.
  res.set('Cache-Control', 'private, no-cache, no-store, max-age=0');

  const pageData    = findPageByPath(pathname);
  const footerData  = findPageByPath('/__footer__');
  const editorPages = collectEditorPagesByPath();

  if (!pageData) {
    const resolvedUrl = await resolveUrl(pathname);
    // entry-server reads `routeHint` (flattened, carries `path`) for the router
    // state; the client hydrates from `resolvedUrl` ({ path, data }).
    const routeHint = toRouteHint(resolvedUrl);
    // Only this path's area document travels in the document; the rest of the
    // catalog gets a list of paths and fetches on demand.
    const routeDocs = readRouteDocs();
    const initialData = {
      pageData: null, footerData, editorPages, resolvedUrl, routeHint,
      routeArea: findRouteArea(routeDocs, pathname),
      routeAreaPaths: routeAreaPaths(routeDocs),
    };
    try {
      const { html: appHtml, apolloState, personalized, debugStats } = await renderForRequest(req, req.url, initialData);
      applyDebugHeaders(res, debugStats, performance.now() - startedAt);
      logSsrStats(req, debugStats, performance.now() - startedAt);
      writeSsrStats(req, debugStats, performance.now() - startedAt);
      return res.type('html').send(splice(appHtml, { ...initialData, apolloCache: apolloState, personalized }, CATALOG_CSS_LINKS));
    } catch (err) {
      console.error('[ssr]', err);
      // Fall back to a client-only render that still carries the resolved hint.
      const initialJson = JSON.stringify(initialData).replace(/</g, '\\u003c');
      return res.type('html').send(SPA_SHELL.replace(
        '<div id="root"></div>',
        `<script>window.__INITIAL_DATA__=${initialJson}</script>\n    <div id="root"></div>`
      ));
    }
  }

  const staticPath = prerenderedFileFor(pathname);
  try {
    if (fs.existsSync(staticPath)) {
      return res.type('html').send(fs.readFileSync(staticPath, 'utf8'));
    }
    const initialData = { pageData, footerData, editorPages };
    const { html: appHtml, apolloState, personalized, debugStats } = await renderForRequest(req, req.url, initialData);
    applyDebugHeaders(res, debugStats, performance.now() - startedAt);
    logSsrStats(req, debugStats, performance.now() - startedAt);
    writeSsrStats(req, debugStats, performance.now() - startedAt);
    res.type('html').send(splice(appHtml, { ...initialData, apolloCache: apolloState, personalized }));
  } catch (err) {
    console.error('[ssr]', err);
    res.type('html').send(SPA_SHELL);
  }
});

app.listen(PORT, () => {
  console.log(`Storefront prod listening on http://localhost:${PORT}`);
});
