const BLOB_RE = /blob:[^"\\\s)]+/g;
const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED = [
    {ext: '.avif', type: 'image/avif'},
    {ext: '.webp', type: 'image/webp'},
];

const files = new Map();
const uploaded = new Map();

/**
 * Checks a picked file against what the upload endpoint accepts, so a wrong
 * file is refused at once instead of when the page is saved.
 *
 * @param {File} file
 * @returns {string} the error, or '' when the file is fine
 */
export function validateImageFile(file) {
    const ext = (file.name.match(/\.[^.]+$/)?.[0] || '').toLowerCase();
    if (!ALLOWED.some((a) => a.ext === ext && (!file.type || a.type === file.type))) {
        return `Only AVIF or WebP allowed — "${file.name}" is ${ext || 'unknown'}.`;
    }
    if (file.size > MAX_BYTES) return `"${file.name}" is larger than 10 MB.`;
    return '';
}

/**
 * Keeps a picked image in the browser until the page is saved and returns the
 * URL that shows it meanwhile.
 *
 * @param {File} file
 * @returns {string}
 */
export function addPendingUpload(file) {
    const url = URL.createObjectURL(file);
    files.set(url, file);
    return url;
}

/**
 * Name of the file behind a pending image URL that has not been uploaded yet.
 *
 * @param {string} url
 * @returns {string} the file name, or '' when the URL is not a pending image
 */
export const pendingFileName = (url) => (uploaded.has(url) ? '' : files.get(url)?.name || '');

/**
 * The /uploads URL a pending image was saved under.
 *
 * @param {string} url
 * @returns {string} the URL, or '' when the image has not been uploaded
 */
export const uploadedUrl = (url) => uploaded.get(url) || '';

/**
 * Pending images referenced anywhere in the given values that have not been
 * uploaded yet.
 *
 * @param {unknown[]} values
 * @returns {string[]}
 */
export function pendingBlobUrls(values) {
    const found = new Set();
    for (const value of values) {
        for (const url of JSON.stringify(value ?? null).match(BLOB_RE) || []) {
            if (!uploaded.has(url)) found.add(url);
        }
    }
    return [...found];
}

/**
 * Uploads one pending image. An image already uploaded in this session is not
 * sent again.
 *
 * @param {string} blobUrl
 * @returns {Promise<string>} the image's /uploads URL
 */
export async function uploadPending(blobUrl) {
    if (uploaded.has(blobUrl)) return uploaded.get(blobUrl);
    const file = files.get(blobUrl);
    if (!file) throw new Error('An image was lost before it could be uploaded — pick it again.');
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch('/api/editor/upload', {method: 'POST', body: fd});
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.url) throw new Error(data.error || `"${file.name}" failed to upload`);
    uploaded.set(blobUrl, data.url);
    return data.url;
}

/**
 * The value with every uploaded image's browser URL replaced by its /uploads URL.
 *
 * @template T
 * @param {T} value
 * @returns {T}
 */
export function withUploadedUrls(value) {
    if (value == null) return value;
    return JSON.parse(JSON.stringify(value).replace(BLOB_RE, (url) => uploaded.get(url) || url));
}
