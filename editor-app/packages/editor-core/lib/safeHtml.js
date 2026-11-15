const DROP_WITH_CONTENT = ['script', 'iframe', 'object', 'applet', 'noscript', 'noembed', 'noframes', 'frameset', 'xmp', 'plaintext'];
const DROP_TAG = ['embed', 'frame', 'base', 'meta', 'link', 'param'];
const URL_ATTRS = ['href', 'src', 'action', 'formaction', 'xlink:href', 'data', 'poster', 'background', 'lowsrc', 'dynsrc', 'codebase', 'cite', 'longdesc', 'ping', 'manifest', 'srcset', 'imagesrcset', 'values', 'to', 'from', 'by'];

const TAG_RE = /<(\/?)([a-zA-Z][\w:-]*)((?:[^>"']|"[^"]*"|'[^']*')*)>/g;
const ATTR_RE = /([^\s"'<>/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;

const decode = (s) => String(s)
  .replace(/&#x([0-9a-f]+);?/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
  .replace(/&#(\d+);?/g, (_, d) => String.fromCodePoint(Number(d)))
  .replace(/&colon;/gi, ':').replace(/&tab;/gi, '\t').replace(/&newline;/gi, '\n')
  .replace(/&quot;/gi, '"').replace(/&apos;/gi, "'").replace(/&lt;/gi, '<').replace(/&gt;/gi, '>').replace(/&amp;/gi, '&');

const escapeAttr = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const unsafeUrl = (value) => decode(value)
  .replace(/[\u0000-\u0020\u007f-\u009f]+/g, '')
  .toLowerCase()
  .split(/[,;]/)
  .some((part) => /^(?:javascript|vbscript|livescript):/.test(part) || (/^data:/.test(part) && !/^data:image\/(?!svg)/.test(part)));

const unsafeStyle = (value) => /expression\s*\(|javascript:|vbscript:|behavior\s*:|-moz-binding/i.test(decode(value).replace(/\\/g, ''));

function clean(html, issues) {
  const src = String(html || '').replace(/<!--[\s\S]*?(?:-->|$)/g, '');
  const out = [];
  let last = 0;
  let m;
  TAG_RE.lastIndex = 0;
  while ((m = TAG_RE.exec(src))) {
    out.push(src.slice(last, m.index).replace(/</g, '&lt;'));
    last = TAG_RE.lastIndex;
    const closing = !!m[1];
    const tag = m[2].toLowerCase();
    if (DROP_WITH_CONTENT.includes(tag)) {
      issues.add(`<${tag}>`);
      if (!closing) {
        const end = new RegExp(`</${tag}\\s*>`, 'ig');
        end.lastIndex = last;
        const e = end.exec(src);
        last = e ? end.lastIndex : src.length;
        TAG_RE.lastIndex = last;
      }
      continue;
    }
    if (DROP_TAG.includes(tag)) {
      issues.add(`<${tag}>`);
      continue;
    }
    if (closing) {
      out.push(`</${tag}>`);
      continue;
    }
    const attrs = [];
    const selfClosing = /\/\s*$/.test(m[3]);
    ATTR_RE.lastIndex = 0;
    let a;
    while ((a = ATTR_RE.exec(m[3]))) {
      const name = a[1].toLowerCase();
      const hasValue = a[2] !== undefined || a[3] !== undefined || a[4] !== undefined;
      const value = a[2] ?? a[3] ?? a[4] ?? '';
      if (/^on/.test(name)) { issues.add(`${name} attribute`); continue; }
      if (name === 'srcdoc') { issues.add('srcdoc attribute'); continue; }
      if (name === 'http-equiv') { issues.add('http-equiv attribute'); continue; }
      if (URL_ATTRS.includes(name) && unsafeUrl(value)) { issues.add(`script link in ${name}`); continue; }
      if (name === 'style' && unsafeStyle(value)) { issues.add('script in style attribute'); continue; }
      attrs.push(hasValue ? `${name}="${escapeAttr(decode(value))}"` : name);
    }
    out.push(`<${tag}${attrs.length ? ` ${attrs.join(' ')}` : ''}${selfClosing ? ' /' : ''}>`);
  }
  out.push(src.slice(last).replace(/</g, '&lt;'));
  return out.join('');
}

/**
 * Strips what could run script from the HTML of an HTML block: script-like
 * elements with their content, embeds and frames, `on…` handlers, `srcdoc`,
 * and `javascript:`/`data:` URLs (inline images aside). Everything else is
 * kept as written. Runs without a DOM, so the server render and the editor
 * produce the same markup.
 *
 * @param {string} html
 * @returns {string}
 */
export const sanitizeHtml = (html) => clean(html, new Set());

/**
 * What `sanitizeHtml` would remove from the given HTML, as short labels for
 * the editor to show.
 *
 * @param {string} html
 * @returns {string[]}
 */
export function findUnsafeHtml(html) {
  const issues = new Set();
  clean(html, issues);
  return [...issues];
}
