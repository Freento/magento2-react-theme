import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNewBuildAvailable } from '../../lib/chunkLoad';
import useBackToClose from '../../hooks/useBackToClose';

const AUTO_REFRESH_SECONDS = 60;

// Shown when a part of the page could not be loaded because a deploy replaced the
// build the page came with (see lib/chunkLoad.js). A modal rather than a toast: part
// of the page no longer works, so the shopper should not miss it. The page refreshes
// itself after a minute so it ends up on the new build either way; closing the
// dialog only hides it, the refresh still happens.
export default function RefreshNotice() {
  const newBuild = useNewBuildAvailable();
  const [dismissed, setDismissed] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(AUTO_REFRESH_SECONDS);
  useBackToClose('refreshNotice', !!newBuild && !dismissed, () => setDismissed(true), () => setDismissed(false));

  useEffect(() => {
    if (!newBuild) return undefined;
    const timer = setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(timer);
  }, [newBuild]);

  useEffect(() => {
    if (newBuild && secondsLeft === 0) window.location.reload();
  }, [newBuild, secondsLeft]);

  if (!newBuild || dismissed || typeof document === 'undefined') return null;
  const close = () => setDismissed(true);

  return createPortal(
    <div className="fixed inset-0 bg-ink/40 flex items-center justify-center z-[1200] p-4 animate-scrim" onClick={close} role="dialog" aria-modal="true" aria-labelledby="refresh-notice-title">
      <div className="relative w-full max-w-[420px] bg-bg border border-line rounded-lg pt-9 px-8 pb-7 text-center shadow-[0_20px_40px_rgba(0,0,0,0.12)] animate-modal" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="absolute top-3 right-3 w-8 h-8 inline-flex items-center justify-center bg-transparent border-0 cursor-pointer rounded-pill text-ink-2 transition-colors duration-fast ease-[ease] hover:bg-surface hover:text-ink"
          onClick={close}
          aria-label="Close"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
        <h2 id="refresh-notice-title" className="mt-0 mb-2 text-[26px] font-semibold text-ink tracking-[-0.015em] leading-tight">
          This version of the site is out of date
        </h2>
        <p className="mt-0 mb-6 text-base text-ink-2">
          The page needs to be refreshed. It will refresh automatically in {secondsLeft} {secondsLeft === 1 ? 'second' : 'seconds'}.
        </p>
        <button
          type="button"
          className="inline-flex items-center justify-center min-h-12 px-[22px] py-[11px] rounded text-base font-medium tracking-[0.02em] cursor-pointer transition-colors duration-med ease-[ease] bg-ink text-bg border border-ink w-full hover:bg-black hover:text-bg"
          onClick={() => window.location.reload()}
        >
          Refresh now
        </button>
      </div>
    </div>,
    document.body,
  );
}
