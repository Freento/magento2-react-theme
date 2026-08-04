import React, { useEffect } from 'react';
import { PageContextProvider } from './usePageContext';

function ScrollbarWidthVar() {
  useEffect(() => {
    const set = () => {
      const sw = window.innerWidth - document.documentElement.clientWidth;
      document.documentElement.style.setProperty('--sw', `${Math.max(0, sw)}px`);
    };
    set();
    window.addEventListener('resize', set);
    return () => window.removeEventListener('resize', set);
  }, []);
  return null;
}

export function PageShell({ children, pageContext }) {
  return (
    <React.StrictMode>
      <PageContextProvider pageContext={pageContext}>
        <ScrollbarWidthVar />
        {children}
      </PageContextProvider>
    </React.StrictMode>
  );
}
