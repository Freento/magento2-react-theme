export const isCartAuthError = (error) => {
  const messages = [
    error?.message || '',
    ...(error?.graphQLErrors?.map((e) => e?.message || '') || []),
  ].map((m) => m.toLowerCase());

  const looksCartRelated = (m) =>
    m.includes('cannot perform operations on cart') ||
    m.includes("cart isn't active") ||
    m.includes("cart isn't found") ||
    m.includes('current user cannot perform operations on cart') ||
    m.includes('could not find a cart');

  if (messages.some(looksCartRelated)) return true;

  return !!error?.graphQLErrors?.some(
    (e) => e?.extensions?.category === 'graphql-authorization',
  );
};

export const getInitialStep = (hash) => {
  const step = parseInt((hash || '').replace('#', ''), 10) || 1;
  return step >= 1 && step <= 3 ? step : 1;
};
