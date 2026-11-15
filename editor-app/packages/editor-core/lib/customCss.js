import { BREAKPOINTS } from './devices.js';
export const ALLOWED_PROPERTIES = [
  'align-items', 'justify-items', 'align-content', 'justify-content', 'place-items', 'place-content',
  'gap', 'row-gap', 'column-gap',
  'grid-template-columns', 'grid-template-rows', 'grid-auto-rows', 'grid-auto-columns', 'grid-auto-flow',
  'padding', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
  'margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
  'width', 'min-width', 'max-width', 'height', 'min-height', 'max-height', 'aspect-ratio',
  'background', 'background-color', 'background-image', 'background-size', 'background-position', 'background-repeat',
  'border', 'border-top', 'border-right', 'border-bottom', 'border-left',
  'border-width', 'border-style', 'border-color', 'border-radius',
  'box-shadow', 'outline', 'outline-offset', 'opacity', 'overflow', 'overflow-x', 'overflow-y',
  'color', 'font-family', 'font-size', 'font-weight', 'font-style', 'line-height', 'letter-spacing',
  'text-align', 'text-transform', 'text-decoration', 'white-space',
  'transition', 'filter', 'cursor',
];

const ALLOWED = new Set(ALLOWED_PROPERTIES);
const UNSAFE_VALUE = /expression\s*\(|javascript:|data:|-moz-binding|behavior\s*:|<|>|\\|@|url\(\s*["']?\s*(?:[a-z]+:)?\/\//i;
export const MAX_LENGTH = 2000;

/**
 * Splits a Custom CSS text into declarations, one per `prop: value;` (a line
 * break ends a declaration too), and reports what is rejected: anything that
 * is not a plain declaration, a property outside the allowed list, or a value
 * that could reach beyond the block (scripts, external or data URLs, at-rules,
 * markup). Only same-site `url(/images/...)` and `url(/uploads/...)` pass.
 * Line numbers are 1-based. Comments are ignored.
 *
 * @param {string} text
 * @returns {{ declarations: Array<{prop: string, value: string, line: number}>, errors: Array<{line: number, message: string}> }}
 */
export function parseCustomCss(text) {
  const declarations = [];
  const errors = [];
  const raw = String(text || '');
  if (raw.length > MAX_LENGTH) errors.push({ line: 1, message: `Custom CSS is limited to ${MAX_LENGTH} characters` });
  const source = raw.slice(0, MAX_LENGTH).replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '));
  source.split('\n').forEach((raw, i) => {
    const line = i + 1;
    for (const chunk of raw.split(';').map((c) => c.trim()).filter(Boolean)) {
      if (/[{}]/.test(chunk)) { errors.push({ line, message: 'Selectors and nested blocks are not allowed; write declarations only' }); continue; }
      const colon = chunk.indexOf(':');
      if (colon === -1) { errors.push({ line, message: 'Expected "property: value"' }); continue; }
      const prop = chunk.slice(0, colon).trim().toLowerCase();
      const value = chunk.slice(colon + 1).trim().replace(/\s*!important$/i, '');
      if (!/^[a-z-]+$/.test(prop)) { errors.push({ line, message: `"${prop}" is not a property name` }); continue; }
      if (!ALLOWED.has(prop)) { errors.push({ line, message: `"${prop}" is not allowed here` }); continue; }
      if (!value) { errors.push({ line, message: `"${prop}" has no value` }); continue; }
      if (UNSAFE_VALUE.test(value)) { errors.push({ line, message: `The value of "${prop}" is not allowed` }); continue; }
      declarations.push({ prop, value, line });
    }
  });
  return { declarations, errors };
}

const ruleFor = (id, css) => {
  const { declarations } = parseCustomCss(css || '');
  return declarations.length
    ? `[data-block-id="${id}"]>[data-block-content]>*{${declarations.map((d) => `${d.prop}:${d.value} !important`).join(';')}}`
    : '';
};

const rulesFor = (block, rules) => {
  if (block?.id) {
    const css = block.props?.customCss;
    if (css) {
      const rule = ruleFor(block.id, css);
      if (rule) rules.push(rule);
    }
    for (const device of ['tablet', 'mobile']) {
      const over = block.responsive?.[device]?.props;
      if (!over || !('customCss' in over)) continue;
      const rule = ruleFor(block.id, over.customCss);
      if (rule) rules.push(`@media (max-width:${BREAKPOINTS[device]}px){${rule}}`);
    }
  }
  for (const child of block?.children || []) rulesFor(child, rules);
};

export function customCssFor(blocks) {
  const rules = [];
  for (const block of blocks || []) rulesFor(block, rules);
  return rules.length ? rules.join('') : null;
}
