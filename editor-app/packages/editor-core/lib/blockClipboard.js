const CLIPBOARD_KEY = 'editor:clipboard';

export const readCopiedBlock = () => {
    try { return JSON.parse(localStorage.getItem(CLIPBOARD_KEY) || 'null'); } catch { return null; }
};

export const writeCopiedBlock = (block) => {
    try { localStorage.setItem(CLIPBOARD_KEY, JSON.stringify(block)); return true; } catch { return false; }
};

export const hasCopiedBlock = () => !!readCopiedBlock();
