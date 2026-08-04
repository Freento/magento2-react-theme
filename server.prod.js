import 'dotenv/config';
import express from 'express';
import compression from 'compression';
import sirv from 'sirv';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { resolveUrlRewrite } from './server/resolveUrlRewrite.js';
import { resolveCategoryFromMap, startCategoryMapRefresh } from './server/categoryMap.js';

startCategoryMapRefresh();

const __dirname  = path.dirname(fileURLToPath(import.meta.url));
const ROOT       = __dirname;
const PORT       = process.env.PORT || 3000;
const CLIENT_DIR = path.join(ROOT, 'dist/client');
const SERVER_BUNDLE      = path.join(ROOT, 'dist/server/entry-server.js');
const SPA_SHELL_PATH     = path.join(CLIENT_DIR, '_spa-shell.html');
const PAGES_INDEX_PATH   = path.join(CLIENT_DIR, '_pages-data.json');
const PAGES_DIR          = path.join(ROOT, 'editor-app/content/pages');
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
// "graphql" → the client resolves URLs itself; the server then skips resolution.
const RESOLVE_VIA_GRAPHQL = process.env.VITE_URL_RESOLVE_MODE === 'graphql';

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

app.use(sirv(CLIENT_DIR, { extensions: [] }));
app.use('/uploads', sirv(UPLOADS_DIR, { maxAge: 31536000, immutable: true, dev: true }));

const ASSET_RE = /\.(?:js|mjs|css|png|jpe?g|gif|svg|webp|avif|ico|woff2?|ttf|map|json|txt|xml)$/i;

const prerenderedFileFor = (pathname) => {
  if (pathname === '/') return path.join(CLIENT_DIR, 'index.html');
  const slug = pathname.replace(/^\/+|\/+$/g, '');
  return path.join(CLIENT_DIR, slug, 'index.html');
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
  const pathname = new URL(req.url, 'http://x').pathname;
  if (ASSET_RE.test(pathname)) return res.status(404).end();

  const pageData    = findPageByPath(pathname);
  const footerData  = findPageByPath('/__footer__');
  const editorPages = collectEditorPagesByPath();

  if (!pageData) {
    // Categories resolve from the refreshed map — id is available synchronously,
    // so the products query fires and renders during SSR. Products resolve on the
    // client via GraphQL `route` (node mode also falls back to the DB resolver).
    const category = resolveCategoryFromMap(pathname);
    const resolvedUrl = category
      ? { path: category.path, data: category }
      : RESOLVE_VIA_GRAPHQL ? null : await resolveUrlRewrite(pathname).catch(() => null);
    // entry-server reads `routeHint` (flattened, carries `path`) for the router
    // state; the client hydrates from `resolvedUrl` ({ path, data }).
    const routeHint = resolvedUrl?.data ? { ...resolvedUrl.data, path: resolvedUrl.path } : null;
    const initialData = { pageData: null, footerData, editorPages, resolvedUrl, routeHint };
    try {
      const { html: appHtml, apolloState } = await renderApp(req.url, initialData, { graphqlUri: GRAPHQL_URI });
      return res.type('html').send(splice(appHtml, { ...initialData, apolloCache: apolloState }, CATALOG_CSS_LINKS));
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
    const { html: appHtml, apolloState } = await renderApp(req.url, initialData, { graphqlUri: GRAPHQL_URI });
    res.type('html').send(splice(appHtml, { ...initialData, apolloCache: apolloState }));
  } catch (err) {
    console.error('[ssr]', err);
    res.type('html').send(SPA_SHELL);
  }
});

app.listen(PORT, () => {
  console.log(`Storefront prod listening on http://localhost:${PORT}`);
});
