import React, { useEffect } from 'react';
import { renderPageBlocks, useActiveDevices } from 'editor-core/renderer';
import * as defaultBlocks from 'editor-core/blocks';

export default function MaintenancePage({ page, ssrHint }) {
  const devices = useActiveDevices(undefined, ssrHint);
  useEffect(() => {
    document.title = page?.title || 'Maintenance';
  }, [page?.title]);
  return (
    <main className="editor-core-page maintenance-page" style={page?.style || undefined}>
      {page ? renderPageBlocks(page, { devices, blocks: defaultBlocks }) : <h1>We&apos;ll be back soon</h1>}
    </main>
  );
}
