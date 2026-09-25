import express from 'express';
import compression from 'compression';
import fs from 'node:fs';
import path from 'node:path';
import { execFile } from 'node:child_process';
import multer from 'multer';
import { renderPage } from 'vike/server';
import { DEFAULT_DISPLAY_MODE } from 'editor-core/routes';
import { BUILD_ID, STARTED_AT } from './buildId.js';

const isProduction = process.env.NODE_ENV === 'production';
const port = process.env.PORT || 3100;
const root = process.cwd();

const EDITOR_PAGES_DIR = path.join(root, 'content/pages');
// Route documents — blocks placed into named areas of a storefront route —
// live apart from pages so nothing ever mistakes one for a standalone page.
const EDITOR_ROUTES_DIR = path.join(root, 'content/routes');
const UPLOADS_DIR = path.join(root, 'public/uploads');

fs.mkdirSync(EDITOR_PAGES_DIR, { recursive: true });
fs.mkdirSync(EDITOR_ROUTES_DIR, { recursive: true });
fs.mkdirSync(UPLOADS_DIR, { recursive: true });

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
const writeJson = (file, data) => fs.writeFileSync(file, JSON.stringify(data, null, 2));
const isSafePageId = (id) => typeof id === 'string' && /^[a-zA-Z0-9_-]+$/.test(id);

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
  }

  // Every editor-API GET should be revalidated each time so the authoring
  // UI never works against a stale browser cache.
  app.use('/api/editor', (_req, res, next) => {
    res.set('Cache-Control', 'no-store, must-revalidate');
    next();
  });

  const REPO_DIR = process.env.REPO_DIR || path.resolve(root, '..');
  const runGit = (args) =>
    new Promise((resolve) => {
      execFile('git', args, { cwd: REPO_DIR, timeout: 30_000 }, (err, stdout, stderr) => {
        resolve({ code: err?.code ?? 0, stdout: String(stdout || ''), stderr: String(stderr || ''), error: err?.message || null });
      });
    });

  /**
   * Stages and commits one saved document, describing the edit in the message.
   * A save that changes nothing on disk commits nothing.
   */
  const commitDoc = async (filePath, oldDoc, newDoc, fallbackTitle) => {
    try {
      const relPath = path.relative(REPO_DIR, filePath);
      const title = (typeof newDoc.title === 'string' && newDoc.title.trim()) || fallbackTitle;
      const commitMsg = buildCommitMessage(title, oldDoc, newDoc);
      const logFailure = (step, r) => {
        if (r && r.code !== 0) console.error(`[editor save commit] ${step} (exit ${r.code}):`, r.stderr || r.error || '');
      };
      const add = await runGit(['add', '--', relPath]); logFailure('add', add);
      const status = await runGit(['status', '--porcelain', '--', relPath]); logFailure('status', status);
      if (status.stdout.trim().length === 0) return null;
      const commit = await runGit(['commit', '-m', commitMsg]); logFailure('commit', commit);
      return commit;
    } catch (err) {
      console.error('[editor save commit]', err.message);
      return null;
    }
  };

  // Version handshake. Cheap & frequently polled — keep it small.
  app.get('/api/editor/version', (_req, res) => {
    res.json({ version: BUILD_ID, startedAt: STARTED_AT });
  });

  app.get('/api/editor/pages', (_req, res) => {
    const files = fs.readdirSync(EDITOR_PAGES_DIR).filter((f) => f.endsWith('.json'));
    res.json(
      files.map((f) => {
        const data = readJson(path.join(EDITOR_PAGES_DIR, f));
        return { id: f.replace('.json', ''), title: data.title, path: data.path };
      })
    );
  });

  app.get('/api/editor/pages/:id', (req, res) => {
    if (!isSafePageId(req.params.id)) return res.status(400).json({ error: 'Bad id' });
    const filePath = path.join(EDITOR_PAGES_DIR, `${req.params.id}.json`);
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Not found' });
    res.json(readJson(filePath));
  });

  app.put('/api/editor/pages/:id', async (req, res) => {
    if (!isSafePageId(req.params.id)) return res.status(400).json({ error: 'Bad id' });
    const id = req.params.id;
    const filePath = path.join(EDITOR_PAGES_DIR, `${id}.json`);

    let oldPage = null;
    try { oldPage = readJson(filePath); } catch {}

    writeJson(filePath, req.body);
    await notifyStorefront({ path: req.body?.path });

    const commit = await commitDoc(filePath, oldPage, req.body || {}, id === '__footer__' ? 'Footer' : id);
    res.json({ ok: true, committed: !!commit && commit.code === 0 });
  });

  app.post('/api/editor/pages', async (req, res) => {
    const { title, path: urlPath } = req.body || {};
    if (!title || typeof title !== 'string') {
      return res.status(400).json({ error: 'title is required' });
    }
    if (!urlPath || typeof urlPath !== 'string' || !urlPath.startsWith('/')) {
      return res.status(400).json({ error: 'path must start with /' });
    }
    let id = urlPath.replace(/^\/+|\/+$/g, '').replace(/[^a-zA-Z0-9_-]+/g, '-') || 'home';
    let candidate = id;
    let i = 2;
    while (fs.existsSync(path.join(EDITOR_PAGES_DIR, `${candidate}.json`))) {
      candidate = `${id}-${i++}`;
    }
    const files = fs.readdirSync(EDITOR_PAGES_DIR).filter((f) => f.endsWith('.json'));
    for (const f of files) {
      const data = readJson(path.join(EDITOR_PAGES_DIR, f));
      if (data.path === urlPath) {
        return res.status(409).json({ error: 'a page with this path already exists' });
      }
    }
    const newPage = { title, path: urlPath, blocks: [] };
    writeJson(path.join(EDITOR_PAGES_DIR, `${candidate}.json`), newPage);
    await notifyStorefront({ path: urlPath });
    res.status(201).json({ id: candidate, title, path: urlPath });
  });

  app.delete('/api/editor/pages/:id', async (req, res) => {
    if (!isSafePageId(req.params.id)) return res.status(400).json({ error: 'Bad id' });
    const filePath = path.join(EDITOR_PAGES_DIR, `${req.params.id}.json`);
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Not found' });
    let removedPath = null;
    try { removedPath = readJson(filePath).path; } catch { /* ignore */ }
    fs.unlinkSync(filePath);
    if (removedPath) await notifyStorefront({ path: removedPath, deleted: true });
    res.json({ ok: true });
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

  app.post('/api/editor/routes', (req, res) => {
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
    writeJson(routeFile(route.type, slug), doc);
    res.status(201).json({ id: `${route.type}/${slug}`, ...doc });
  });

  app.put('/api/editor/routes/:type/:id', async (req, res) => {
    if (!isSafeRouteId(req)) return res.status(400).json({ error: 'Bad id' });
    const filePath = routeFile(req.params.type, req.params.id);

    let oldDoc = null;
    try { oldDoc = readJson(filePath); } catch {}

    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    writeJson(filePath, req.body);
    const commit = await commitDoc(filePath, oldDoc, req.body || {}, req.params.id);
    res.json({ ok: true, committed: !!commit && commit.code === 0 });
  });

  app.delete('/api/editor/routes/:type/:id', (req, res) => {
    if (!isSafeRouteId(req)) return res.status(400).json({ error: 'Bad id' });
    const filePath = routeFile(req.params.type, req.params.id);
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Not found' });
    fs.unlinkSync(filePath);
    res.json({ ok: true });
  });

  app.get('/api/editor/push/status', async (_req, res) => {
    const status = await runGit(['status', '--porcelain', '--', 'editor-app/content', 'editor-app/public/uploads']);
    const ahead = await runGit(['rev-list', '--count', '@{u}..HEAD']);
    const dirty = status.code === 0 && status.stdout.trim().length > 0;
    const aheadCount = ahead.code === 0 ? Number(ahead.stdout.trim() || 0) : 0;
    res.json({ canPush: dirty || aheadCount > 0, dirty, ahead: aheadCount });
  });

  app.post('/api/editor/push', async (_req, res) => {
    const push = await runGit(['push']);
    if (push.code !== 0) {
      return res.status(500).json({ ok: false, steps: [{ step: 'push', ...push }], error: 'push failed' });
    }
    res.json({ ok: true, steps: [{ step: 'push', ...push }] });
  });

  app.post('/api/editor/upload', (req, res) => {
    uploader.single('file')(req, res, (err) => {
      if (err) return res.status(400).json({ error: err.message || 'upload failed' });
      if (!req.file) return res.status(400).json({ error: 'file is required' });
      res.json({ url: `/uploads/${req.file.filename}` });
    });
  });

  app.get('/api/render', (req, res) => {
    const reqPath = req.query.path || '/';
    const files = fs.readdirSync(EDITOR_PAGES_DIR).filter((f) => f.endsWith('.json'));
    for (const f of files) {
      const data = readJson(path.join(EDITOR_PAGES_DIR, f));
      if (data.path === reqPath) return res.json({ page: data });
    }
    res.status(404).json({ error: 'Page not found' });
  });

  app.all('/api/*', (_req, res) => {
    res.status(404).json({ error: 'Not found' });
  });

  if (isProduction) {
    const sirv = (await import('sirv')).default;
    app.use(sirv(`${root}/dist/client`));
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
    }
    const { httpResponse } = pageContext;
    if (!httpResponse) return next();
    const { body, statusCode, headers } = httpResponse;
    headers.forEach(([name, value]) => res.setHeader(name, value));
    // Editor HTML must never be cached: prod redeploy or dev restart bumps
    // BUILD_ID and the embedded JS hashes, but a cached HTML would still
    // reference the previous module URLs and freeze the user on stale code.
    res.set('Cache-Control', 'no-store, must-revalidate');
    res.set('X-Editor-Build', BUILD_ID);
    res.status(statusCode).send(body);
  });

  app.listen(port, () => {
    console.log(`Editor running at http://localhost:${port}`);
  });
}

startServer();
