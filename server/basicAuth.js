import { createHmac, timingSafeEqual } from 'node:crypto';
import expressBasicAuth from 'express-basic-auth';
import { readCookieFrom } from '../src/lib/cookies.js';

/**
 * Reads one Basic Auth block from env. Enabled but with empty credentials ->
 * warns and stays inactive (pass-through) rather than locking everyone out.
 *
 * @param {string} prefix        env prefix, e.g. 'BASIC_AUTH' or 'EDITOR_AUTH'
 * @param {string} defaultRealm  realm used when <prefix>_REALM is empty
 * @returns {{ active: boolean, user: string, password: string, realm: string }}
 */
function readConfig(prefix, defaultRealm) {
  const enabled = String(process.env[`${prefix}_ENABLED`] || '').toLowerCase() === 'true';
  const user = process.env[`${prefix}_USER`] || '';
  const password = process.env[`${prefix}_PASSWORD`] || '';
  const realm = (process.env[`${prefix}_REALM`] || defaultRealm).replace(/"/g, '');

  if (enabled && (!user || !password)) {
    console.warn(`[basic-auth] ${prefix}_ENABLED is true but USER/PASSWORD are empty - auth disabled`);
  }

  return { active: enabled && Boolean(user) && Boolean(password), user, password, realm };
}

/** Site-wide guard config (staging protection). */
export function readBasicAuthConfig() {
  return readConfig('BASIC_AUTH', 'Restricted');
}

/**
 * Editor gate config - a shared pair in front of the Magento admin sign-in,
 * separate from the site-wide one. Optional: with EDITOR_AUTH_USER/PASSWORD
 * empty the editor relies on the admin sign-in alone, so no warning here.
 */
export function readEditorGateConfig() {
  const enabled = String(process.env.EDITOR_AUTH_ENABLED || '').toLowerCase() === 'true';
  const user = process.env.EDITOR_AUTH_USER || '';
  const password = process.env.EDITOR_AUTH_PASSWORD || '';
  const realm = (process.env.EDITOR_AUTH_REALM || 'Editor').replace(/"/g, '');
  return { active: enabled && Boolean(user) && Boolean(password), user, password, realm };
}

/**
 * Builds a guard accepting any one of `pairs`. The reduce runs over every pair
 * without short-circuiting, so the work does not depend on which one matched.
 *
 * @param {Array<{user: string, password: string}>} pairs
 * @param {string} realm
 */
const guardFor = (pairs, realm) =>
  expressBasicAuth({
    // safeCompare = constant-time; bitwise & compares both fields, no timing leak.
    authorizer: (reqUser, reqPass) =>
      pairs.reduce(
        (ok, pair) =>
          ok |
          (expressBasicAuth.safeCompare(reqUser, pair.user) &
            expressBasicAuth.safeCompare(reqPass, pair.password)),
        0,
      ),
    challenge: true,
    realm,
  });

/**
 * Site-wide HTTP Basic Auth (pass-through when disabled). Guards the HTTP chain
 * only - WebSocket upgrades bypass Express and are not covered.
 *
 * The editor gate credentials open this guard too, and so does whatever
 * `passes` accepts (the storefront passes a live editor session). Someone
 * editing content at /editor loads pictures from /uploads and lets the preview
 * query /graphql; neither is an editor route, so without this they would 401 as
 * subresources - silently, since browsers raise no prompt for those.
 *
 * @param {{ passes?: (req: import('express').Request) => boolean }} [options]
 * @returns {import('express').RequestHandler}
 */
export function basicAuth({ passes = () => false } = {}) {
  const config = readBasicAuthConfig();
  if (!config.active) return (_req, _res, next) => next();

  const editor = readEditorGateConfig();
  const guard = guardFor([config, ...(editor.active ? [editor] : [])], config.realm);

  return (req, res, next) => {
    // The Magento customer token rides in the same `Authorization` header as
    // Basic Auth. A request that already carries a bearer token has passed
    // Magento's login, so it is let through instead of being challenged again.
    const header = req.headers.authorization || '';
    if (header.startsWith('Bearer ')) return next();
    if (passes(req)) return next();
    return guard(req, res, next);
  };
}

const EDITOR_GATE_COOKIE = 'editor_gate';
const EDITOR_GATE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

const gateKeyFor = ({ user, password }) =>
  createHmac('sha256', password).update(`editor-gate:${user}`).digest();

const signExpiry = (expiry, key) => createHmac('sha256', key).update(expiry).digest('base64url');

const issueGateToken = (key) => {
  const expiry = String(Date.now() + EDITOR_GATE_TTL_MS);
  return `${expiry}.${signExpiry(expiry, key)}`;
};

const isGateTokenValid = (token, key) => {
  const [expiry, signature, ...rest] = String(token || '').split('.');
  if (!expiry || !signature || rest.length) return false;
  const expected = Buffer.from(signExpiry(expiry, key));
  const given = Buffer.from(signature);
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return false;
  return Number(expiry) > Date.now();
};

const isHttps = (req) =>
  req.secure || String(req.headers['x-forwarded-proto'] || '').split(',')[0].trim() === 'https';

/**
 * Editor gate (pass-through when disabled): HTTP Basic Auth with the shared
 * editor pair, the outer layer on the editor routes. It keeps the Magento admin
 * sign-in form and its API away from anyone without the pair, so password
 * guessing never reaches Magento through the editor.
 *
 * Deliberately without the bearer bypass above: nothing under /editor speaks to
 * Magento with a customer token, so the bypass would buy nothing here and would
 * turn the guard into something a single request header walks past.
 *
 * @returns {import('express').RequestHandler}
 */
export function editorGate() {
  const config = readEditorGateConfig();
  if (!config.active) return (_req, _res, next) => next();

  const guard = guardFor([config], config.realm);
  const key = gateKeyFor(config);

  return (req, res, next) => {
    if (isGateTokenValid(readCookieFrom(req.headers.cookie, EDITOR_GATE_COOKIE), key)) {
      return next();
    }
    return guard(req, res, () => {
      res.cookie(EDITOR_GATE_COOKIE, issueGateToken(key), {
        httpOnly: true,
        secure: isHttps(req),
        sameSite: 'lax',
        maxAge: EDITOR_GATE_TTL_MS,
        path: '/',
      });
      next();
    });
  };
}
