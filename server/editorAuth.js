import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';
import express from 'express';
import { readCookieFrom } from '../src/lib/cookies.js';
import { editorGate, readEditorGateConfig } from './basicAuth.js';
import { editorLoginPage } from './editorLoginPage.js';

const SESSION_COOKIE = 'editor_session';
// Magento's own admin token lifetime (oauth/access_token_lifetime/admin) is the
// real limit; this is the fallback when the token does not say when it expires.
const FALLBACK_TTL_MS = 4 * 60 * 60 * 1000;
// A successful Magento check is trusted for this long, so a burst of uploads
// or a save that writes several areas costs one round trip, not one per request.
const VERIFY_TTL_MS = 60 * 1000;
const MAGENTO_TIMEOUT_MS = 10_000;

// Failed sign-ins, counted per window. The per-user limit stays under Magento's
// own lock (oauth/authentication_lock/max_failures_count, 6 by default), so the
// editor can never lock an admin out of Magento; the per-IP one stops a single
// address from walking through user names. Refused attempts never reach Magento.
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_LIMITS = { ipUser: 3, user: 5, ip: 10 };
// Upper bound for every in-memory store here, so a flood of distinct keys costs
// a few megabytes at most.
const STORE_MAX_ENTRIES = 10_000;

// The editor app reads who is signing its commits from this header. The guard
// always drops whatever the browser sent under this name before setting its own.
export const EDITOR_USER_HEADER = 'x-editor-user';
// Lets the editor page tell "sign in again" apart from any other refusal.
const AUTH_REQUIRED_HEADER = 'X-Editor-Auth';

let warnedIncomplete = false;

/**
 * Editor sign-in config. Enabled but incomplete -> warns and stays inactive
 * (pass-through) rather than locking everyone out.
 *
 * @returns {{ active: boolean, secret: string, origin: string }}
 */
export function readEditorAuthConfig() {
  const enabled = String(process.env.EDITOR_ADMIN_AUTH_ENABLED || '').toLowerCase() === 'true';
  const secret = process.env.EDITOR_ADMIN_AUTH_SECRET || '';
  // The same Magento the storefront's GraphQL goes to; /rest is routed to it alike.
  const origin = (process.env.GRAPHQL_ORIGIN || '').replace(/\/+$/, '');

  if (enabled && (!secret || !origin) && !warnedIncomplete) {
    warnedIncomplete = true;
    console.warn('[editor-auth] EDITOR_ADMIN_AUTH_ENABLED is true but EDITOR_ADMIN_AUTH_SECRET or GRAPHQL_ORIGIN is empty - admin sign-in disabled');
  }

  return { active: enabled && Boolean(secret) && Boolean(origin), secret, origin };
}

const keyFor = (secret) => createHash('sha256').update(`editor-session:${secret}`).digest();

/** Cookie = base64url(iv | auth tag | AES-256-GCM of the session JSON). */
const sealSession = (session, key) => {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const body = Buffer.concat([cipher.update(JSON.stringify(session), 'utf8'), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), body]).toString('base64url');
};

const openSession = (sealed, key) => {
  try {
    const raw = Buffer.from(String(sealed || ''), 'base64url');
    if (raw.length < 29) return null;
    const decipher = createDecipheriv('aes-256-gcm', key, raw.subarray(0, 12));
    decipher.setAuthTag(raw.subarray(12, 28));
    const json = Buffer.concat([decipher.update(raw.subarray(28)), decipher.final()]).toString('utf8');
    const session = JSON.parse(json);
    if (!session?.token || !session?.username || !(Number(session.exp) > Date.now())) return null;
    return session;
  } catch {
    return null;
  }
};

const readSession = (req, key) => openSession(readCookieFrom(req.headers.cookie, SESSION_COOKIE), key);

/**
 * True when the request carries a live editor session. The site-wide guard uses
 * it: the editor page loads /uploads and its preview queries /graphql, neither
 * of which is an editor route.
 */
export function hasEditorSession(req) {
  const config = readEditorAuthConfig();
  return config.active && readSession(req, keyFor(config.secret)) !== null;
}

// The Node server sits behind a TLS-terminating front, so `req.secure` alone is
// false in production; the forwarded proto is what tells https from local http.
const isHttps = (req) =>
  req.secure || String(req.headers['x-forwarded-proto'] || '').split(',')[0].trim() === 'https';

const cookieOptions = (req) => ({ httpOnly: true, secure: isHttps(req), sameSite: 'lax', path: '/' });

/** Admin tokens are JWTs since 2.4.4; `uid` is the admin user id, `exp` is in seconds. */
const readTokenClaims = (token) => {
  try {
    const payload = JSON.parse(Buffer.from(String(token).split('.')[1] || '', 'base64url').toString('utf8'));
    return { uid: Number(payload.uid) || null, exp: Number(payload.exp) * 1000 || null };
  } catch {
    return { uid: null, exp: null };
  }
};

/**
 * One Magento REST call. Network errors and timeouts come back as status 0, so
 * callers only ever branch on a number.
 */
const magento = async (origin, endpoint, { method = 'GET', token, body } = {}) => {
  try {
    const res = await fetch(`${origin}/rest/V1/${endpoint}`, {
      method,
      headers: {
        Accept: 'application/json',
        ...(body ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(MAGENTO_TIMEOUT_MS),
    });
    const data = await res.json().catch(() => null);
    return { status: res.status, data };
  } catch (err) {
    console.error('[editor-auth] Magento request failed:', endpoint, err.message);
    return { status: 0, data: null };
  }
};

// Any role that may edit CMS pages in the admin may edit the storefront content.
// Magento checks the ACL on every REST call, so this also catches a role that
// lost the right after the admin signed in.
const checkContentAccess = (origin, token) =>
  magento(origin, 'cmsPage/search?searchCriteria[pageSize]=1', { token });

/**
 * A Map of entries that expire `ttl` after they were created, capped at
 * STORE_MAX_ENTRIES. A Map iterates in insertion order, so the oldest entries
 * are always at the front: pruning walks from there and stops at the first live
 * one, which keeps each call cheap however many entries the store holds.
 */
const createExpiringStore = (ttl) => {
  const entries = new Map();

  const prune = (now) => {
    for (const [k, entry] of entries) {
      if (now - entry.at < ttl && entries.size < STORE_MAX_ENTRIES) break;
      entries.delete(k);
    }
  };

  return {
    get(k) {
      const entry = entries.get(k);
      if (!entry) return null;
      if (Date.now() - entry.at < ttl) return entry;
      entries.delete(k);
      return null;
    },
    /** Starts a fresh window for `k`, moving it to the back of the order. */
    start(k, value) {
      const now = Date.now();
      entries.delete(k);
      prune(now);
      const entry = { at: now, ...value };
      entries.set(k, entry);
      return entry;
    },
    delete(k) {
      entries.delete(k);
    },
  };
};

// Node sits behind reverse proxies, which each append the address they got the
// request from to X-Forwarded-For. Entries to the left of the ones our own
// proxies added can be anything the client sent, so the client is the rightmost
// address that is not one of ours (loopback or private).
const PRIVATE_ADDRESS = /^(127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|::1$|f[cd][0-9a-f]{2}:|fe80:)/i;
const clientIp = (req) => {
  const forwarded = String(req.headers['x-forwarded-for'] || '')
    .split(',')
    .map((a) => a.trim().replace(/^::ffff:/, ''))
    .filter(Boolean);
  for (let i = forwarded.length - 1; i >= 0; i -= 1) {
    if (!PRIVATE_ADDRESS.test(forwarded[i])) return forwarded[i];
  }
  return String(req.socket?.remoteAddress || '').replace(/^::ffff:/, '') || 'unknown';
};

/**
 * The Magento admin sign-in (pass-through when disabled). Sign-in uses Magento
 * admin credentials: the guard trades them for an admin
 * token, checks that the role may edit CMS pages, and keeps the token in an
 * encrypted session cookie that expires with the token. Every request that
 * changes something checks the token with Magento again, so an admin whose
 * token was invalidated (Force Sign-In) or whose role lost the CMS right stops
 * at the next save. Reads only check the cookie.
 *
 * With Magento_TwoFactorAuth on, the right password is followed by a Google
 * Authenticator code (the other 2FA providers cannot work outside the admin).
 *
 * Failed sign-ins, wrong 2FA codes included, are limited per IP and user name
 * (3), per user name (5) and per IP (10) within 15 minutes; past a limit the
 * guard answers 429 without asking Magento.
 *
 * Refusals are 403, never 401: the hosting firewall bans an IP that collects
 * enough 401s, and a background poll after the session expires would collect
 * them fast.
 *
 * @returns {import('express').RequestHandler}
 */
function adminSignIn() {
  const config = readEditorAuthConfig();
  if (!config.active) {
    return (req, _res, next) => {
      delete req.headers[EDITOR_USER_HEADER];
      next();
    };
  }

  const key = keyFor(config.secret);
  const verified = createExpiringStore(VERIFY_TTL_MS);
  const failures = createExpiringStore(LOGIN_WINDOW_MS);
  const parseJson = express.json({ limit: '4kb' });

  const remember = (token) => verified.start(token);

  // Magento compares user names case-insensitively, so the counters do too.
  const failureKeys = (ip, username) => {
    const user = username.toLowerCase();
    return { ipUser: `ip-user:${ip}:${user}`, user: `user:${user}`, ip: `ip:${ip}` };
  };

  /** Seconds until the first exhausted limit frees up, or 0 when none is. */
  const lockedFor = (keys) => {
    let wait = 0;
    for (const [limit, k] of Object.entries(keys)) {
      const entry = failures.get(k);
      if (entry && entry.count >= LOGIN_LIMITS[limit]) {
        wait = Math.max(wait, Math.ceil((entry.at + LOGIN_WINDOW_MS - Date.now()) / 1000));
      }
    }
    return wait;
  };

  const countFailure = (keys) => {
    for (const k of Object.values(keys)) {
      const entry = failures.get(k);
      if (entry) entry.count += 1;
      else failures.start(k, { count: 1 });
    }
  };

  const refuse = (req, res, status, error) => {
    res.set('Cache-Control', 'no-store');
    res.set(AUTH_REQUIRED_HEADER, 'required');
    res.clearCookie(SESSION_COOKIE, cookieOptions(req));
    const wantsPage = req.method === 'GET' && req.baseUrl === '/editor' && req.accepts(['html', 'json']) === 'html';
    if (wantsPage) return res.status(200).type('html').send(editorLoginPage());
    return res.status(status).json({ error });
  };

  // With Magento_TwoFactorAuth on, the right password alone is answered with
  // 400 instead of a token. The parameters tell the cases apart without relying
  // on the (translatable) message: `active_providers` alone means the admin has
  // 2FA set up and has to send a code; `providers` too means 2FA still has to be
  // set up in the admin, and Magento has just emailed the admin how.
  const refuseForTfa = (res, username, data) => {
    const params = data?.parameters || {};
    const active = Array.isArray(params.active_providers) ? params.active_providers : null;
    if (!active) return res.status(502).json({ error: data?.message || 'Magento did not answer, try again' });
    if (Array.isArray(params.providers) || active.length === 0) {
      return res.status(403).json({ error: data?.message || 'Set up two-factor authentication in the Magento admin first' });
    }
    // U2F keys are bound to the admin's domain and Duo signs in through a
    // redirect, neither of which the editor can do.
    if (!active.includes('google')) {
      return res.status(403).json({
        error: `This admin uses ${active.join(', ')} for two-factor authentication; the editor supports Google Authenticator only`,
      });
    }
    console.log(`[editor-auth] "${username}" passed the password, waiting for the 2FA code`);
    return res.status(403).json({ error: 'Enter the code from Google Authenticator', otpRequired: true });
  };

  const login = async (req, res) => {
    const username = String(req.body?.username || '').trim();
    const password = String(req.body?.password || '');
    res.set('Cache-Control', 'no-store');
    if (!username || !password) return res.status(400).json({ error: 'Enter the admin user name and password' });

    const ip = clientIp(req);
    const keys = failureKeys(ip, username);
    const wait = lockedFor(keys);
    if (wait > 0) {
      console.warn(`[editor-auth] sign-in for "${username}" from ${ip} held back for ${wait}s`);
      res.set('Retry-After', String(wait));
      return res.status(429).json({
        error: `Too many failed sign-ins, try again in ${Math.ceil(wait / 60)} min`,
      });
    }

    // With an authenticator code the token comes from the 2FA provider's own
    // endpoint, which checks the password as well.
    const otp = String(req.body?.otp || '').replace(/\s+/g, '');
    const issued = otp
      ? await magento(config.origin, 'tfa/provider/google/authenticate', { method: 'POST', body: { username, password, otp } })
      : await magento(config.origin, 'integration/admin/token', { method: 'POST', body: { username, password } });
    if (issued.status === 401) {
      countFailure(keys);
      console.warn(`[editor-auth] sign-in refused for "${username}" from ${ip}${otp ? ' (2FA code)' : ''}`);
      return res.status(403).json({ error: issued.data?.message || 'Invalid user name or password', ...(otp ? { otpRequired: true } : {}) });
    }
    if (issued.status === 400 && !otp) return refuseForTfa(res, username, issued.data);
    if (issued.status !== 200 || typeof issued.data !== 'string') {
      return res.status(502).json({ error: 'Magento did not answer, try again' });
    }

    const token = issued.data;
    const access = await checkContentAccess(config.origin, token);
    if (access.status === 401 || access.status === 403) {
      console.warn(`[editor-auth] "${username}" has no access to CMS pages`);
      return res.status(403).json({ error: 'This admin account has no access to CMS pages' });
    }
    if (access.status !== 200) return res.status(502).json({ error: 'Magento did not answer, try again' });

    failures.delete(keys.ipUser);
    failures.delete(keys.user);
    const claims = readTokenClaims(token);
    const exp = claims.exp || Date.now() + FALLBACK_TTL_MS;
    const session = { uid: claims.uid, username, token, exp };
    remember(token);
    res.cookie(SESSION_COOKIE, sealSession(session, key), { ...cookieOptions(req), maxAge: exp - Date.now() });
    console.log(`[editor-auth] "${username}" (#${claims.uid ?? '?'}) signed in`);
    return res.json({ id: claims.uid, username, expiresAt: exp });
  };

  return async (req, res, next) => {
    delete req.headers[EDITOR_USER_HEADER];
    const route = `${req.baseUrl}${req.path}`;

    if (route === '/api/editor/login' && req.method === 'POST') {
      return parseJson(req, res, () => login(req, res));
    }
    if (route === '/api/editor/logout' && req.method === 'POST') {
      res.clearCookie(SESSION_COOKIE, cookieOptions(req));
      return res.json({ ok: true });
    }

    const session = readSession(req, key);
    if (!session) return refuse(req, res, 403, 'Sign in to the editor');

    if (route === '/api/editor/me') {
      res.set('Cache-Control', 'no-store');
      return res.json({ id: session.uid, username: session.username, expiresAt: session.exp });
    }

    const changes = !['GET', 'HEAD', 'OPTIONS'].includes(req.method);
    const fresh = verified.get(session.token) !== null;
    if (changes && !fresh) {
      const access = await checkContentAccess(config.origin, session.token);
      if (access.status === 401 || access.status === 403) {
        verified.delete(session.token);
        console.warn(`[editor-auth] "${session.username}" refused by Magento (${access.status}), session dropped`);
        return refuse(req, res, 403, 'Your admin session has ended, sign in again');
      }
      if (access.status !== 200) {
        return res.status(503).json({ error: 'Magento did not answer, nothing was saved - try again' });
      }
      remember(session.token);
    }

    req.headers[EDITOR_USER_HEADER] = encodeURIComponent(JSON.stringify({ id: session.uid, username: session.username }));
    return next();
  };
}

/** True when at least one of the two editor layers is configured. */
export function isEditorGuarded() {
  return readEditorGateConfig().active || readEditorAuthConfig().active;
}

/**
 * Editor-only guard. Mount it on the editor routes, ahead of the proxy that
 * forwards them. Two layers, each optional: the shared HTTP Basic Auth gate
 * (EDITOR_AUTH_*), then the Magento admin sign-in
 * (EDITOR_ADMIN_AUTH_*). The gate goes first so the sign-in form and its API
 * are out of reach for anyone without the shared pair.
 *
 * @returns {import('express').RequestHandler}
 */
export function editorAuth() {
  const gate = editorGate();
  const signIn = adminSignIn();
  return (req, res, next) => gate(req, res, (err) => (err ? next(err) : signIn(req, res, next)));
}
