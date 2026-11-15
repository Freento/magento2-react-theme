const SAFE_HREF = /^(?:https?:\/\/|mailto:|tel:|\/(?!\/)|#|\?)/i;

const escapeText = (s) => String(s).replace(/&(?![a-z]+;|#\d+;|#x[0-9a-f]+;)/gi, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const escapeAttr = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const decodeAttr = (s) => String(s).replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');

/**
 * Whether a link target may be stored: web, mail and phone links and
 * same-site paths; `javascript:`, `data:` and protocol-relative URLs are not.
 *
 * @param {string} href
 * @returns {boolean}
 */
export const isSafeHref = (href) => SAFE_HREF.test(String(href || '').trim());

/**
 * Reduces rich text to the markup a Text block may hold: bold, italic,
 * underline, strikethrough, font size, links, numbered lists and line breaks. Other tags are dropped but their text is kept, block tags a
 * contenteditable adds become line breaks, scripts and styles go with their
 * content, and links keep only a safe href. Runs without a DOM, so the server
 * render and the editor produce the same output.
 *
 * @param {string} html
 * @param {{lists?: boolean, links?: boolean}} [options] lists: false turns list items into lines, for headings; links: false drops links, for text that is itself a link
 * @returns {string}
 */
export function sanitizeRichText(html, { lists = true, links = true } = {}) {
  const src = String(html || '').replace(/<(script|style|template|iframe|object)\b[\s\S]*?<\/\1\s*>/gi, '').replace(/<!--[\s\S]*?-->/g, '');
  const out = [];
  const open = [];
  const re = /<\s*(\/)?\s*([a-zA-Z][a-zA-Z0-9]*)([^>]*)>/g;
  let last = 0;
  let m;
  const closeTo = (tag) => {
    const i = open.lastIndexOf(tag);
    if (i === -1) return;
    while (open.length > i) {
      const t = open.pop();
      if (t[0] !== '-') out.push(`</${t}>`);
    }
  };
  while ((m = re.exec(src))) {
    out.push(escapeText(src.slice(last, m.index)));
    last = re.lastIndex;
    let closing = !!m[1];
    let tag = m[2].toLowerCase();
    if (tag === 'strong') tag = 'b';
    if (tag === 'em') tag = 'i';
    if (tag === 'strike' || tag === 'del') tag = 's';
    if (tag === 'ins') tag = 'u';
    if (tag === 'br') { out.push('<br>'); continue; }
    if (!lists && (tag === 'ol' || tag === 'ul' || tag === 'li')) { tag = 'div'; closing = false; }
    if (tag === 'div' || tag === 'p') {
      const sofar = out.join('');
      if (!closing && sofar.replace(/<[^>]*>/g, '').trim() && !/(?:<br>|<\/?[ou]l>|<\/?li>)$/.test(sofar)) out.push('<br>');
      continue;
    }
    if (tag === 'ol' || tag === 'ul') {
      if (closing) closeTo(tag);
      else { out.push(`<${tag}>`); open.push(tag); }
      continue;
    }
    if (tag === 'li') {
      const listAt = Math.max(open.lastIndexOf('ol'), open.lastIndexOf('ul'));
      const inList = listAt > open.lastIndexOf('li');
      if (closing) { if (open.includes('li')) closeTo('li'); continue; }
      if (listAt === -1) continue;
      if (!inList) closeTo('li');
      out.push('<li>');
      open.push('li');
      continue;
    }
    if (tag === 'span' || tag === 'font') {
      if (closing) {
        const i = Math.max(open.lastIndexOf('span'), open.lastIndexOf('-span'));
        if (i !== -1) closeTo(open[i]);
        continue;
      }
      const size = tag === 'span' && m[3].match(/\bstyle\s*=\s*["'][^"']*?font-size\s*:\s*(\d{1,3})px/i);
      const px = size ? Number(size[1]) : 0;
      if (px >= 6 && px <= 200) { out.push(`<span style="font-size:${px}px">`); open.push('span'); }
      else open.push('-span');
      continue;
    }
    if (tag === 'b' || tag === 'i' || tag === 'u' || tag === 's') {
      if (closing) closeTo(tag);
      else { out.push(`<${tag}>`); open.push(tag); }
      continue;
    }
    if (tag === 'a') {
      if (!links) continue;
      if (closing) { closeTo('a'); continue; }
      const hrefMatch = m[3].match(/\bhref\s*=\s*("([^"]*)"|'([^']*)'|([^\s"'>]+))/i);
      const href = hrefMatch ? decodeAttr(hrefMatch[2] ?? hrefMatch[3] ?? hrefMatch[4] ?? '').trim() : '';
      if (!href || !isSafeHref(href) || open.includes('a')) continue;
      const plain = /\bclass\s*=\s*["']?plain\b/i.test(m[3]);
      out.push(`<a href="${escapeAttr(href)}"${plain ? ' class="plain"' : ''}>`);
      open.push('a');
    }
  }
  out.push(escapeText(src.slice(last)));
  closeTo(open[0]);
  return out.join('').replace(/(?:<br>)+(?=<\/?(?:ol|li)>)/g, '').replace(/(?:<br>)+$/, '');
}

/**
 * Turns plain text (the old Text and Heading content) into rich text.
 *
 * @param {string} text
 * @returns {string}
 */
export const plainToRich = (text) =>
  String(text || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\r?\n/g, '<br>');

/**
 * Plain-text view of rich text, for labels such as the outline.
 *
 * @param {string} html
 * @returns {string}
 */
export const richToPlain = (html) =>
  String(html || '').replace(/<(?:br\s*\/?|\/?li|\/?ol)>/gi, ' ').replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ').trim();
