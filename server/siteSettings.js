import fs from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/**
 * Site-wide settings shared by the storefront, the editor and the CLI. Kept out
 * of git (var/ is ignored): the editor commits and pushes content, and a
 * maintenance switch must never travel to another environment with a deploy.
 */
export const SITE_SETTINGS_FILE = path.join(ROOT, 'var/site-settings.json');

export const MAINTENANCE_PAGE_PATH = '/__maintenance__';

const DEFAULTS = { maintenance: { enabled: false, allowedIps: [] } };

const normalize = (data) => {
  const m = data?.maintenance || {};
  return {
    ...data,
    maintenance: {
      enabled: !!m.enabled,
      allowedIps: (Array.isArray(m.allowedIps) ? m.allowedIps : [])
        .map((e) => (typeof e === 'string' ? { ip: e, label: '' } : { ip: String(e?.ip || '').trim(), label: String(e?.label || '').trim() }))
        .filter((e) => net.isIP(e.ip)),
    },
  };
};

let cache = { mtime: -1, value: normalize(DEFAULTS) };

/**
 * The current settings. Cheap enough to call on every request: the file is only
 * re-read when its mtime changes.
 *
 * @returns {{ maintenance: { enabled: boolean, allowedIps: Array<{ip: string, label: string}> } }}
 */
export function readSiteSettings() {
  let mtime = 0;
  try { mtime = fs.statSync(SITE_SETTINGS_FILE).mtimeMs; } catch { return normalize(DEFAULTS); }
  if (mtime !== cache.mtime) {
    let value = normalize(DEFAULTS);
    try { value = normalize(JSON.parse(fs.readFileSync(SITE_SETTINGS_FILE, 'utf8'))); } catch {}
    cache = { mtime, value };
  }
  return cache.value;
}

/**
 * Replaces the settings file (written to a temp file and renamed, so a reader
 * never sees half of it).
 *
 * @param {object} next
 * @returns {object} the normalized settings that were written
 */
export function writeSiteSettings(next) {
  const value = normalize(next);
  fs.mkdirSync(path.dirname(SITE_SETTINGS_FILE), { recursive: true });
  const tmp = `${SITE_SETTINGS_FILE}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, `${JSON.stringify(value, null, 2)}\n`);
  fs.renameSync(tmp, SITE_SETTINGS_FILE);
  return value;
}

/**
 * The visitor's address: the first X-Forwarded-For hop (the web server in front
 * of Node adds it), otherwise the socket's.
 *
 * @param {import('express').Request} req
 * @returns {string}
 */
export function clientIp(req) {
  const forwarded = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  return (forwarded || req.socket?.remoteAddress || '').replace(/^::ffff:/, '');
}

/**
 * Whether this request gets the maintenance page instead of the site.
 *
 * @param {import('express').Request} req
 * @returns {boolean}
 */
export function isMaintenanceFor(req) {
  const { maintenance } = readSiteSettings();
  if (!maintenance.enabled) return false;
  const ip = clientIp(req);
  return !maintenance.allowedIps.some((e) => e.ip === ip);
}
