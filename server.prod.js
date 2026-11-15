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
import { basicAuth } from './server/basicAuth.js';
import { editorAuth, hasEditorSession, isEditorGuarded } from './server/editorAuth.js';
import { isMaintenanceFor, MAINTENANCE_PAGE_PATH } from './server/siteSettings.js';
import { createCriticalCss } from './server/criticalCss.js';

const __dirname  = path.dirname(fileURLToPath(import.meta.url));
const ROOT       = __dirname;
const PORT       = Number(process.env.PORT) || 3000;
const CLIENT_DIR = path.join(ROOT, 'dist/client');
const SERVER_BUNDLE      = path.join(ROOT, 'dist/server/entry-server.js');
const SPA_SHELL_PATH     = path.join(CLIENT_DIR, '_spa-shell.html');
const PAGES_INDEX_PATH   = path.join(CLIENT_DIR, '_pages-data.json');
const PAGES_DIR          = path.join(ROOT, 'editor-app/content/pages');
const ROUTES_DIR         = path.join(ROOT, 'editor-app/content/routes');
const UPLOADS_DIR        = path.join(ROOT, 'editor-app/public/uploads');

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
const inlineCriticalCss = createCriticalCss(CLIENT_DIR);

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

// The prerender already inlined the entry CSS into the shell as
// <style data-href="/assets/…">; linking it again would add a render-blocking
// request for bytes the page already has.
const cssLinksFor = (moduleKey) =>
  [...new Set(collectChunkCss(moduleKey))]
    .filter((href) => !SPA_SHELL.includes(`data-href="/${href}"`))
    .map((href) => `<link rel="stylesheet" href="/${href}">`)
    .join('\n    ');

// The catalog route (/* → Category) is lazy; its styles must ship in the head.
const CATALOG_CSS_LINKS = cssLinksFor('src/components/catalog/Category.js');

let bakedPages = null;
if (fs.existsSync(PAGES_INDEX_PATH)) {
  try { bakedPages = JSON.parse(fs.readFileSync(PAGES_INDEX_PATH, 'utf8')); } catch {}
}
const routesDirExists = fs.existsSync(ROUTES_DIR);

// A deploy that ships only dist/ has no content directory — the prerender baked
// the documents into _pages-data.json for exactly that case.
const readRouteDocs = () =>
  (routesDirExists ? readRouteAreas(ROUTES_DIR) : bakedPages?.routes || []);

// Site-wide areas. They are baked into every prerendered document, so a change
// to one of them invalidates all of them, not just its own page.
const GLOBAL_AREAS = ['/__footer__', '/__menu__'];

/**
 * One scan of the content folder per request. A handler needs the page itself,
 * the site-wide areas and the map of every editor page, and each of those used
 * to re-read and re-parse the whole folder on its own. Mtimes come along for
 * free and drive the staleness check below.
 *
 * @returns {{ byPath: Map<string, object>, mtimeByPath: Map<string, number> }}
 */
const readContent = () => {
  const byPath = new Map();
  const mtimeByPath = new Map();

  let files = null;
  try { files = fs.readdirSync(PAGES_DIR); } catch {}

  // No editor folder next to us (storefront-only deployment): fall back to the
  // index the build baked in. Those pages have no mtime, so nothing is ever
  // considered stale and the prerendered documents are served as-is.
  if (!files) {
    for (const j of bakedPages?.pages || []) {
      if (j?.path && !j.hidden) byPath.set(j.path, j);
    }
    return { byPath, mtimeByPath };
  }

  for (const f of files) {
    if (!f.endsWith('.json')) continue;
    const full = path.join(PAGES_DIR, f);
    try {
      const j = JSON.parse(fs.readFileSync(full, 'utf8'));
      if (!j?.path || j.hidden) continue;
      byPath.set(j.path, j);
      mtimeByPath.set(j.path, fs.statSync(full).mtimeMs);
    } catch {}
  }
  return { byPath, mtimeByPath };
};

const collectEditorPagesByPath = (byPath) => {
  const map = {};
  for (const [p, j] of byPath) {
    if (!p.startsWith('/__')) map[p] = j;
  }
  return map;
};

/**
 * A prerendered document is only valid while it is newer than every JSON that
 * shaped it — the page's own file plus the site-wide areas. Once the editor
 * saves, the document is stale and the page is rendered live instead, which is
 * what makes an edit visible with no rebuild. The next `npm run build` writes a
 * newer document and the page silently returns to the static path.
 *
 * Note this also fires right after a `git pull` that touches content, since a
 * checkout stamps the files with the current time. Deploys build after pulling,
 * so the window closes on its own.
 *
 * @param {number} htmlMtime      mtime of the prerendered document
 * @param {string} pagePath       path being served
 * @param {Map<string, number>} mtimeByPath
 * @returns {boolean}
 */
const isPrerenderStale = (htmlMtime, pagePath, mtimeByPath) => {
  let newest = mtimeByPath.get(pagePath) || 0;
  for (const area of GLOBAL_AREAS) {
    const m = mtimeByPath.get(area) || 0;
    if (m > newest) newest = m;
  }
  return newest > htmlMtime;
};

const mtimeOf = (file) => {
  try { return fs.statSync(file).mtimeMs; } catch { return 0; }
};

const EDITOR_APP_URL = process.env.EDITOR_APP_URL || `http://localhost:${process.env.EDITOR_PORT || 3100}`;
const EDITOR_ENABLED = String(process.env.EDITOR_ENABLED ?? 'on').toLowerCase() !== 'off';

// Everything the editor owns, in one list: both guards and the proxy filter must
// cover exactly the same paths, and keeping copies in sync by hand is how one of
// them ends up guarding less than it forwards.
const EDITOR_PATHS = ['/editor', '/__preview__', '/api/editor', '/api/render', '/_editor'];
const isEditorPath = (p) => EDITOR_PATHS.some((base) => p === base || p.startsWith(`${base}/`));

// True only when the editor guard is really mounted further down — the same
// three conditions, read once. Anything less and the skip below would open a
// hole instead of closing one.
const editorGuarded =
  EDITOR_ENABLED && Boolean(EDITOR_APP_URL) && isEditorGuarded();

const app = express();

// The two guards are mutually exclusive by path, never stacked. A request
// carries a single Authorization header, so no credential pair can satisfy two
// guards at once: the browser would be handed realm A, answer it, be handed
// realm B, answer that, and be rejected by A again — a loop with no way out and
// nothing in the log. Editor routes therefore skip this guard, but only while
// the editor guard is there to replace it; otherwise they stay behind it.
const siteGuard = basicAuth({ passes: hasEditorSession });
app.use((req, res, next) =>
  (editorGuarded && isEditorPath(req.path) ? next() : siteGuard(req, res, next)));

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

const mediaProxy = createProxyMiddleware({
  target: GRAPHQL_TARGET,
  changeOrigin: true,
  secure: !GRAPHQL_INSECURE,
  pathFilter: (p) => p.startsWith('/media/catalog/'),
  on: {
    proxyRes: (proxyRes) => {
      delete proxyRes.headers['set-cookie'];
      if (proxyRes.statusCode === 200) {
        proxyRes.headers['cache-control'] = 'public, max-age=31536000, immutable';
      }
    },
  },
});
app.use(mediaProxy);

if (EDITOR_ENABLED && EDITOR_APP_URL) {
  if (!isEditorGuarded()) {
    console.warn(
      '[editor] EDITOR_AUTH is off - /editor is open to anyone who can reach this server. ' +
      'Set EDITOR_AUTH_* and/or EDITOR_ADMIN_AUTH_* in .env to close it.'
    );
  }
  // Ahead of the proxy on purpose: an unauthorised request must not reach the
  // editor process at all.
  app.use(EDITOR_PATHS, editorAuth());

  const editorProxy = createProxyMiddleware({
    target: EDITOR_APP_URL,
    changeOrigin: true,
    ws: true,
    pathFilter: isEditorPath,
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

// The build currently on disk (see buildIdFile in vite.config.js), read on every
// request rather than through sirv, which lists its files once at start-up. A page
// that failed to load a module asks this to learn whether a deploy replaced its
// build; never cached, so the answer is always the live one.
app.get('/__build-id', (_req, res) => {
  res.set('Cache-Control', 'no-store');
  try {
    res.type('json').send(fs.readFileSync(path.join(CLIENT_DIR, 'build-id.json'), 'utf8'));
  } catch {
    res.status(404).end();
  }
});

app.use(sirv(CLIENT_DIR, {
  extensions: [],
  setHeaders: (res, pathname) => {
    if (pathname.startsWith('/assets/')) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    } else if (pathname.startsWith('/fonts/')) {
      res.setHeader('Cache-Control', 'public, max-age=604800');
    }
  },
}));

// The editor's folder is the only copy of the uploads — the build no longer
// snapshots it into dist. `dev: true` re-stats per request instead of caching a
// listing at startup, which is what makes a picture uploaded through the editor
// appear without a rebuild; filenames are unique per upload, so caching them as
// immutable stays correct.
if (fs.existsSync(UPLOADS_DIR)) {
  app.use('/uploads', sirv(UPLOADS_DIR, { maxAge: 31536000, immutable: true, dev: true }));
}

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
    .replace('</head>', `  ${headCss ? `${headCss}\n  ` : ''}</head>`)
    .replace(
      '<div id="root"></div>',
      `<div id="root">${appHtml}</div>\n    <script type="application/json" id="__INITIAL_DATA__">${initialJson}</script>`
    );
};

app.get('*', async (req, res) => {
  const startedAt = performance.now();
  const pathname = new URL(req.url, 'http://x').pathname;
  if (ASSET_RE.test(pathname)) return res.status(404).end();

  // SSR documents are per-customer now, so no shared cache may store one.
  res.set('Cache-Control', 'private, no-cache, no-store, max-age=0');

  if (isMaintenanceFor(req)) {
    const initialData = { maintenance: true, maintenancePage: readContent().byPath.get(MAINTENANCE_PAGE_PATH) || null };
    try {
      const { html: appHtml, apolloState } = await renderForRequest(req, req.url, initialData);
      return res.status(503).type('html').send(splice(appHtml, { ...initialData, apolloCache: apolloState }));
    } catch (err) {
      console.error('[maintenance]', err);
      return res.status(503).type('text/plain').send("We'll be back soon.");
    }
  }

  const { byPath, mtimeByPath } = readContent();
  const pageData    = byPath.get(pathname) || null;
  const footerData  = byPath.get('/__footer__') || null;
  const menuData    = byPath.get('/__menu__') || null;
  const editorPages = collectEditorPagesByPath(byPath);

  if (!pageData) {
    const resolvedUrl = await resolveUrl(pathname);
    // entry-server reads `routeHint` (flattened, carries `path`) for the router
    // state; the client hydrates from `resolvedUrl` ({ path, data }).
    const routeHint = toRouteHint(resolvedUrl);
    // Only this path's area document travels in the document; the rest of the
    // catalog gets a list of paths and fetches on demand.
    const routeDocs = readRouteDocs();
    const initialData = {
      pageData: null, footerData, menuData, editorPages, resolvedUrl, routeHint,
      routeArea: findRouteArea(routeDocs, pathname),
      routeAreaPaths: routeAreaPaths(routeDocs),
    };
    try {
      const { html: appHtml, apolloState, breadcrumbs, personalized, debugStats } = await renderForRequest(req, req.url, initialData);
      applyDebugHeaders(res, debugStats, performance.now() - startedAt);
      logSsrStats(req, debugStats, performance.now() - startedAt);
      writeSsrStats(req, debugStats, performance.now() - startedAt);
      return res.type('html').send(await inlineCriticalCss(splice(appHtml, { ...initialData, apolloCache: apolloState, breadcrumbs, personalized }, CATALOG_CSS_LINKS)));
    } catch (err) {
      console.error('[ssr]', err);
      // Fall back to a client-only render that still carries the resolved hint.
      const initialJson = JSON.stringify(initialData).replace(/</g, '\\u003c');
      return res.type('html').send(SPA_SHELL.replace(
        '<div id="root"></div>',
        `<script type="application/json" id="__INITIAL_DATA__">${initialJson}</script>\n    <div id="root"></div>`
      ));
    }
  }

  const staticPath = prerenderedFileFor(pathname);
  const staticMtime = mtimeOf(staticPath);
  if (staticMtime && !isPrerenderStale(staticMtime, pathname, mtimeByPath)) {
    try {
      return res.type('html').send(fs.readFileSync(staticPath, 'utf8'));
    } catch (err) {
      // Unreadable but present — fall through to the live render below.
      console.error('[static]', err);
    }
  }

  try {
    const initialData = { pageData, footerData, menuData, editorPages };
    const { html: appHtml, apolloState, breadcrumbs, personalized, debugStats } = await renderForRequest(req, req.url, initialData);
    applyDebugHeaders(res, debugStats, performance.now() - startedAt);
    logSsrStats(req, debugStats, performance.now() - startedAt);
    writeSsrStats(req, debugStats, performance.now() - startedAt);
    res.type('html').send(await inlineCriticalCss(splice(appHtml, { ...initialData, apolloCache: apolloState, breadcrumbs, personalized })));
  } catch (err) {
    console.error('[ssr]', err);
    res.type('html').send(SPA_SHELL);
  }
});

app.listen(PORT, () => {
  console.log(`Storefront prod listening on http://localhost:${PORT}`);
});
