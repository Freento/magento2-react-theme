export const formatAddressLines = (addr) => {
  if (!addr) return [];
  const name = [addr.firstname, addr.lastname].filter(Boolean).join(' ');
  const street = (addr.street || []).filter(Boolean).join(', ');
  const region = typeof addr.region === 'string'
    ? addr.region
    : addr.region?.label || addr.region?.region || addr.region?.code || '';
  const cityLine = [addr.city, [region, addr.postcode].filter(Boolean).join(' ')].filter(Boolean).join(', ');
  const country = addr.country?.label || addr.country?.code || addr.country_code || '';
  const phone = addr.telephone ? `T: ${addr.telephone}` : '';
  return [name, street, cityLine, country, phone].filter(Boolean);
};
