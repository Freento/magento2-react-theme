import fs from 'node:fs';
import path from 'node:path';

/**
 * Route-area documents live in their own directory, deliberately apart from
 * `content/pages`: both servers and the prerender look a page up by its `path`
 * and render whatever they find as a standalone page, so a document keyed on
 * `/gear.html` sitting there would shadow the category instead of decorating it.
 *
 * Inside, one subdirectory per route type (`routes/category/gear.json`); a file
 * sitting loose at the top level belongs to no type and is skipped.
 *
 * @param {string} dir
 * @returns {Array<object>}
 */
export function readRouteAreas(dir) {
  let types;
  try { types = fs.readdirSync(dir, { withFileTypes: true }); } catch { return []; }
  const out = [];
  for (const type of types) {
    if (!type.isDirectory()) continue;
    const typeDir = path.join(dir, type.name);
    let files;
    try { files = fs.readdirSync(typeDir); } catch { continue; }
    for (const f of files) {
      if (!f.endsWith('.json')) continue;
      try { out.push(JSON.parse(fs.readFileSync(path.join(typeDir, f), 'utf8'))); } catch {}
    }
  }
  return out.filter((doc) => doc && typeof doc.path === 'string');
}

/**
 * The paths that have a document. This — not the documents themselves — is what
 * every response carries, so a category the visitor never opens costs nothing
 * beyond its path.
 *
 * @param {Array<object>} docs
 * @returns {Array<string>}
 */
export const routeAreaPaths = (docs) => docs.map((doc) => doc.path);

/**
 * @param {Array<object>} docs
 * @param {string} pathname
 * @returns {object|null}
 */
export const findRouteArea = (docs, pathname) =>
  (pathname ? docs.find((doc) => doc.path === pathname) : null) || null;
