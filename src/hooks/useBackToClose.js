import { useCallback, useEffect, useRef } from 'react';
import { hideLayer, registerLayer, showLayer } from '../lib/overlayHistory';

export default function useBackToClose(name, isOpen, onClose, onOpen) {
  const entry = useRef(null);
  if (!entry.current) entry.current = { isOpen, close: onClose, open: onOpen };
  const thenRef = useRef(null);

  useEffect(() => {
    Object.assign(entry.current, { isOpen, close: onClose, open: onOpen });
  });

  useEffect(() => registerLayer(name, entry.current), [name]);

  useEffect(() => {
    if (!isOpen) return undefined;
    showLayer(name);
    return () => {
      const then = thenRef.current;
      thenRef.current = null;
      hideLayer(name, then);
    };
  }, [isOpen, name]);

  return useCallback((then) => {
    thenRef.current = then;
    entry.current.close();
  }, []);
}
