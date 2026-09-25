// Instrumentation for the GraphQL work one SSR document costs.
//
// Driven by SSR_DEBUG in .env — deliberately without a VITE_ prefix, so Vite never
// inlines it into the client bundle and nothing here can reach the browser:
//
//   off    (default) nothing is collected; the render pays nothing
//   header response headers only (X-Ssr-*), safe to leave on under load tests
//   log    one line per SSR on stdout
//   file   collect, but emit neither headers nor stdout — the file sink only
//   full   headers and stdout, and the stdout line prints each operation's variables
//
// The file sink is orthogonal to the mode: SSR_DEBUG_FILE, when set, receives one
// NDJSON record per SSR in every mode except `off`. Its records always carry the full
// outgoing request — the point of the file is offline aggregation. The value is a file
// name resolved inside <project>/var/log and confined to it; see sinkPath below.
//
// Env is read per request rather than at module scope, so a process manager that
// re-execs with a changed env picks it up without a code change.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const MODES = new Set(['off', 'header', 'log', 'file', 'full']);

export const ssrDebugMode = () => {
  const raw = String(process.env.SSR_DEBUG || 'off').trim().toLowerCase();
  return MODES.has(raw) ? raw : 'off';
};

export const ssrDebugEnabled = () => ssrDebugMode() !== 'off';

/**
 * Folds the per-render stats of one request into a single record. A request renders
 * twice when Magento rejects the customer token mid-render, and both renders build a
 * fresh ApolloClient — so the whole query set runs again. Tagging each op with its
 * render index is what makes that doubling visible.
 *
 * @param {...({ops: Array<object>}|null)} renders
 * @returns {{ops: Array<object>, renders: number}}
 */
export const mergeStats = (...renders) => {
  const ops = [];
  renders.forEach((stats, i) => {
    for (const op of stats?.ops || []) ops.push({ ...op, render: i + 1 });
  });
  return { ops, renders: renders.length };
};

// `gqlMs` is the SUM of the operations' durations, not wall-clock: queries collected in
// the same pass run concurrently, so the sum routinely exceeds `X-Ssr-Ms`. Read it as
// total Magento work bought, and `X-Ssr-Ms` as what the request actually waited.
const summarize = (merged) => {
  const ops = merged?.ops || [];
  return {
    count:  ops.length,
    gqlMs:  Math.round(ops.reduce((sum, o) => sum + (o.ms || 0), 0)),
    passes: ops.reduce((max, o) => Math.max(max, o.pass), 0),
    errors: ops.reduce((n, o) => n + (o.errors || 0), 0),
    bytes:  ops.reduce((n, o) => n + (o.bytes || 0), 0),
  };
};

const kb = (bytes) => `${(bytes / 1024).toFixed(1)}kb`;

// `p<n>` is the getDataFromTree pass the query started in; `r<n>` the render it
// belonged to, shown only when the request rendered more than once.
const where = (op, renders) => `p${op.pass}${renders > 1 ? `/r${op.render}` : ''}`;

const HEADER_OPS_LIMIT = 3800; // stay well under the usual 8kb header cap

const opsHeader = (merged) => {
  const renders = merged?.renders ?? 1;
  const parts = (merged?.ops || []).map(
    (o) => `${o.name}:${o.ms == null ? 'failed' : `${o.ms}ms`}:${where(o, renders)}`,
  );
  let out = '';
  for (const part of parts) {
    const next = out ? `${out},${part}` : part;
    if (next.length > HEADER_OPS_LIMIT) return `${out},…`;
    out = next;
  }
  return out;
};

// ── NDJSON file sink ───────────────────────────────────────────────────────────
// One append-mode stream is kept open for the process rather than reopening per
// request.
//
// Every filesystem call here is async and off the request path. That is not a
// nicety: fs.mkdirSync(dir, { recursive: true }) can block indefinitely on a
// pathological or stalled path (a hung network mount, a procfs entry), and doing it
// per request would let a debug flag wedge the whole server. Records produced before
// the stream is ready are buffered; if opening fails the sink disables itself and the
// render never learns about it.

const DEFAULT_MAX_MB = 64;
const PENDING_LIMIT = 1000;

let sinkFile = null;                 // path the current sink belongs to
let sinkState = 'idle';              // idle | opening | ready | failed
let sinkStream = null;
let sinkBytes = 0;
let pending = [];                    // lines produced while opening or rotating
let dropped = 0;

// Everything the sink writes stays under <project>/var/log. SSR_DEBUG_FILE names a
// file inside that directory, never a location: an absolute path, or one that climbs
// out with `..`, is refused rather than honoured — a stray value in an .env must not
// be able to point the server's writes at something else on the box. Anchored to this
// module's own location rather than process.cwd(), so the dev server, the prod server
// and the prerenderer all agree on where the log directory is no matter where they
// were started from.
const LOG_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'var', 'log');

let refusedValue = null;  // remembered so a bad value is reported once, not per request

const sinkPath = () => {
  const raw = String(process.env.SSR_DEBUG_FILE || '').trim();
  if (!raw) return null;
  const resolved = path.resolve(LOG_DIR, raw);
  // Equal to LOG_DIR means the value named the directory itself, not a file in it.
  if (resolved === LOG_DIR || !resolved.startsWith(LOG_DIR + path.sep)) {
    if (refusedValue !== raw) {
      refusedValue = raw;
      console.error(
        `[ssr-gql] SSR_DEBUG_FILE must name a file inside ${LOG_DIR} — refusing "${raw}"`,
      );
    }
    return null;
  }
  return resolved;
};

const sinkMaxBytes = () => {
  const mb = Number(process.env.SSR_DEBUG_FILE_MAX_MB);
  return (Number.isFinite(mb) && mb > 0 ? mb : DEFAULT_MAX_MB) * 1024 * 1024;
};

const failSink = (file, err) => {
  if (sinkState === 'failed') return;
  sinkState = 'failed';
  sinkStream = null;
  pending = [];
  console.error(`[ssr-gql] file sink disabled (${file}): ${err.message}`);
};

const flushPending = () => {
  if (sinkState !== 'ready' || !sinkStream) return;
  const queued = pending;
  pending = [];
  for (const line of queued) {
    sinkBytes += Buffer.byteLength(line);
    sinkStream.write(line);
  }
  if (dropped) {
    console.error(`[ssr-gql] dropped ${dropped} record(s) while the file sink was opening`);
    dropped = 0;
  }
};

const queueLine = (line) => {
  if (pending.length >= PENDING_LIMIT) { dropped += 1; return; }
  pending.push(line);
};

const openSink = (file) => {
  sinkState = 'opening';
  fs.promises.mkdir(path.dirname(file), { recursive: true })
    .then(() => fs.promises.stat(file).then((st) => st.size, () => 0))
    .then((size) => {
      // A later SSR_DEBUG_FILE change superseded this open; drop it on the floor.
      if (sinkFile !== file || sinkState !== 'opening') return;
      const stream = fs.createWriteStream(file, { flags: 'a' });
      stream.on('error', (err) => { if (sinkStream === stream) failSink(file, err); });
      sinkStream = stream;
      sinkBytes = size;
      sinkState = 'ready';
      flushPending();
    })
    .catch((err) => { if (sinkFile === file) failSink(file, err); });
};

// Nothing rotates this file for us, and the flag is easy to leave on — so cap it
// ourselves and keep exactly one previous generation.
const rotateSink = () => {
  const file = sinkFile;
  const old = sinkStream;
  sinkState = 'opening';
  sinkStream = null;
  old?.end();
  fs.promises.rename(file, `${file}.1`)
    .catch(() => { /* nothing to rotate yet */ })
    .then(() => { if (sinkFile === file) openSink(file); });
};

// Returns the state to act on, (re)opening the sink when the path first appears or
// changes. Never touches the filesystem synchronously.
const ensureSink = (file) => {
  if (sinkFile !== file) {
    sinkStream?.end();
    sinkFile = file;
    sinkStream = null;
    sinkBytes = 0;
    pending = [];
    dropped = 0;
    sinkState = 'idle';
  }
  if (sinkState === 'idle') openSink(file);
  return sinkState;
};

/**
 * Appends one NDJSON record describing this SSR. No-op unless SSR_DEBUG_FILE is set
 * and SSR_DEBUG is something other than `off`.
 *
 * @param {import('express').Request} req
 * @param {{ops: Array<object>, renders: number}|null} merged
 * @param {number} totalMs
 */
export const writeSsrStats = (req, merged, totalMs) => {
  if (ssrDebugMode() === 'off') return;
  const file = sinkPath();
  if (!file) return;
  const state = ensureSink(file);
  if (state === 'failed') return;
  const s = summarize(merged);
  const line = `${JSON.stringify({
    ts:      new Date().toISOString(),
    method:  req.method,
    url:     req.url,
    renders: merged?.renders ?? 1,
    gql:     s.count,
    passes:  s.passes,
    errors:  s.errors,
    gqlMs:   s.gqlMs,
    bytes:   s.bytes,
    totalMs: Math.round(totalMs),
    // The full outgoing request, verbatim: `method` + `url` (+ `body` for mutations)
    // can be replayed with curl as-is. `query`/`variables` are the same content
    // decoded, so the record stays readable without un-escaping the URL by hand.
    ops: (merged?.ops || []).map((o) => ({
      name: o.name, pass: o.pass, render: o.render,
      ms: o.ms, status: o.status, bytes: o.bytes, errors: o.errors,
      ...(o.error ? { error: o.error } : {}),
      method: o.method, url: o.url,
      ...(o.body ? { body: o.body } : {}),
      query: o.query, variables: o.variables,
    })),
  })}\n`;

  if (state !== 'ready') { queueLine(line); return; }
  // Rotate on the way in, so the record that crosses the cap lands in the new file.
  if (sinkBytes >= sinkMaxBytes()) { queueLine(line); rotateSink(); return; }
  sinkBytes += Buffer.byteLength(line);
  sinkStream.write(line);
};

/**
 * Attaches the counters to the SSR document response. Must be called before send().
 *
 * @param {import('express').Response} res
 * @param {{ops: Array<object>, renders: number}|null} merged
 * @param {number} totalMs  Wall-clock of the whole render, including the re-render.
 */
export const applyDebugHeaders = (res, merged, totalMs) => {
  const mode = ssrDebugMode();
  if (mode !== 'header' && mode !== 'full') return;
  const s = summarize(merged);
  res.set({
    'X-Ssr-Gql-Count':  String(s.count),
    'X-Ssr-Gql-Ms':     String(s.gqlMs),
    'X-Ssr-Gql-Passes': String(s.passes),
    'X-Ssr-Gql-Errors': String(s.errors),
    'X-Ssr-Gql-Bytes':  String(s.bytes),
    'X-Ssr-Renders':    String(merged?.renders ?? 1),
    'X-Ssr-Ms':         String(Math.round(totalMs)),
    'X-Ssr-Gql-Ops':    opsHeader(merged),
  });
};

/**
 * Emits one structured line per SSR. Called after renderApp returns — entry-server's
 * quiet() swallows console output around the render passes themselves.
 *
 * @param {import('express').Request} req
 * @param {{ops: Array<object>, renders: number}|null} merged
 * @param {number} totalMs
 */
export const logSsrStats = (req, merged, totalMs) => {
  const mode = ssrDebugMode();
  if (mode !== 'log' && mode !== 'full') return;
  const s = summarize(merged);
  const renders = merged?.renders ?? 1;
  const detail = (merged?.ops || [])
    .map((o) => {
      const vars = mode === 'full' && o.variables && Object.keys(o.variables).length
        ? ` ${JSON.stringify(o.variables)}`
        : '';
      return `${o.name} ${where(o, renders)} ${o.ms == null ? 'failed' : `${o.ms}ms`} ${kb(o.bytes || 0)}${vars}`;
    })
    .join(' · ');
  console.log(
    `[ssr-gql] ${req.method} ${req.url} renders=${renders} gql=${s.count} ` +
    `passes=${s.passes} errors=${s.errors} gqlMs=${s.gqlMs} totalMs=${Math.round(totalMs)}` +
    (detail ? ` | ${detail}` : ''),
  );
};
