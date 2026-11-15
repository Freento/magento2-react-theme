import net from 'node:net';
import { readSiteSettings, writeSiteSettings } from '../server/siteSettings.js';
import { bakeMenuCategoryIds } from '../server/menuCategoryIds.js';
import express from 'express';
import compression from 'compression';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import dotenv from 'dotenv';
import multer from 'multer';
import sirv from 'sirv';
import { renderPage } from 'vike/server';
import { DEFAULT_DISPLAY_MODE } from 'editor-core/routes';
import registry from 'editor-core/registry';
import { BUILD_ID, STARTED_AT, EDITOR_BASE_PROD } from './buildId.js';
import { createGit } from './lib/git.js';
import { logError, LOG_FILE } from './lib/log.js';

// Every path below is resolved from this file, not from process.cwd(): anyone
// running `node editor-app/server.js` from the repo root would otherwise
// silently mkdir an empty content/pages next to the wrong directory and serve a
// page list that is not the one the storefront reads. (vike itself still finds
// the production build from cwd, so scripts/start.js runs us with cwd here.)
const root = path.dirname(fileURLToPath(import.meta.url));

// The editor has no .env of its own: ports and flags live in the host's root
// .env. Load it here so `npm --workspace editor-app run dev` and the container
// supervisor see the same values as server.dev.js / server.prod.js.
dotenv.config({ path: path.resolve(root, '..', '.env') });

const isProduction = process.env.NODE_ENV === 'production';
// EDITOR_PORT, not PORT: PORT belongs to the storefront server that runs next to
// us, sharing the name would put both processes on the same port.
const port = Number(process.env.EDITOR_PORT) || 3100;
// Loopback by default. The storefront proxies /editor from the same machine, so
// nothing has to reach this port from outside - and if it can, it reaches the
// editor without passing the storefront's guard. Set EDITOR_HOST (together with
// EDITOR_APP_URL on the storefront) only when the editor runs on another host.
const host = process.env.EDITOR_HOST || '127.0.0.1';

const EDITOR_PAGES_DIR = path.join(root, 'content/pages');
// Route documents — blocks placed into named areas of a storefront route —
// live apart from pages so nothing ever mistakes one for a standalone page.
const EDITOR_ROUTES_DIR = path.join(root, 'content/routes');
const UPLOADS_DIR = path.join(root, 'public/uploads');
const DIST_DIR = path.join(root, 'dist');
const DIST_CLIENT_DIR = path.join(DIST_DIR, 'client');
// vike's server build. Rewritten by every `vite build`, so its mtime doubles as
// the build stamp below.
const DIST_SERVER_ENTRY = path.join(DIST_DIR, 'server/entry.mjs');

// The storefront sends the same value for SSR documents (server.prod.js).
const UNCACHEABLE = 'private, no-cache, no-store, max-age=0';

// The site settings ride along in the document, so the toolbar can show the
// maintenance state on its first paint instead of after a round trip.
const withSiteSettings = (html) => String(html).replace(
  '</head>',
  `<script>window.__SITE_SETTINGS__=${JSON.stringify(readSiteSettings()).replace(/</g, '\\u003c')}</script>\n</head>`,
);

fs.mkdirSync(EDITOR_PAGES_DIR, { recursive: true });
fs.mkdirSync(EDITOR_ROUTES_DIR, { recursive: true });
fs.mkdirSync(UPLOADS_DIR, { recursive: true });

if (isProduction && !fs.existsSync(DIST_SERVER_ENTRY)) {
  console.error(`[editor] missing build at ${DIST_SERVER_ENTRY} - run 'npm run build:editor' first`);
  process.exit(1);
}

// What the editor UI polls to notice it is running stale assets (see
// pages/editor/hooks/useBuildVersion.js). In dev the per-process id is the
// answer. In prod the process outlives the build, so report the build itself.
const buildVersion = () => {
  if (!isProduction) return BUILD_ID;
  try {
    return `b${Math.floor(fs.statSync(DIST_SERVER_ENTRY).mtimeMs).toString(36)}`;
  } catch {
    return BUILD_ID;
  }
};

const ALLOWED_UPLOAD_EXT = new Set(['.avif', '.webp']);
const ALLOWED_UPLOAD_MIME = new Set(['image/avif', 'image/webp']);

const uploadStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safe = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}${ext}`;
    cb(null, safe);
  },
});
const uploader = multer({
  storage: uploadStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_UPLOAD_EXT.has(ext) || !ALLOWED_UPLOAD_MIME.has(file.mimetype)) {
      return cb(new Error('only AVIF/WebP allowed'));
    }
    cb(null, true);
  },
});

const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf-8'));
const writeJson = (file, data) => {
  try {
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
  } catch (err) {
    logError('save', `could not write ${path.relative(root, file)}`, err);
    throw err;
  }
};
const isSafePageId = (id) => typeof id === 'string' && /^[a-zA-Z0-9_-]+$/.test(id);
const pageFile = (id) => path.join(EDITOR_PAGES_DIR, `${id}.json`);
const isGlobalPageId = (id) => typeof id === 'string' && id.startsWith('__');

const uploadsUsedBy = (doc) => {
  const names = new Set();
  for (const [, name] of JSON.stringify(doc || {}).matchAll(/\/uploads\/([A-Za-z0-9._-]+)/g)) names.add(name);
  return [...names]
    .map((name) => path.join(UPLOADS_DIR, name))
    .filter((file) => {
      try { return fs.statSync(file).isFile(); } catch { return false; }
    });
};

const listPages = () =>
  fs
    .readdirSync(EDITOR_PAGES_DIR)
    .filter((f) => f.endsWith('.json'))
    .map((f) => {
      try {
        return { id: f.replace('.json', ''), data: readJson(path.join(EDITOR_PAGES_DIR, f)) };
      } catch {
        return null;
      }
    })
    .filter(Boolean);

function validatePageMeta({ title, path: urlPath }, exceptId = null) {
  if (!title || typeof title !== 'string' || !title.trim()) {
    return 'title is required';
  }
  if (!urlPath || typeof urlPath !== 'string' || !urlPath.startsWith('/')) {
    return 'path must start with /';
  }
  if (/\s/.test(urlPath)) return 'path must not contain spaces';
  if (urlPath.startsWith('/__')) return 'paths starting with /__ are reserved';
  for (const { id, data } of listPages()) {
    if (id !== exceptId && data.path === urlPath) {
      return 'a page with this path already exists';
    }
  }
  return null;
}

const statusForInvalid = (message) => (message.includes('already exists') ? 409 : 400);

function freePageId(urlPath) {
  const base = urlPath.replace(/^\/+|\/+$/g, '').replace(/[^a-zA-Z0-9_-]+/g, '-') || 'home';
  let candidate = base;
  let i = 2;
  while (fs.existsSync(pageFile(candidate))) candidate = `${base}-${i++}`;
  return candidate;
}

const newBlockId = () => 'b' + Math.random().toString(36).slice(2, 9);
function cloneBlocksWithNewIds(blocks) {
  if (!Array.isArray(blocks)) return [];
  return blocks.map((b) => {
    const clone = structuredClone(b);
    clone.id = newBlockId();
    if (Array.isArray(clone.children)) clone.children = cloneBlocksWithNewIds(clone.children);
    return clone;
  });
}

function collectBlocks(blocks, out = []) {
  if (!Array.isArray(blocks)) return out;
  for (const b of blocks) {
    if (!b) continue;
    out.push(b);
    if (Array.isArray(b.children)) collectBlocks(b.children, out);
  }
  return out;
}

function blockLabel(b) {
  return b?.component || b?.type || 'block';
}

// A page keeps its blocks in one list, a route document in one list per area.
const docBlocks = (doc) =>
  Array.isArray(doc?.blocks) ? doc.blocks : Object.values(doc?.areas || {}).flat();

// System blocks (`system: true` in the block definition) are placed by
// developers in the document JSON. The API never lets a request add, remove or
// swap one: the editor hides those actions, this is what actually enforces it.
const isSystemBlock = (b) => !!registry[b?.component]?.system;
const systemBlockKeys = (doc) =>
  collectBlocks(docBlocks(doc))
    .filter(isSystemBlock)
    .map((b) => `${b.component}:${b.id}`)
    .sort()
    .join('|');
const hasSystemBlocks = (doc) => systemBlockKeys(doc) !== '';
function withoutSystemBlocks(blocks) {
  if (!Array.isArray(blocks)) return [];
  return blocks
    .filter((b) => !isSystemBlock(b))
    .map((b) => (Array.isArray(b.children) ? { ...b, children: withoutSystemBlocks(b.children) } : b));
}
const SYSTEM_BLOCKS_CHANGED = 'built-in components cannot be added or removed in the editor';

function buildCommitMessage(title, oldPage, newPage) {
  const oldBlocks = collectBlocks(docBlocks(oldPage));
  const newBlocks = collectBlocks(docBlocks(newPage));
  const oldById = new Map(oldBlocks.filter((b) => b.id).map((b) => [b.id, b]));
  const newById = new Map(newBlocks.filter((b) => b.id).map((b) => [b.id, b]));

  const added = newBlocks.filter((b) => b.id && !oldById.has(b.id));
  const removed = oldBlocks.filter((b) => b.id && !newById.has(b.id));
  const edited = newBlocks.filter((b) => {
    const prev = b.id && oldById.get(b.id);
    return prev && JSON.stringify(prev) !== JSON.stringify(b);
  });

  const parts = [];
  if (added.length) {
    const kinds = [...new Set(added.map(blockLabel))].slice(0, 3).join(', ');
    parts.push(added.length === 1 ? `added ${kinds}` : `added ${added.length} blocks (${kinds})`);
  }
  if (removed.length) {
    const kinds = [...new Set(removed.map(blockLabel))].slice(0, 3).join(', ');
    parts.push(removed.length === 1 ? `removed ${kinds}` : `removed ${removed.length} blocks (${kinds})`);
  }
  if (edited.length) {
    const kinds = [...new Set(edited.map(blockLabel))].slice(0, 3).join(', ');
    parts.push(edited.length === 1 ? `edited ${kinds}` : `edited ${edited.length} blocks (${kinds})`);
  }

  if (oldPage && typeof oldPage.title === 'string' && oldPage.title !== newPage.title) {
    parts.unshift(`renamed to "${newPage.title}"`);
  }
  if (oldPage && JSON.stringify(oldPage.style || {}) !== JSON.stringify(newPage.style || {})) {
    if (parts.length === 0) parts.push('updated page style');
  }

  const detail = parts.length ? parts.join(', ') : 'editor save';
  return `${title}: ${detail}`;
}

const STOREFRONT_URL = process.env.STOREFRONT_URL;
const notifyStorefront = async (body) => {
  if (!STOREFRONT_URL) return;
  try {
    await fetch(`${STOREFRONT_URL.replace(/\/$/, '')}/__prerender`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch (err) {
    console.error('[prerender notify]', err.message);
    logError('prerender', 'storefront notify failed', err.message);
  }
};

async function startServer() {
  const app = express();
  app.use(compression());
  app.use('/api', express.json({ limit: '2mb' }));


  let viteDevServer = null;
  if (!isProduction) {
    const vite = await import('vite');
    viteDevServer = await vite.createServer({
      root,
      server: { middlewareMode: true },
    });
  } else {
    // Explicit import of the server build rather than vike's cwd-based lookup,
    // so a start from the repo root works too.
    await import(pathToFileURL(DIST_SERVER_ENTRY).href);
  }

  // Every editor-API GET should be revalidated each time so the authoring
  // UI never works against a stale browser cache.
  app.use('/api', (_req, res, next) => {
    res.set('Cache-Control', UNCACHEABLE);
    next();
  });

  const REPO_DIR = process.env.REPO_DIR || path.resolve(root, '..');
  const { runGit, commitPaths, syncWithRemote, commitAndPublish } = createGit(REPO_DIR);

  // The storefront's editor guard names the signed-in Magento admin in this
  // header (and drops any copy the browser sent); with the guard off there is
  // no header and commits go out unsigned.
  const editorUserOf = (req) => {
    try {
      const user = JSON.parse(decodeURIComponent(String(req.headers['x-editor-user'] || '')));
      return user?.username ? user : null;
    } catch {
      return null;
    }
  };

  const signedBy = (req, message) => {
    const user = editorUserOf(req);
    if (!user) return message;
    return `${message}\n\nEditor-User: ${user.id ? `#${user.id} ` : ''}${user.username}`;
  };

  /**
   * Stages and commits one saved document, describing the edit in the message.
   * A save that changes nothing on disk commits nothing.
   */
  const commitDoc = (req, filePath, oldDoc, newDoc, fallbackTitle) => {
    const title = (typeof newDoc.title === 'string' && newDoc.title.trim()) || fallbackTitle;
    return commitPaths([filePath, ...uploadsUsedBy(newDoc)], signedBy(req, buildCommitMessage(title, oldDoc, newDoc)));
  };

  // SAVE_BUTTON=disabled turns a demo instance read-only: the UI greys the Save
  // button out, and the requests behind it are refused here, so a hand-made
  // request does not get around the disabled button either.
  const saveDisabled = process.env.SAVE_BUTTON === 'disabled';
  const saveTooltip = process.env.SAVE_BUTTON_TOOLTIP || 'Save is disabled';
  const refuseWhenSaveDisabled = (_req, res, next) => {
    if (!saveDisabled) return next();
    res.status(403).json({ ok: false, error: saveTooltip });
  };

  // Read at runtime rather than baked into the build, so flipping the flag in
  // .env only needs a restart.
  app.get('/api/editor/config', (_req, res) => {
    res.json({ save: { disabled: saveDisabled, tooltip: saveDisabled ? saveTooltip : null } });
  });

  // Version handshake. Cheap & frequently polled — keep it small.
  app.get('/api/editor/version', (_req, res) => {
    res.json({ version: buildVersion(), startedAt: STARTED_AT });
  });

  app.get('/api/editor/pages', (_req, res) => {
    res.json(
      listPages().map(({ id, data }) => ({
        id,
        title: data.title,
        path: data.path,
        hidden: !!data.hidden,
        locked: hasSystemBlocks(data),
      }))
    );
  });

  app.get('/api/editor/pages/:id', (req, res) => {
    if (!isSafePageId(req.params.id)) return res.status(400).json({ error: 'Bad id' });
    const filePath = pageFile(req.params.id);
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Not found' });
    res.json(readJson(filePath));
  });

  app.put('/api/editor/pages/:id', refuseWhenSaveDisabled, async (req, res) => {
    if (!isSafePageId(req.params.id)) return res.status(400).json({ error: 'Bad id' });
    const id = req.params.id;
    const filePath = pageFile(id);

    let oldPage = null;
    try { oldPage = readJson(filePath); } catch {}

    if (systemBlockKeys(req.body) !== systemBlockKeys(oldPage)) {
      logError('save', `page "${id}" refused`, SYSTEM_BLOCKS_CHANGED);
      return res.status(400).json({ error: SYSTEM_BLOCKS_CHANGED });
    }

    if (id === '__menu__') {
      const baked = await bakeMenuCategoryIds(req.body, oldPage, EDITOR_PAGES_DIR);
      if (!baked.ok) logError('save', 'menu category ids not refreshed, kept the previous ones', baked.error);
    }

    writeJson(filePath, req.body);
    await notifyStorefront({ path: req.body?.path });

    const label = { __footer__: 'Footer', __menu__: 'Menu', __maintenance__: 'Maintenance page' }[id] || id;
    const committed = await commitDoc(req, filePath, oldPage, req.body || {}, label);
    res.json({ ok: true, committed });
  });

  app.post('/api/editor/pages', refuseWhenSaveDisabled, async (req, res) => {
    const { title, path: urlPath } = req.body || {};
    const invalid = validatePageMeta({ title, path: urlPath });
    if (invalid) return res.status(statusForInvalid(invalid)).json({ error: invalid });

    const id = freePageId(urlPath);
    const newPage = { title: title.trim(), path: urlPath, blocks: [] };
    const filePath = pageFile(id);
    writeJson(filePath, newPage);
    await notifyStorefront({ path: urlPath });

    const git = await commitAndPublish([filePath], signedBy(req, `Created page "${newPage.title}" (${urlPath})`));
    res.status(201).json({ id, ...newPage, ...git });
  });

  app.patch('/api/editor/pages/:id', refuseWhenSaveDisabled, async (req, res) => {
    const id = req.params.id;
    if (!isSafePageId(id)) return res.status(400).json({ error: 'Bad id' });
    if (isGlobalPageId(id)) return res.status(400).json({ error: 'global blocks have no page settings' });
    const filePath = pageFile(id);
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Not found' });

    const page = readJson(filePath);
    const { title = page.title, path: urlPath = page.path, hidden } = req.body || {};
    const invalid = validatePageMeta({ title, path: urlPath }, id);
    if (invalid) return res.status(statusForInvalid(invalid)).json({ error: invalid });

    const nextHidden = hidden === undefined ? !!page.hidden : !!hidden;
    const next = { ...page, title: title.trim(), path: urlPath };
    if (nextHidden) next.hidden = true;
    else delete next.hidden;
    writeJson(filePath, next);

    if (page.path !== urlPath) await notifyStorefront({ path: page.path, deleted: true });
    await notifyStorefront({ path: urlPath });

    const changes = [];
    if (page.title !== next.title) changes.push(`renamed to "${next.title}"`);
    if (page.path !== next.path) changes.push(`moved to ${next.path}`);
    if (!!page.hidden !== nextHidden) changes.push(nextHidden ? 'hidden' : 'shown');
    const git = await commitAndPublish(
      [filePath],
      signedBy(req, `${next.title}: page ${changes.length ? changes.join(', ') : 'settings updated'}`)
    );
    res.json({ id, title: next.title, path: next.path, hidden: nextHidden, ...git });
  });

  app.post('/api/editor/pages/:id/duplicate', refuseWhenSaveDisabled, async (req, res) => {
    const sourceId = req.params.id;
    if (!isSafePageId(sourceId)) return res.status(400).json({ error: 'Bad id' });
    if (isGlobalPageId(sourceId)) return res.status(400).json({ error: 'global blocks cannot be duplicated' });
    const sourceFile = pageFile(sourceId);
    if (!fs.existsSync(sourceFile)) return res.status(404).json({ error: 'Not found' });

    const source = readJson(sourceFile);
    const { title, path: urlPath } = req.body || {};
    const invalid = validatePageMeta({ title, path: urlPath });
    if (invalid) return res.status(statusForInvalid(invalid)).json({ error: invalid });

    const copy = structuredClone(source);
    copy.title = title.trim();
    copy.path = urlPath;
    delete copy.hidden;
    // The copy is a new page an author made: it starts without the built-in
    // components of its source.
    copy.blocks = cloneBlocksWithNewIds(withoutSystemBlocks(source.blocks));

    const id = freePageId(urlPath);
    const filePath = pageFile(id);
    writeJson(filePath, copy);
    await notifyStorefront({ path: urlPath });

    const git = await commitAndPublish(
      [filePath, ...uploadsUsedBy(copy)],
      signedBy(req, `Duplicated "${source.title}" as "${copy.title}" (${urlPath})`)
    );
    res.status(201).json({ id, title: copy.title, path: copy.path, hidden: false, ...git });
  });

  app.delete('/api/editor/pages/:id', refuseWhenSaveDisabled, async (req, res) => {
    const id = req.params.id;
    if (!isSafePageId(id)) return res.status(400).json({ error: 'Bad id' });
    if (isGlobalPageId(id)) return res.status(400).json({ error: 'global blocks cannot be deleted' });
    const filePath = pageFile(id);
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Not found' });

    let removed = null;
    try { removed = readJson(filePath); } catch { /* ignore */ }
    if (hasSystemBlocks(removed)) {
      return res.status(400).json({ error: 'this page holds a built-in component and cannot be deleted — hide it instead' });
    }
    fs.unlinkSync(filePath);
    if (removed?.path) await notifyStorefront({ path: removed.path, deleted: true });

    const git = await commitAndPublish(
      [filePath],
      signedBy(req, `Deleted page "${removed?.title || id}"${removed?.path ? ` (${removed.path})` : ''}`)
    );
    res.json({ ok: true, ...git });
  });

  // --- Route documents ---------------------------------------------------
  // Same shape of API as pages, but the payload is a map of areas rather than
  // one block list, and the `path` points at a route the storefront owns.

  // One subdirectory per route type, so `id` is `<type>/<slug>` throughout.
  const routeFile = (type, id) => path.join(EDITOR_ROUTES_DIR, type, `${id}.json`);
  const isSafeRouteId = (req) => isSafePageId(req.params.type) && isSafePageId(req.params.id);

  const readRouteDocs = () => {
    const out = [];
    for (const entry of fs.readdirSync(EDITOR_ROUTES_DIR, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const typeDir = path.join(EDITOR_ROUTES_DIR, entry.name);
      for (const f of fs.readdirSync(typeDir)) {
        if (!f.endsWith('.json')) continue;
        out.push({ id: `${entry.name}/${f.replace('.json', '')}`, data: readJson(path.join(typeDir, f)) });
      }
    }
    return out;
  };

  app.get('/api/editor/routes', (_req, res) => {
    res.json(readRouteDocs().map(({ id, data }) => ({
      id,
      title: data.title,
      path: data.path,
      routeType: data.route?.type || null,
    })));
  });

  app.get('/api/editor/routes/:type/:id', (req, res) => {
    if (!isSafeRouteId(req)) return res.status(400).json({ error: 'Bad id' });
    const filePath = routeFile(req.params.type, req.params.id);
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Not found' });
    res.json(readJson(filePath));
  });

  app.post('/api/editor/routes', refuseWhenSaveDisabled, (req, res) => {
    const { title, path: urlPath, route, display, areas } = req.body || {};
    if (!urlPath || typeof urlPath !== 'string' || !urlPath.startsWith('/')) {
      return res.status(400).json({ error: 'path must start with /' });
    }
    if (!route || typeof route.type !== 'string') {
      return res.status(400).json({ error: 'route.type is required' });
    }
    const existing = readRouteDocs().find(({ data }) => data.path === urlPath);
    if (existing) return res.status(409).json({ error: 'this URL already has a document', id: existing.id });

    if (!isSafePageId(route.type)) return res.status(400).json({ error: 'Bad route type' });
    const base = urlPath.replace(/^\/+|\/+$/g, '').replace(/\.[a-z0-9]+$/i, '').replace(/[^a-zA-Z0-9_-]+/g, '-') || 'route';
    fs.mkdirSync(path.join(EDITOR_ROUTES_DIR, route.type), { recursive: true });
    let slug = base;
    let i = 2;
    while (fs.existsSync(routeFile(route.type, slug))) slug = `${base}-${i++}`;

    const doc = {
      title: (typeof title === 'string' && title.trim()) || base,
      path: urlPath,
      route,
      display: display || DEFAULT_DISPLAY_MODE,
      areas: areas && typeof areas === 'object' ? areas : {},
    };
    if (hasSystemBlocks(doc)) return res.status(400).json({ error: SYSTEM_BLOCKS_CHANGED });
    writeJson(routeFile(route.type, slug), doc);
    res.status(201).json({ id: `${route.type}/${slug}`, ...doc });
  });

  app.put('/api/editor/routes/:type/:id', refuseWhenSaveDisabled, async (req, res) => {
    if (!isSafeRouteId(req)) return res.status(400).json({ error: 'Bad id' });
    const filePath = routeFile(req.params.type, req.params.id);

    let oldDoc = null;
    try { oldDoc = readJson(filePath); } catch {}

    if (systemBlockKeys(req.body) !== systemBlockKeys(oldDoc)) {
      logError('save', `route "${req.params.type}/${req.params.id}" refused`, SYSTEM_BLOCKS_CHANGED);
      return res.status(400).json({ error: SYSTEM_BLOCKS_CHANGED });
    }

    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    writeJson(filePath, req.body);
    const committed = await commitDoc(req, filePath, oldDoc, req.body || {}, req.params.id);
    res.json({ ok: true, committed });
  });

  app.delete('/api/editor/routes/:type/:id', refuseWhenSaveDisabled, (req, res) => {
    if (!isSafeRouteId(req)) return res.status(400).json({ error: 'Bad id' });
    const filePath = routeFile(req.params.type, req.params.id);
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Not found' });
    let removed = null;
    try { removed = readJson(filePath); } catch { /* ignore */ }
    if (hasSystemBlocks(removed)) {
      return res.status(400).json({ error: 'this document holds a built-in component and cannot be deleted' });
    }
    fs.unlinkSync(filePath);
    res.json({ ok: true });
  });

  app.get('/api/editor/push/status', async (_req, res) => {
    const [status, log] = await Promise.all([
      runGit(['status', '--porcelain', '-z', '--', 'editor-app/content', 'editor-app/public/uploads']),
      runGit(['log', '--reverse', '--pretty=format:%s', '@{u}..HEAD']),
    ]);
    const dirty = status.code === 0 && status.stdout.length > 0;
    if (log.code !== 0) {
      return res.json({ canPush: false, dirty, ahead: 0, commits: [], error: 'git-log-failed' });
    }
    const commits = log.stdout.length === 0
      ? []
      : log.stdout.split('\n').map((s) => s.trim() || '(no message)');
    res.json({ canPush: commits.length > 0, dirty, ahead: commits.length, commits });
  });

  app.post('/api/editor/push', refuseWhenSaveDisabled, async (_req, res) => {
    const result = await syncWithRemote();
    res.status(result.ok ? 200 : 500).json(result);
  });

  app.get('/api/editor/site-settings', (_req, res) => {
    res.json(readSiteSettings());
  });

  app.put('/api/editor/site-settings', refuseWhenSaveDisabled, (req, res) => {
    const m = req.body?.maintenance;
    if (!m || typeof m !== 'object') return res.status(400).json({ error: 'maintenance settings are required' });
    const bad = (Array.isArray(m.allowedIps) ? m.allowedIps : []).find((e) => !net.isIP(String(e?.ip ?? e ?? '').trim()));
    if (bad !== undefined) return res.status(400).json({ error: `"${bad?.ip ?? bad}" is not an IP address` });
    const saved = writeSiteSettings({ ...readSiteSettings(), maintenance: { enabled: !!m.enabled, allowedIps: m.allowedIps || [] } });
    res.json(saved);
  });

  app.post('/api/editor/upload', (req, res) => {
    uploader.single('file')(req, res, (err) => {
      if (err) {
        logError('upload', `"${req.file?.originalname || 'file'}" rejected`, err.message);
        return res.status(400).json({ error: err.message || 'upload failed' });
      }
      if (!req.file) return res.status(400).json({ error: 'file is required' });
      res.json({ url: `/uploads/${req.file.filename}` });
    });
  });

  app.get('/api/render', (req, res) => {
    const reqPath = req.query.path || '/';
    const match = listPages().find(({ data }) => data.path === reqPath && !data.hidden);
    if (match) return res.json({ page: match.data });
    res.status(404).json({ error: 'Page not found' });
  });

  app.use('/api', (err, req, res, _next) => {
    logError('api', `${req.method} ${req.originalUrl} threw`, err);
    console.error('[editor api]', err);
    if (!res.headersSent) res.status(500).json({ error: err?.message || 'internal error' });
  });

  app.all('/api/*', (_req, res) => {
    res.status(404).json({ error: 'Not found' });
  });

  // Uploads are served straight from the folder multer writes into, in both
  // modes. In prod `dist/client/uploads` is only vite's copy of public/ from
  // build time, so a picture uploaded after the build would be invisible until
  // the next one; `dev: true` re-stats the folder per request instead of caching
  // a listing at boot.
  app.use('/uploads', sirv(UPLOADS_DIR, { dev: true }));
  // A missing file has to 404 here, otherwise it falls through to the SSR
  // catch-all below and a broken <img> answers 200 with an HTML document.
  app.use('/uploads', (_req, res) => res.status(404).end());

  if (isProduction) {
    // Mounted under the same fixed base the build was compiled with. Filenames
    // carry a content hash, so a long immutable max-age is safe and a rebuild
    // simply produces new names.
    app.use(EDITOR_BASE_PROD, sirv(DIST_CLIENT_DIR, { maxAge: 31536000, immutable: true }));
    // Same reason as uploads: an asset URL that no longer exists must not be
    // answered with an HTML page, which the browser would try to run as JS.
    app.use(EDITOR_BASE_PROD, (_req, res) => res.status(404).end());
  } else {
    app.use(viteDevServer.middlewares);
  }

  app.get('*', async (req, res, next) => {
    const pageContextInit = {
      urlOriginal: req.originalUrl,
      headersOriginal: req.headers,
    };
    const pageContext = await renderPage(pageContextInit);
    if (pageContext.errorWhileRendering) {
      console.error('[SSR error]', pageContext.errorWhileRendering);
      logError('ssr', `render of ${req.originalUrl} failed`, pageContext.errorWhileRendering);
    }
    const { httpResponse } = pageContext;
    if (!httpResponse) return next();
    const { body, statusCode, headers } = httpResponse;
    headers.forEach(([name, value]) => res.setHeader(name, value));
    // Editor HTML must never be cached: prod redeploy or dev restart bumps
    // BUILD_ID and the embedded JS hashes, but a cached HTML would still
    // reference the previous module URLs and freeze the user on stale code.
    res.set('Cache-Control', UNCACHEABLE);
    res.set('X-Editor-Build', buildVersion());
    res.status(statusCode).send(typeof body === 'string' ? withSiteSettings(body) : body);
  });

  app.listen(port, host, () => {
    console.log(`Editor running at http://${host}:${port} (${isProduction ? 'prod build' : 'vite dev'})`);
  });
}

process.on('unhandledRejection', (reason) => {
  logError('process', 'unhandled rejection', reason);
  console.error('[editor] unhandled rejection', reason);
});

startServer().catch((err) => {
  logError('process', 'editor server failed to start', err);
  console.error(err);
  process.exit(1);
});
console.log(`[editor] errors are logged to ${LOG_FILE}`);
