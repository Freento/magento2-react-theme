import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Runtime category index (url_path → uid). Seeded from the build-time file and
// refreshed hourly so category URLs resolve to ids without a per-request query.

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SEED_PATH = path.resolve(__dirname, '../src/generated/categoryMap.json');

const childFragment = (depth) => (depth === 0 ? '' : `children { uid url_path ${childFragment(depth - 1)} }`);
const QUERY = `{ categoryList(filters: {}) { uid url_path ${childFragment(6)} } }`;

/** Fetches the category map from Magento, or null on failure. */
export async function fetchCategoryMap() {
  const origin = process.env.GRAPHQL_ORIGIN;
  if (!origin) return null;
  if (String(process.env.GRAPHQL_INSECURE || '').toLowerCase() === 'true') {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  }
  try {
    const res = await fetch(`${origin.replace(/\/$/, '')}/graphql`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: QUERY }),
    });
    const json = await res.json();
    if (json.errors) {
      console.error('[categoryMap]', JSON.stringify(json.errors));
      return null;
    }
    const map = {};
    const walk = (nodes) => {
      for (const n of nodes || []) {
        if (n.url_path && n.uid) map[n.url_path] = n.uid;
        walk(n.children);
      }
    };
    walk(json.data?.categoryList || []);
    return map;
  } catch (e) {
    console.error('[categoryMap]', e.message);
    return null;
  }
}

let current = {};
try { current = JSON.parse(fs.readFileSync(SEED_PATH, 'utf8')); } catch {}

export function getCategoryMap() {
  return current;
}

export function resolveCategoryFromMap(pathname) {
  const requestPath = pathname.replace(/^\/+/, '');
  const urlPath = requestPath.replace(/\.html$/, '');
  const uid = current[urlPath];
  if (!uid) return null;
  return { type: 'category', uid, id: Number(atob(uid)), path: requestPath };
}

export function startCategoryMapRefresh(intervalMs = 3600_000) {
  const run = async () => {
    const next = await fetchCategoryMap();
    if (next && Object.keys(next).length) current = next;
  };
  run();
  const timer = setInterval(run, intervalMs);
  timer.unref?.();
  return timer;
}
