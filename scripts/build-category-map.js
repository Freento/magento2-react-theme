import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Build-time index of Magento categories: url_path → uid. Lets the storefront
// resolve a category URL to its id synchronously (no runtime `route` request),
// so category product queries fire immediately and render during SSR.

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(__dirname, '../src/generated/categoryMap.json');

const origin = process.env.GRAPHQL_ORIGIN;
if (!origin) {
  console.error('[catmap] GRAPHQL_ORIGIN is not set — add it to .env');
  process.exit(1);
}
if (String(process.env.GRAPHQL_INSECURE || '').toLowerCase() === 'true') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

const child = (depth) => (depth === 0 ? '' : `children { uid url_path ${child(depth - 1)} }`);
const QUERY = `{ categoryList(filters: {}) { uid url_path ${child(6)} } }`;

const res = await fetch(`${origin.replace(/\/$/, '')}/graphql`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ query: QUERY }),
});
const json = await res.json();
if (json.errors) {
  console.error('[catmap] GraphQL errors:', JSON.stringify(json.errors));
  process.exit(1);
}

const map = {};
const walk = (nodes) => {
  for (const n of nodes || []) {
    if (n.url_path && n.uid) map[n.url_path] = n.uid;
    walk(n.children);
  }
};
walk(json.data?.categoryList || []);

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(map));
console.log(`[catmap] wrote ${Object.keys(map).length} categories → ${path.relative(process.cwd(), OUT)}`);
