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
export const EDITOR_BASE = `/_editor/${BUILD_ID}/`;
