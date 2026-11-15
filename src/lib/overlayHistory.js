const KEY = '__overlays';

let installed = false;
let nativePush = null;
const registry = new Map();
let pendingBack = null;
let afterBack = [];

const layersNow = () => window.history.state?.[KEY] || [];

const withLayers = (layers) => {
  const state = { ...window.history.state };
  if (layers.length) state[KEY] = layers;
  else delete state[KEY];
  return state;
};

const flushAfterBack = () => {
  const tasks = afterBack;
  afterBack = [];
  tasks.forEach((task) => task());
};

function onPopState() {
  const layers = layersNow();
  registry.forEach((entry, name) => {
    const wanted = layers.includes(name);
    if (wanted && !entry.isOpen && entry.open) entry.open();
    else if (!wanted && entry.isOpen) entry.close();
  });
  flushAfterBack();
}

function install() {
  if (installed) return;
  installed = true;
  if (layersNow().length) window.history.replaceState(withLayers([]), '');
  nativePush = window.history.pushState;
  window.history.pushState = function pushState(state, title, url) {
    if (layersNow().length) return window.history.replaceState(state, title, url);
    return nativePush.call(window.history, state, title, url);
  };
  window.addEventListener('popstate', onPopState);
}

export function registerLayer(name, entry) {
  install();
  registry.set(name, entry);
  return () => {
    if (registry.get(name) === entry) registry.delete(name);
  };
}

export function showLayer(name) {
  install();
  const layers = layersNow();
  if (layers.includes(name)) {
    if (pendingBack === name) pendingBack = null;
    return;
  }
  if (pendingBack !== null && layers[layers.length - 1] === pendingBack) {
    pendingBack = null;
    window.history.replaceState(withLayers([...layers.slice(0, -1), name]), '');
    flushAfterBack();
    return;
  }
  nativePush.call(window.history, withLayers([...layers, name]), '');
}

export function hideLayer(name, then) {
  const layers = layersNow();
  const at = layers.indexOf(name);
  if (at === -1) {
    if (then) then();
    return;
  }
  if (at < layers.length - 1) {
    window.history.replaceState(withLayers(layers.filter((layer) => layer !== name)), '');
    if (then) then();
    return;
  }
  pendingBack = name;
  if (then) afterBack.push(then);
  queueMicrotask(() => {
    if (pendingBack !== name) return;
    pendingBack = null;
    const now = layersNow();
    if (now[now.length - 1] === name) window.history.back();
    else flushAfterBack();
  });
}
