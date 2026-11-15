import fs from 'node:fs';
import path from 'node:path';

const CATEGORY_TREE_QUERY =
  'query getMenuCategoryPaths{categoryList{id url_path url_suffix children{id url_path url_suffix children{id url_path url_suffix children{id url_path url_suffix children{id url_path url_suffix}}}}}}';

const graphqlUrl = (origin) => `${origin.replace(/\/+$/, '')}/graphql`;

export async function fetchCategoryPaths(env = process.env) {
  if (!env.GRAPHQL_ORIGIN) throw new Error('GRAPHQL_ORIGIN is not set');
  if (String(env.GRAPHQL_INSECURE || '').toLowerCase() === 'true') {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  }
  const res = await fetch(graphqlUrl(env.GRAPHQL_ORIGIN), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: CATEGORY_TREE_QUERY, operationName: 'getMenuCategoryPaths', variables: {} }),
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  if (json.errors?.length) throw new Error(json.errors[0]?.message || 'GraphQL error');

  const map = new Map();
  const walk = (nodes) => {
    for (const n of nodes || []) {
      if (n.url_path) {
        const id = Number(n.id);
        map.set(`${n.url_path}${n.url_suffix || ''}`, id);
        map.set(n.url_path, id);
      }
      walk(n.children);
    }
  };
  walk(json?.data?.categoryList);
  return map;
}

export function readEditorPagePaths(dir) {
  const paths = new Set();
  for (const f of fs.readdirSync(dir)) {
    if (!f.endsWith('.json')) continue;
    try {
      const p = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'))?.path;
      if (typeof p === 'string' && !p.startsWith('/__')) paths.add(p);
    } catch {}
  }
  return paths;
}

const siteHost = (env) => {
  try { return new URL(env.GRAPHQL_ORIGIN).hostname; } catch { return ''; }
};

const sitePath = (href, host) => {
  if (!/^[a-z][a-z0-9+.-]*:|^\/\//i.test(href || '')) return (href || '').split(/[?#]/)[0];
  try {
    const u = new URL(href);
    return u.hostname === host ? u.pathname : null;
  } catch { return null; }
};

const hrefKey = (href) => (href || '').replace(/^\/+/, '').replace(/\/+$/, '');

const menuLists = (page) => {
  const menu = page?.blocks?.find((b) => b.component === 'Menu');
  return [menu?.props?.items, ...Object.values(menu?.responsive || {}).map((r) => r?.props?.items)];
};

const eachItem = (page, fn) => {
  const visit = (arr) => {
    for (const it of arr || []) {
      fn(it);
      visit(it.children);
    }
  };
  menuLists(page).forEach(visit);
};

export function applyCategoryIds(page, map, editorPaths = new Set(), env = process.env) {
  const host = siteHost(env);
  const stats = { total: 0, set: 0, cleared: 0, editor: 0 };
  eachItem(page, (it) => {
    stats.total++;
    const own = sitePath(it.href, host);
    const key = own === null ? null : hrefKey(own);
    if (key !== null && editorPaths.has(`/${key}`)) {
      if ('categoryId' in it) { delete it.categoryId; stats.cleared++; }
      stats.editor++;
      return;
    }
    const id = key === null ? null : (map.get(key) ?? map.get(key.replace(/\.html$/i, '')) ?? null);
    if (id) {
      if (it.categoryId !== id) stats.set++;
      it.categoryId = id;
    } else if ('categoryId' in it) {
      delete it.categoryId;
      stats.cleared++;
    }
  });
  return stats;
}

export function carryCategoryIds(page, previous) {
  const known = new Map();
  eachItem(previous, (it) => {
    if (it.href && it.categoryId) known.set(it.href, it.categoryId);
  });
  let carried = 0;
  eachItem(page, (it) => {
    const id = known.get(it.href);
    if (id) { it.categoryId = id; carried++; }
    else delete it.categoryId;
  });
  return carried;
}

export function sameCategoryIds(a, b) {
  const ids = (page) => {
    const out = [];
    eachItem(page, (it) => out.push(`${it.href}=${it.categoryId ?? ''}`));
    return out.join('|');
  };
  return ids(a) === ids(b);
}

export async function bakeMenuCategoryIds(page, previous, pagesDir, env = process.env) {
  try {
    const map = await fetchCategoryPaths(env);
    return { ok: true, ...applyCategoryIds(page, map, readEditorPagePaths(pagesDir), env) };
  } catch (e) {
    return { ok: false, error: e.message, carried: carryCategoryIds(page, previous) };
  }
}
