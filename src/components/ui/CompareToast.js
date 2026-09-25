import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { useCompare } from '../../context/CompareContext';
import CloseIcon from './icons/CloseIcon';

export default function CompareToast() {
  const { lastAction, clearLastAction } = useCompare();

  useEffect(() => {
    if (!lastAction) return;
    const t = setTimeout(clearLastAction, 4000);
    return () => clearTimeout(t);
  }, [lastAction, clearLastAction]);

  if (!lastAction) return null;
  if (typeof document === 'undefined') return null;
  const target = document.getElementById('toast-stack');
  if (!target) return null;

  const isError = lastAction.type === 'error';
  const isWarning = lastAction.type === 'notice';
  const text = isError ? (
    <span className="wl-toast-text">{lastAction.message}</span>
  ) : lastAction.type === 'notice' ? (
    <span className="wl-toast-text">{lastAction.message}</span>
  ) : lastAction.type === 'cleared' ? (
    <span className="wl-toast-text">You cleared the comparison list.</span>
  ) : lastAction.type === 'added' ? (
    <span className="wl-toast-text">
      <strong>{lastAction.name || 'Product'}</strong>
      {' added to the '}
      <Link to="/compare" className="wl-toast-link" onClick={clearLastAction}>comparison list</Link>
    </span>
  ) : (
    <span className="wl-toast-text">
      <strong>{lastAction.name || 'Product'}</strong>
      {' removed from comparison list'}
    </span>
  );

  return createPortal(
    <div
      className={`wl-toast${isError ? ' wl-toast--error' : ''}${isWarning ? ' wl-toast--warning' : ''}`}
      role={isError ? 'alert' : 'status'}
      aria-live={isError ? 'assertive' : 'polite'}
    >
      {text}
      <button
        type="button"
        className="wl-toast-close"
        onClick={clearLastAction}
        aria-label="Dismiss"
      >
        <CloseIcon size={14} />
      </button>
    </div>,
    target
  );
}
