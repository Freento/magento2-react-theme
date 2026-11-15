import { BREAKPOINTS, resolveBlockForDevices } from './devices.js';
import { gridContainerStyle, gridSpanStyle } from './gridLayout.js';
import { simulateGridPlacement } from './grid.js';
import { wrapperBorderCss } from './wrapperBorder.js';
import { textStyle } from '../blocks/Text.jsx';
import { buttonStyle } from '../blocks/Button.jsx';
import { columnStyle } from '../blocks/Column.jsx';

// Server-rendered markup is drawn for desktop: no device is known before the
// app runs. Everything a block changes for tablet or mobile is restated here as
// media queries, so a narrow screen shows its own layout from the first paint
// and the app's switch to the real width afterwards changes nothing on screen.

const SKIPPED = new Set(['hidden', 'fullWidth', 'borderSides', 'borderWidth', 'borderStyle', 'borderColor', 'link', 'linkTarget', 'colStart', 'rowStart']);
// Per-device style keys the wrapper turns into something other than a plain
// declaration (a class, a link). They only apply once the app runs, so a page
// that relies on them still shifts on hydration. The border keys are composed
// into one declaration and handled by composedRules.
const NOT_EXPRESSIBLE = ['fullWidth', 'link', 'linkTarget'];

// Blocks whose own element is styled from their props: the style each one
// renders for a block (the component's own pure style function), and the props
// that feed it. A device
// changing any other prop (the words, a link) changes content, which waits for
// the app. Custom CSS per device has its own media rules (lib/customCss.js).
const CONTENT_STYLES = {
  Text: {
    style: (b) => textStyle(b.props),
    props: ['fontSize', 'lineHeight', 'color', 'textAlign', 'fontWeight', 'fontStyle', 'textDecoration', 'textTransform', 'fontFamily', 'letterSpacing', 'backgroundImage'],
  },
  Button: {
    style: (b) => buttonStyle(b.props, b.style),
    props: ['backgroundColor', 'color', 'fontSize', 'padding', 'borderRadius', 'borderWidth', 'borderColor', 'borderStyle', 'borderSides', 'fullWidth', 'fontFamily', 'fontWeight', 'fontStyle', 'textDecoration', 'textTransform', 'letterSpacing', 'textAlign'],
  },
  Column: {
    style: (b) => columnStyle(b.props, b.style),
    props: ['gap', 'flex', 'direction', 'alignX', 'alignY'],
  },
};
const HANDLED_ELSEWHERE = new Set(['customCss']);
const UNITLESS = new Set(['opacity', 'zIndex', 'lineHeight', 'fontWeight', 'flex', 'flexGrow', 'flexShrink', 'order', 'zoom']);

// Each media query covers every device at or below it, so the mobile rule is
// stated against what the tablet rule already applies, not against desktop.
const DEVICE_STEPS = [
  { device: 'tablet', devices: ['tablet'], prev: [] },
  { device: 'mobile', devices: ['tablet', 'mobile'], prev: ['tablet'] },
];

const toKebab = (key) => key.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);

const toCssValue = (key, value) => {
  const s = String(value).trim();
  if (s === '') return null;
  return /^-?\d*\.?\d+$/.test(s) && !UNITLESS.has(key) ? `${s}px` : s;
};

const declarations = (style) => {
  const out = [];
  if (style.hidden) out.push('display:none !important');
  for (const key of Object.keys(style)) {
    if (SKIPPED.has(key) || style[key] === null || style[key] === undefined) continue;
    const v = toCssValue(key, style[key]);
    if (v !== null) out.push(`${toKebab(key)}:${v} !important`);
  }
  return out;
};

const resolve = (block, devices) => (devices.length ? resolveBlockForDevices(block, devices) : block);

const media = (device, selector, decls) =>
  `@media (max-width:${BREAKPOINTS[device]}px){${selector}{${decls.join(';')}}}`;

// Declarations for the keys whose value differs between two style objects. A key
// the device drops (a background removed for mobile) goes back to its initial value.
const changed = (prev, cur) => {
  const out = [];
  for (const key of new Set([...Object.keys(prev), ...Object.keys(cur)])) {
    if (cur[key] === prev[key]) continue;
    const v = cur[key] === undefined ? null : toCssValue(key, cur[key]);
    out.push(`${toKebab(key)}:${v === null ? 'initial' : v} !important`);
  }
  return out;
};

const hasOverrides = (block) => !!(block?.responsive?.tablet || block?.responsive?.mobile);

// A grid's tracks, gaps and padding come from its props, and its children's
// cells from their colStart/rowStart against the grid's column count; both can
// change per device.
const gridRules = (block, rules) => {
  if (!block.id) return;
  const kids = block.children || [];
  if (!hasOverrides(block) && !kids.some(hasOverrides)) return;
  for (const { device, devices, prev } of DEVICE_STEPS) {
    const before = resolve(block, prev);
    const now = resolve(block, devices);
    const containerStyle = (b) => gridContainerStyle({ ...b.props, backgroundColor: b.style?.backgroundColor });
    const decls = changed(containerStyle(before), containerStyle(now));
    if (decls.length) rules.push(media(device, `[data-grid="${block.id}"]`, decls));

    const colsBefore = Math.max(1, Number(before.props?.columns) || 1);
    const colsNow = Math.max(1, Number(now.props?.columns) || 1);
    for (const kid of kids) {
      if (!kid?.id) continue;
      const a = gridSpanStyle(resolve(kid, prev).style, colsBefore);
      const b = gridSpanStyle(resolve(kid, devices).style, colsNow);
      if (a.gridColumn === b.gridColumn && a.gridRow === b.gridRow) continue;
      rules.push(media(device, `[data-block-id="${kid.id}"]`, [
        `grid-column:${b.gridColumn || 'auto'} !important`,
        `grid-row:${b.gridRow || 'auto'} !important`,
      ]));
    }
  }
};

// What the wrapper and the block compose from several values — the wrapper's
// border from side, width, style and colour; a text, button or column's own
// element from its props — stated per device as the difference to the step
// before. A heading that changes level per device changes its tag, which the
// stylesheet cannot.
const composedRules = (block, rules) => {
  const content = CONTENT_STYLES[block.component];
  for (const { device, devices, prev } of DEVICE_STEPS) {
    const before = resolve(block, prev);
    const now = resolve(block, devices);
    const border = changed(wrapperBorderCss(before.style || {}) || {}, wrapperBorderCss(now.style || {}) || {});
    if (border.length) rules.push(media(device, `[data-block-id="${block.id}"]`, border));
    if (!content || (before.props?.level ?? 'p') !== (now.props?.level ?? 'p')) continue;
    const decls = changed(content.style(before), content.style(now));
    if (decls.length) rules.push(media(device, `[data-block-id="${block.id}"]>[data-block-content]>*`, decls));
  }
};

const rulesFor = (block, rules) => {
  const rp = block?.responsive;
  if (rp && block.id) {
    for (const device of ['tablet', 'mobile']) {
      let style = rp[device]?.style;
      if (!style) continue;
      if (block.component === 'Grid' && 'backgroundColor' in style) {
        const { backgroundColor: _onGrid, ...rest } = style;
        style = rest;
      }
      const decls = declarations(style);
      if (decls.length) rules.push(media(device, `[data-block-id="${block.id}"]`, decls));
    }
  }
  if (block?.id && hasOverrides(block)) composedRules(block, rules);
  if (block?.component === 'Grid') gridRules(block, rules);
  for (const child of block?.children || []) rulesFor(child, rules);
};

export function responsiveCssFor(blocks) {
  const rules = [];
  for (const block of blocks || []) rulesFor(block, rules);
  return rules.length ? rules.join('') : null;
}

// Children sharing a cell are drawn inside one stack element, so a device that
// stacks them differently changes the markup itself, which no stylesheet can do.
const stacksKey = (block, devices) => {
  const cells = simulateGridPlacement(resolve(block, devices), devices).childCells;
  const groups = new Map();
  cells.forEach((cell, i) => {
    if (!cell) return;
    const key = `${cell.r}-${cell.c}`;
    groups.set(key, [...(groups.get(key) || []), i]);
  });
  return JSON.stringify([...groups.entries()].filter(([, g]) => g.length > 1));
};

/**
 * Per-device overrides the stylesheet cannot carry. Each one renders the
 * desktop variant in server markup and switches only once the app runs, a
 * layout shift on that device. Meant for the build log.
 *
 * @param {object[]} blocks
 * @returns {string[]}
 */
export function responsiveCssGaps(blocks) {
  const gaps = [];
  const walk = (block) => {
    const rp = block?.responsive || {};
    for (const device of ['tablet', 'mobile']) {
      const over = rp[device];
      if (!over) continue;
      if (over.props && block.component !== 'Grid') {
        const styled = new Set(CONTENT_STYLES[block.component]?.props || []);
        const keys = Object.keys(over.props).filter((k) => !styled.has(k) && !HANDLED_ELSEWHERE.has(k));
        if (keys.length) gaps.push(`${block.component}#${block.id} ${device}: props ${keys.join(', ')}`);
      }
      const style = over.style || {};
      const keys = NOT_EXPRESSIBLE.filter((k) => k in style);
      if (keys.length) gaps.push(`${block.component}#${block.id} ${device}: style ${keys.join(', ')}`);
    }
    if (block?.component === 'Grid') {
      const base = stacksKey(block, []);
      for (const { device, devices } of DEVICE_STEPS) {
        if (stacksKey(block, devices) !== base) gaps.push(`Grid#${block.id} ${device}: cells shared by several children differ`);
      }
    }
    for (const child of block?.children || []) walk(child);
  };
  for (const block of blocks || []) walk(block);
  return gaps;
}
