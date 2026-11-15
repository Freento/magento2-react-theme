import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { fetchCategoryPaths, applyCategoryIds, readEditorPagePaths, sameCategoryIds } from '../server/menuCategoryIds.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const PAGES_DIR = path.join(ROOT, 'editor-app/content/pages');
const MENU_PATH = path.join(PAGES_DIR, '__menu__.json');
const rel = path.relative(ROOT, MENU_PATH);

if (!fs.existsSync(MENU_PATH)) {
  console.log(`[resolve-menu-ids] no ${rel}, skipping`);
  process.exit(0);
}
if (!process.env.GRAPHQL_ORIGIN) {
  console.error('[resolve-menu-ids] GRAPHQL_ORIGIN is not set, keeping the ids saved by the editor');
  process.exit(0);
}

const raw = fs.readFileSync(MENU_PATH, 'utf8');
const before = JSON.parse(raw);
const page = JSON.parse(raw);

let map;
try {
  map = await fetchCategoryPaths();
} catch (e) {
  console.error(`[resolve-menu-ids] category tree request failed (${e.message}), keeping the ids saved by the editor`);
  process.exit(0);
}

const { total, set, cleared, editor } = applyCategoryIds(page, map, readEditorPagePaths(PAGES_DIR));
const missing = [];
const walk = (arr) => (arr || []).forEach((it) => {
  if (!it.categoryId && it.href && it.href !== '#') missing.push(it.href);
  walk(it.children);
});
walk(page.blocks?.find((b) => b.component === 'Menu')?.props?.items);

if (sameCategoryIds(before, page)) {
  console.log(`[resolve-menu-ids] ${rel} is up to date (items=${total}, editor pages=${editor})`);
} else {
  fs.writeFileSync(MENU_PATH, JSON.stringify(page, null, 2) + '\n');
  console.log(`[resolve-menu-ids] updated ${rel}: items=${total}, set=${set}, cleared=${cleared}, editor pages=${editor}`);
}
if (missing.length) console.log(`[resolve-menu-ids] no category for: ${missing.join(', ')}`);
