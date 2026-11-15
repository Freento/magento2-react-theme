import React, { useEffect, useState } from 'react';
import { UI } from './Icon.jsx';
import '../styles/editor.css';

// Dragging blocks and the inspector need a mouse, and below 1024px the sidebar and
// the preview toolbar no longer fit side by side. Touch-only devices and narrow
// windows get a placeholder and the editor is not loaded at all.
const UNAVAILABLE_QUERY = '(pointer: coarse) and (hover: none), (max-width: 1023px)';

const matchesQuery = () =>
  typeof window !== 'undefined' && window.matchMedia(UNAVAILABLE_QUERY).matches;

// Decided on load. It only ever flips to available (a desktop window that was
// narrow and got widened); never the other way, which would swap the editor out
// mid-session and throw away unsaved changes.
export function useEditorUnavailable() {
  const [unavailable, setUnavailable] = useState(matchesQuery);

  useEffect(() => {
    if (!unavailable) return undefined;
    const query = window.matchMedia(UNAVAILABLE_QUERY);
    const onChange = () => { if (!query.matches) setUnavailable(false); };
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, [unavailable]);

  return unavailable;
}

export default function MobileUnavailable() {
  return (
    <div className="editor-mobile-unavailable flex min-h-screen items-center justify-center bg-ed-bg px-6 py-10 text-ed-text">
      <div className="flex max-w-[360px] flex-col items-center gap-4 text-center">
        <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-ed-primary-soft text-ed-primary">
          <UI.Monitor size={28} strokeWidth={1.75} />
        </span>
        <h1 className="m-0 text-lg font-semibold">The editor isn't available on mobile devices yet</h1>
        <p className="m-0 text-[14px] leading-[1.5] text-ed-text-soft">
          Please open it on a desktop computer, in a window at least 1024px wide.
        </p>
      </div>
    </div>
  );
}
