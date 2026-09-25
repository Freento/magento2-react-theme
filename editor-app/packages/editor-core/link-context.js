import { createContext } from 'react';

/**
 * True inside a block that the style layer turned into a link.
 *
 * A container can be a link — that is what makes a promo tile clickable — and
 * then everything in it is inside an anchor. HTML forbids one anchor inside
 * another, and React does not merely warn: the browser's parser rearranges the
 * server's markup, hydration fails against it and the whole subtree falls back
 * to client rendering. So blocks that would render an anchor of their own read
 * this and render plain text instead; the surrounding link already carries the
 * click.
 */
export const InsideLinkContext = createContext(false);
