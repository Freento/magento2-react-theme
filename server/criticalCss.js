import crypto from 'node:crypto';
import Beasties from 'beasties';

const INLINED_ENTRY_CSS_RE = /<link rel="stylesheet" href="([^"]+)" media="print" disabled><style data-href="\1">[\s\S]*?<\/style>/;
const ROOT_RE = /<div id="root">([\s\S]*)<\/div>\s*<script type="application\/json" id="__INITIAL_DATA__">/;
const CACHE_LIMIT = 200;

const selectorFootprint = (markup) => {
  const tokens = new Set();
  for (const [, tag] of markup.matchAll(/<([a-zA-Z][\w-]*)/g)) tokens.add(`<${tag.toLowerCase()}`);
  for (const [, name] of markup.matchAll(/\s([a-zA-Z_:][-\w:.]*)=/g)) tokens.add(`@${name.toLowerCase()}`);
  for (const [, value] of markup.matchAll(/\sclass="([^"]*)"/g)) {
    for (const cls of value.split(/\s+/)) if (cls) tokens.add(`.${cls}`);
  }
  for (const [, id] of markup.matchAll(/\sid="([^"]*)"/g)) tokens.add(`#${id}`);
  for (const [, name, value] of markup.matchAll(/\s(aria-pressed|data-block-id)="([^"]*)"/g)) tokens.add(`@${name}=${value}`);
  return crypto.createHash('sha1').update([...tokens].sort().join('\n')).digest('base64');
};

const assemble = (html, href, criticalCss) =>
  html.replace(
    INLINED_ENTRY_CSS_RE,
    `<style>${criticalCss}</style><link rel="stylesheet" href="${href}" media="print" onload="this.media='all'"><noscript><link rel="stylesheet" href="${href}"></noscript>`,
  );

export const createCriticalCss = (clientDir) => {
  const beasties = new Beasties({
    path: clientDir,
    publicPath: '/',
    preload: 'media',
    noscriptFallback: false,
    pruneSource: false,
    reduceInlineStyles: false,
    mergeStylesheets: true,
    inlineFonts: false,
    preloadFonts: false,
    fonts: true,
    keyframes: 'critical',
    compress: false,
    logLevel: 'silent',
  });
  const cache = new Map();

  return async (html) => {
    const match = html.match(INLINED_ENTRY_CSS_RE);
    if (!match) return html;
    const href = match[1];
    const markup = html.match(ROOT_RE)?.[1] ?? html;
    const key = `${href}|${selectorFootprint(markup)}`;

    let criticalCss = cache.get(key);
    if (criticalCss === undefined) {
      try {
        const processed = await beasties.process(html.replace(INLINED_ENTRY_CSS_RE, `<link rel="stylesheet" href="${href}">`));
        criticalCss = processed.match(/<style>([\s\S]*?)<\/style>/)?.[1];
      } catch (err) {
        console.error('[critical-css]', err);
      }
      if (criticalCss === undefined) return html;
      if (cache.size >= CACHE_LIMIT) cache.delete(cache.keys().next().value);
      cache.set(key, criticalCss);
    }
    return assemble(html, href, criticalCss);
  };
};
