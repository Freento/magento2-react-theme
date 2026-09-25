export const formatMoney = (value, currency) => {
  if (value == null) return '—';
  const n = Number(value);
  const code = (currency || '').toUpperCase();
  return code === 'USD' ? `$${n.toFixed(2)}` : `${n.toFixed(2)} ${code}`.trim();
};
