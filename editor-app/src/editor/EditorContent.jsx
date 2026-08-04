import React from 'react';
import { usePageContext } from '../../renderer/usePageContext';
import { renderPage, useActiveDevices } from 'editor-core/renderer';

export default function EditorContent() {
  const pageContext = usePageContext();
  const editorPage = pageContext.data?.editorPage;
  const devices = useActiveDevices(undefined, pageContext.deviceHint);
  if (!editorPage) return null;
  return renderPage(editorPage, { devices });
}
