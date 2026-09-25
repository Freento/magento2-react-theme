import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { readRouteAreas, routeAreaPaths } from '../server/routeAreas.js';

const writeWithBr = (file, content) => {
  fs.writeFileSync(file, content);
  const buf = Buffer.isBuffer(content) ? content : Buffer.from(content);
  const br = zlib.brotliCompressSync(buf, {
    params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 11 },
  });
  fs.writeFileSync(file + '.br', br);
};

const __dirname  = path.dirname(fileURLToPath(import.meta.url));
const ROOT       = path.resolve(__dirname, '..');
const PAGES_DIR  = path.join(ROOT, 'editor-app/content/pages');
const ROUTES_DIR = path.join(ROOT, 'editor-app/content/routes');
const CLIENT_DIR = path.join(ROOT, 'dist/client');
const SERVER_BUNDLE  = path.join(ROOT, 'dist/server/entry-server.js');
const TEMPLATE_PATH  = path.join(CLIENT_DIR, 'index.html');
const SPA_SHELL_PATH = path.join(CLIENT_DIR, '_spa-shell.html');
const ROOT_ANCHOR    = '<div id="root"></div>';

if (!fs.existsSync(SERVER_BUNDLE)) {
  console.error(`[prerender] missing build artefact at ${SERVER_BUNDLE}`);
  process.exit(1);
}

/**
 * Vite writes the template to index.html — and so does this script, because `/`
 * is one of the pages it renders. Read it back on a second run and the home
 * page becomes the template: the splice below finds no anchor, says nothing,
 * and every page comes out a copy of the home page. So the anchor is what
 * identifies a template, not the file name, and the SPA shell — the same
 * template kept aside — is tried first.
 */
const findTemplate = () => {
  for (const file of [SPA_SHELL_PATH, TEMPLATE_PATH]) {
    if (!fs.existsSync(file)) continue;
    const raw = fs.readFileSync(file, 'utf8');
    if (raw.includes(ROOT_ANCHOR)) return { file, raw };
  }
  return null;
};

const template = findTemplate();
if (!template) {
  console.error(`[prerender] no template with ${ROOT_ANCHOR} in ${path.relative(ROOT, CLIENT_DIR)} — run the client build first`);
  process.exit(1);
}

const inlineStylesheets = (html) =>
  html.replace(
    /<link rel="stylesheet"[^>]*?href="([^"]+)"[^>]*>/g,
    (m, href) => {
      const cssPath = path.join(CLIENT_DIR, href.replace(/^\//, ''));
      if (!fs.existsSync(cssPath)) return m;
      const css = fs.readFileSync(cssPath, 'utf8');
      return `<style data-href="${href}">${css}</style>`;
    }
  );

console.log(`[prerender] template: ${path.relative(ROOT, template.file)}`);

const TEMPLATE = inlineStylesheets(template.raw);
writeWithBr(TEMPLATE_PATH, TEMPLATE);
writeWithBr(SPA_SHELL_PATH, TEMPLATE);

const { renderApp } = await import(SERVER_BUNDLE);

const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
const allPages = fs.readdirSync(PAGES_DIR)
  .filter((f) => f.endsWith('.json'))
  .map((f) => {
    try { return readJson(path.join(PAGES_DIR, f)); } catch { return null; }
  })
  .filter(Boolean);

const footerData = allPages.find((p) => p.path === '/__footer__') || null;
const editorPages = allPages.filter((p) => p.path && !p.path.startsWith('/__'));
const editorPagesByPath = Object.fromEntries(editorPages.map((p) => [p.path, p]));

// Route areas decorate storefront routes the prerender never renders (catalog
// pages are SSR-only), so they are baked for the prod server to read and are
// not prerendered themselves.
const routeDocs = readRouteAreas(ROUTES_DIR);
// Which storefront URLs have one. A prerendered page is never a category, so it
// carries no document of its own — but a visitor landing on it and clicking
// through to a category needs this list to know the URL is worth fetching for.
const routePaths = routeAreaPaths(routeDocs);

const PAGES_INDEX_PATH = path.join(CLIENT_DIR, '_pages-data.json');
writeWithBr(PAGES_INDEX_PATH, JSON.stringify({
  pages: allPages,
  footer: footerData,
  byPath: editorPagesByPath,
  routes: routeDocs,
}));
console.log(`[prerender] wrote ${path.relative(ROOT, PAGES_INDEX_PATH)} (${allPages.length} pages, ${routeDocs.length} route area(s))`);

const UPLOADS_SRC = path.join(ROOT, 'editor-app/public/uploads');
const UPLOADS_DST = path.join(CLIENT_DIR, 'uploads');
if (fs.existsSync(UPLOADS_SRC)) {
  fs.cpSync(UPLOADS_SRC, UPLOADS_DST, { recursive: true });
  const n = fs.readdirSync(UPLOADS_DST).length;
  console.log(`[prerender] copied ${n} upload(s) → ${path.relative(ROOT, UPLOADS_DST)}`);
}

const splice = (appHtml, initialData) => {
  const initialJson = JSON.stringify(initialData).replace(/</g, '\\u003c');
  const firstPicture = appHtml.match(/<picture[^>]*>([\s\S]*?)<\/picture>/i);
  let preloadLcp = '';
  if (firstPicture) {
    const inner = firstPicture[1];
    const mobile = inner.match(/<source[^>]+srcset=["']([^"']+)["']/i);
    const desktop = inner.match(/<img[^>]+src=["']([^"']+)["']/i);
    if (mobile && desktop) {
      preloadLcp =
        `<link rel="preload" as="image" href="${mobile[1]}" media="(max-width: 640px)" fetchpriority="high" />\n  ` +
        `<link rel="preload" as="image" href="${desktop[1]}" media="(min-width: 641px)" fetchpriority="high" />\n  `;
    }
  }
  if (!preloadLcp) {
    const firstImg = appHtml.match(/<img[^>]+src=["']([^"']+)["']/);
    if (firstImg) preloadLcp = `<link rel="preload" as="image" href="${firstImg[1]}" fetchpriority="high" />\n  `;
  }
  return TEMPLATE
    .replace(
      /(<meta\s+name="viewport"[^>]*>\s*)/i,
      `$1${preloadLcp}`
    )
    .replace(
      ROOT_ANCHOR,
      `<script>window.__INITIAL_DATA__=${initialJson}</script>\n    <div id="root">${appHtml}</div>`
    );
};

const outPathFor = (urlPath) => {
  if (urlPath === '/') return path.join(CLIENT_DIR, 'index.html');
  const slug = urlPath.replace(/^\/+|\/+$/g, '');
  return path.join(CLIENT_DIR, slug, 'index.html');
};

const fallbackInitial = { pageData: null, footerData, editorPages: editorPagesByPath, ssrHint: 'mobile', routeAreaPaths: routePaths };
const fallbackJson = JSON.stringify(fallbackInitial).replace(/</g, '\\u003c');
const fallbackHtml = TEMPLATE.replace(
  ROOT_ANCHOR,
  `<script>window.__INITIAL_DATA__=${fallbackJson}</script>\n    <div id="root"></div>`,
);
writeWithBr(path.join(CLIENT_DIR, 'fallback.html'), fallbackHtml);
console.log(`[prerender] wrote fallback.html (${fallbackHtml.length} bytes)`);

let count = 0;
for (const pageData of editorPages) {
  try {
    const initialData = { pageData, footerData, editorPages: editorPagesByPath, ssrHint: 'mobile', routeAreaPaths: routePaths };
    const graphqlUri = process.env.GRAPHQL_ORIGIN
      ? `${process.env.GRAPHQL_ORIGIN.replace(/\/$/, '')}/graphql`
      : undefined;
    // debug: false explicitly — the SSR log is about what a live request costs, and a
    // build-time render costs a request nothing. Passing it keeps entry-server from
    // falling back to SSR_DEBUG and collecting stats nobody reads.
    const { html: appHtml, apolloState } = await renderApp(pageData.path, initialData, { graphqlUri, debug: false });
    const html = splice(appHtml, { ...initialData, apolloCache: apolloState });
    const out = outPathFor(pageData.path);
    fs.mkdirSync(path.dirname(out), { recursive: true });
    writeWithBr(out, html);
    console.log(`[prerender] ${pageData.path}  →  ${path.relative(ROOT, out)} (${html.length} bytes)`);
    count++;
  } catch (err) {
    console.error(`[prerender] failed ${pageData.path}:`, err.message);
  }
}
console.log(`[prerender] done — ${count} page(s)`);
