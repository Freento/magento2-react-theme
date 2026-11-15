import { useEffect } from 'react';
import { AUTH_EVENTS } from '../context/AuthContext';

export const useAuthEvents = (eventHandlers = {}) => {
  useEffect(() => {
    const handleAuthEvent = (event) => {
      const { type, detail } = event;
      const handler = eventHandlers[type];

      if (handler && typeof handler === 'function') {
        handler(detail);
      }
    };

    Object.values(AUTH_EVENTS).forEach(eventType => {
      window.addEventListener(eventType, handleAuthEvent);
    });

    return () => {
      Object.values(AUTH_EVENTS).forEach(eventType => {
        window.removeEventListener(eventType, handleAuthEvent);
      });
    };
  }, [eventHandlers]);
};
