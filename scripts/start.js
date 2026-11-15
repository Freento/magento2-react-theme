/**
 * Process supervisor for the Docker container - the counterpart of a pm2
 * ecosystem file. One copy of the project is one instance: everything it needs
 * runs inside one container, and the layout is picked from .env:
 *
 *   EDITOR_ENABLED=off                  -> production storefront SSR (server.prod.js)
 *   EDITOR_ENABLED=on, EDITOR_MODE=dev  -> dev mode with the editor (scripts/dev.js -> vite + editor-app)
 *   EDITOR_ENABLED=on, EDITOR_MODE=prod -> two production processes: storefront SSR
 *                                          plus the built editor-app (no vite, no HMR)
 *
 * EDITOR_MODE defaults to dev, the same as the pm2 ecosystem config.
 * Ports come from .env, one per process, so several copies of the project can
 * share a machine:
 *   PORT        - server.prod.js (editor off or in prod mode)
 *   DEV_PORT    - server.dev.js  (editor in dev mode; falls back to PORT)
 *   EDITOR_PORT - editor-app/server.js (editor on)
 *   HMR_PORT    - vite HMR websocket port advertised to the browser
 * The editor listens on loopback only; the storefront proxies /editor to it from
 * inside the same container, so only PORT has to be published.
 *
 * Children get the container's stdout with a [name] prefix. When one of them
 * exits the others are stopped and this process exits with the same code, so
 * docker's restart policy restarts the whole instance rather than leaving half
 * of it running. SIGTERM/SIGINT are forwarded the same way.
 *
 * Run:  node scripts/start.js   (see docker-compose.yml)
 */
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// Values already in the environment win over the file, so a layout can be forced
// for one run: `EDITOR_MODE=prod node scripts/start.js`.
const envFile = path.join(ROOT, '.env');
const fileEnv = fs.existsSync(envFile) ? dotenv.parse(fs.readFileSync(envFile, 'utf8')) : {};
const env = { ...fileEnv, ...process.env };

const EDITOR_ENABLED = String(env.EDITOR_ENABLED ?? 'off').toLowerCase() === 'on';
const EDITOR_MODE = String(env.EDITOR_MODE ?? 'dev').toLowerCase();

const storefront = {
  name: 'storefront',
  args: ['server.prod.js'],
  cwd: ROOT,
  env: { NODE_ENV: 'production' },
};

// Its own cwd on purpose: vike looks the production build up from process.cwd()
// (editor-app/dist/server), exactly as pm2 would run it with `cwd: editor-app`.
const editorProd = {
  name: 'editor',
  args: ['server.js'],
  cwd: path.join(ROOT, 'editor-app'),
  env: { NODE_ENV: 'production' },
};

// Dev mode: scripts/dev.js brings up vite + editor-app itself.
const devAll = {
  name: 'dev',
  args: ['scripts/dev.js'],
  cwd: ROOT,
  env: { NODE_ENV: 'development' },
};

let procs;
if (!EDITOR_ENABLED) procs = [storefront];
else if (EDITOR_MODE === 'prod') procs = [storefront, editorProd];
else procs = [devAll];

console.log(
  `[start] EDITOR_ENABLED=${EDITOR_ENABLED ? 'on' : 'off'}` +
  (EDITOR_ENABLED ? ` EDITOR_MODE=${EDITOR_MODE}` : '') +
  ` -> ${procs.map((p) => p.name).join(' + ')}`,
);

const prefixed = (name, stream, out) => {
  let rest = '';
  stream.on('data', (chunk) => {
    rest += chunk.toString();
    const lines = rest.split('\n');
    rest = lines.pop();
    for (const line of lines) out.write(`[${name}] ${line}\n`);
  });
  stream.on('end', () => { if (rest) out.write(`[${name}] ${rest}\n`); });
};

let shuttingDown = false;
// Code this process leaves with once every child is gone: 0 for a signal-driven
// stop, the failed child's code otherwise - whichever child exits last must not
// overwrite it.
let exitCode = 0;
const children = new Map();

const stopAll = (signal = 'SIGTERM') => {
  for (const child of children.values()) {
    if (child.exitCode === null && !child.killed) child.kill(signal);
  }
};

for (const proc of procs) {
  const child = spawn(process.execPath, proc.args, {
    cwd: proc.cwd,
    env: { ...process.env, ...proc.env },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  prefixed(proc.name, child.stdout, process.stdout);
  prefixed(proc.name, child.stderr, process.stderr);
  children.set(proc.name, child);

  child.on('exit', (code, signal) => {
    children.delete(proc.name);
    if (shuttingDown) {
      if (children.size === 0) process.exit(exitCode);
      return;
    }
    console.error(`[start] ${proc.name} exited (${signal || `code ${code}`}) - stopping the rest`);
    shuttingDown = true;
    // Leave with the failed process's code (non-zero for a signal too) so
    // `restart: unless-stopped` brings the whole instance back.
    exitCode = code || 1;
    stopAll();
    // Give the others a moment to go down cleanly.
    if (children.size === 0) process.exit(exitCode);
    setTimeout(() => process.exit(exitCode), 8000).unref();
  });
}

for (const signal of ['SIGTERM', 'SIGINT']) {
  process.on(signal, () => {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log(`[start] ${signal} - stopping ${[...children.keys()].join(', ')}`);
    stopAll(signal);
    setTimeout(() => process.exit(0), 8000).unref();
  });
}
