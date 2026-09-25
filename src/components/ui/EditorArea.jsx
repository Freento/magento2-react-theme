import React from 'react';
import { renderPageBlocks, useActiveDevices } from 'editor-core/renderer';
import { storefrontBlocks } from './editorBlocks';

/**
 * Renders one named area of a route document inside a page the storefront owns.
 *
 * Unlike `EditorPageRoute` it adds no container of its own — the route it sits
 * in already provides the page width and gutters, and a second wrapper would
 * double the horizontal padding.
 */
export default function EditorArea({ blocks = [], className = '', ssrHint }) {
  const devices = useActiveDevices(undefined, ssrHint);
  if (!blocks.length) return null;
  return (
    <div className={className}>
      {renderPageBlocks({ blocks }, { devices, blocks: storefrontBlocks })}
    </div>
  );
}
