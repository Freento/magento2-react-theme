import { lazy, useSyncExternalStore } from 'react';

// Code-split modules (route pages, the auth modals, the search box) are fetched only
// when first needed. A deploy deletes the files of the build it replaces, so a page
// opened before it asks for files that are gone — and while the deploy runs, the
// server may not answer at all. A failed React.lazy import unmounts the whole app,
// leaving a blank page.
//
// Here a failure renders nothing in place of the module, and the page asks the server
// which build it now runs (/__build-id, see server.prod.js). Only when that differs
// from the build the page was loaded with — a deploy — does RefreshNotice ask the
// shopper to refresh. Mid-deploy the server may not answer yet, so the question is
// repeated for as long as a deploy can take; any other failure stays silent.
const OWN_BUILD = typeof __APP_BUILD_ID__ !== 'undefined' ? __APP_BUILD_ID__ : null;
const RETRY_MS = 10000;
const MAX_TRIES = 30; // 5 minutes

let newBuild = false;
let checking = false;
const listeners = new Set();

const announce = () => {
  newBuild = true;
  listeners.forEach((listener) => listener());
};

// The build the server runs now, or null when it cannot tell (down, mid-build).
const currentBuild = async () => {
  try {
    const res = await fetch(`/__build-id?t=${Date.now()}`, { cache: 'no-store' });
    if (!res.ok) return null;
    return (await res.json())?.id || null;
  } catch {
    return null;
  }
};

const checkForNewBuild = async () => {
  if (checking || newBuild || !OWN_BUILD) return;
  checking = true;
  try {
    for (let i = 0; i < MAX_TRIES; i += 1) {
      const id = await currentBuild();
      if (id) {
        if (id !== OWN_BUILD) announce();
        return;
      }
      await new Promise((resolve) => setTimeout(resolve, RETRY_MS));
    }
  } finally {
    checking = false;
  }
};

const subscribe = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

// True once a failed module load has been traced to a newer build on the server.
export const useNewBuildAvailable = () => useSyncExternalStore(subscribe, () => newBuild, () => false);

const Nothing = () => null;

// React.lazy that never throws on a failed import. React caches the result, so the
// module stays empty until the page is reloaded — which is what the notice asks for.
export const lazyWithNotice = (load) =>
  lazy(() => load().catch((error) => {
    console.error('Failed to load a page module:', error);
    checkForNewBuild();
    return { default: Nothing };
  }));
