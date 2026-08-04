import fs from 'node:fs';
import path from 'node:path';

const PAGES_DIR = path.join(process.cwd(), 'content/pages');

export function loadEditorPage(id) {
  const file = path.join(PAGES_DIR, `${id}.json`);
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, 'utf-8'));
}

export function loadEditorPageByPath(urlPath) {
  if (!fs.existsSync(PAGES_DIR)) return null;
  const files = fs.readdirSync(PAGES_DIR).filter((f) => f.endsWith('.json'));
  for (const f of files) {
    const data = JSON.parse(fs.readFileSync(path.join(PAGES_DIR, f), 'utf-8'));
    if (data.path === urlPath) return data;
  }
  return null;
}
