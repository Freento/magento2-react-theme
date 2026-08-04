import 'dotenv/config';
import mysql from 'mysql2/promise';

const TABLE_PREFIX = process.env.MAGENTO_DB_TABLE_PREFIX || '';
const STORE_CODE = process.env.MAGENTO_STORE_CODE || '';

let client;

/**
 * Creates (and reuses) the MySQL connection.
 *
 * @returns {import('mysql2/promise').Pool}
 */
function getMysqlClient() {
  if (!client) {
    client = mysql.createPool({
      host: process.env.MAGENTO_DB_HOST || '127.0.0.1',
      port: Number(process.env.MAGENTO_DB_PORT) || 3306,
      user: process.env.MAGENTO_DB_USER,
      password: process.env.MAGENTO_DB_PASSWORD,
      database: process.env.MAGENTO_DB_NAME,
      namedPlaceholders: true,
      waitForConnections: true,
      connectionLimit: 5,
      enableKeepAlive: true,
    });
  }
  return client;
}

/**
 * Builds the prefix-lookup query for a request path, scoped to the configured store.
 *
 * @param {string} requestPath
 * @returns {{sql: string, params: object}}
 */
function buildSql(requestPath) {
  const urlRewrite = `${TABLE_PREFIX}url_rewrite`;
  const store = `${TABLE_PREFIX}store`;

  const sql = `
    SELECT ur.request_path, ur.target_path, ur.entity_type, ur.entity_id, ur.redirect_type, ur.store_id
    FROM \`${urlRewrite}\` ur
    WHERE ur.store_id = (
      SELECT store_id FROM \`${store}\`
      WHERE is_active = 1 AND code = :storeCode
      LIMIT 1
    )
    AND ur.request_path LIKE :requestPath
    LIMIT 50`;

  return { sql, params: { storeCode: STORE_CODE, requestPath: `${requestPath}%` } };
}

/**
 * Runs the lookup and returns the matched url_rewrite rows (empty on error).
 *
 * @param {string} requestPath
 * @returns {Promise<Array<object>>}
 */
async function queryUrlRewrites(requestPath) {
  const { sql, params } = buildSql(requestPath);
  try {
    const [rows] = await getMysqlClient().query(sql, params);
    return rows;
  } catch (e) {
    console.error('[resolveUrlRewrite]', e.message);
    return [];
  }
}

/**
 * Looks up the url_rewrite for an exact request path and returns the resolved
 * page info, or null if nothing matches.
 *
 * @param {string} requestPath
 * @returns {Promise<{type: string, id: number, redirect_code: number|null, relative_url: string}|null>}
 */
async function getUrlRewrite(requestPath) {
  const urlRewrite = (await queryUrlRewrites(requestPath)).find((r) => r.request_path === requestPath);
  if (!urlRewrite) return null;

  return {
    type: urlRewrite.entity_type,
    id: urlRewrite.entity_id,
    redirect_code: urlRewrite.redirect_type || null,
    relative_url: urlRewrite.redirect_type ? `/${urlRewrite.target_path}` : `/${urlRewrite.request_path}`,
  };
}

/**
 * Resolves a request path to its url_rewrite (type/id/redirect/url), retrying
 * with a `.html` suffix.
 *
 * @param {string} requestPath  Request path (with or without leading slash).
 * @returns {Promise<{path: string, data: object|null}>}
 */
export async function resolveUrlRewrite(requestPath) {
  requestPath = new URL(requestPath || '/', 'http://_').pathname.slice(1);
  if (!requestPath) return { path: '', data: null };

  let data = await getUrlRewrite(requestPath);
  if (!data && !requestPath.endsWith('.html')) {
    data = await getUrlRewrite(`${requestPath}.html`);
  }
  return { path: requestPath, data };
}
