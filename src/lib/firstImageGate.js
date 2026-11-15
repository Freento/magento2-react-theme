let ready = null;

export const whenFirstImageReady = () => {
  if (ready) return ready;
  ready = new Promise((resolve) => {
    if (typeof document === 'undefined') {
      resolve();
      return;
    }
    const img = document.querySelector('img[data-first-image]');
    if (!img || img.complete) {
      resolve();
      return;
    }
    img.addEventListener('load', resolve, { once: true });
    img.addEventListener('error', resolve, { once: true });
    setTimeout(resolve, 2500);
  });
  return ready;
};

export const releaseDeferredImages = () =>
  whenFirstImageReady().then(() => {
    document.querySelectorAll('img[data-deferred-src]').forEach((img) => {
      if (!img.getAttribute('src')) img.setAttribute('src', img.dataset.deferredSrc);
    });
  });
