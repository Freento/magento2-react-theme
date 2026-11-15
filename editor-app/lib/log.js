import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const LOG_FILE = process.env.EDITOR_LOG_FILE || path.join(ROOT, 'var/log/editor.log');
const MAX_BYTES = 5 * 1024 * 1024;

const rotate = () => {
  try {
    if (fs.statSync(LOG_FILE).size < MAX_BYTES) return;
    fs.renameSync(LOG_FILE, `${LOG_FILE}.1`);
  } catch {}
};

const flatten = (value) => {
  if (value == null) return '';
  if (value instanceof Error) return value.stack || value.message;
  if (typeof value === 'string') return value;
  try { return JSON.stringify(value); } catch { return String(value); }
};

/**
 * Appends one error record to the editor log: a timestamped header line and
 * the details indented under it. Never throws; logging must not break a save.
 *
 * @param {string} scope   where it happened, e.g. "save", "git", "client"
 * @param {string} message one-line summary
 * @param {unknown} [details]
 */
export function logError(scope, message, details) {
  try {
    fs.mkdirSync(path.dirname(LOG_FILE), { recursive: true });
    rotate();
    const body = flatten(details);
    const lines = [`[${new Date().toISOString()}] ERROR ${scope}: ${message}`];
    if (body) lines.push(...body.split('\n').map((l) => `    ${l}`));
    fs.appendFileSync(LOG_FILE, `${lines.join('\n')}\n`);
  } catch {}
}
