import React, { createContext, useContext } from 'react';

const Ctx = createContext(null);

export function PageContextProvider({ pageContext, children }) {
  return <Ctx.Provider value={pageContext}>{children}</Ctx.Provider>;
}

export function usePageContext() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('usePageContext must be used inside PageContextProvider');
  return ctx;
}
