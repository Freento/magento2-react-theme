export const CARD_TYPES = {
  VI: 'Visa',
  MC: 'MasterCard',
  AE: 'American Express',
  DI: 'Discover',
  JCB: 'JCB',
  DN: 'Diners Club',
  MI: 'Maestro',
  UN: 'UnionPay',
};

export const parseTokenDetails = (raw) => {
  try {
    return JSON.parse(raw) || {};
  } catch {
    return {};
  }
};

export const cardBrand = (details) => CARD_TYPES[details.type] || details.type || 'Card';
