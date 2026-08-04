export const isDeadCartError = (err) => {
  if (!err) return false;
  const msgs = [
    err.message || '',
    ...(err.graphQLErrors || []).map((e) => e?.message || ''),
  ];
  const cats = (err.graphQLErrors || []).map((e) => e?.extensions?.category);
  return msgs.some((m) => /cannot perform operations on cart|cart isn'?t active|could not find a cart/i.test(m))
    || cats.includes('graphql-authorization')
    || cats.includes('graphql-no-such-entity');
};
