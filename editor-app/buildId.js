const KEY = Symbol.for('editor.buildId');

if (!globalThis[KEY]) {
  const stamp = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 8);
  globalThis[KEY] = {
    BUILD_ID: `${stamp}-${rand}`,
    STARTED_AT: new Date().toISOString(),
  };
}

export const BUILD_ID = globalThis[KEY].BUILD_ID;
export const STARTED_AT = globalThis[KEY].STARTED_AT;

// Dev base. A per-process id busts the browser cache, so a restarted vite is
// never asked for modules that died with the previous process.
export const EDITOR_BASE = `/_editor/${BUILD_ID}/`;

// Prod base. Deliberately id-free: vite content-hashes every built asset, and a
// base that changed per process would have to be matched by the static mount —
// rebuilding a running server would then orphan every asset URL in the freshly
// written index.html. The storefront proxies the whole `/_editor/` prefix, so
// both bases arrive here either way.
export const EDITOR_BASE_PROD = '/_editor/';
