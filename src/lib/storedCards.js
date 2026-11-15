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

export const VAULT_CODES = {
  braintree: 'braintree_cc_vault',
  braintree_googlepay: 'braintree_googlepay_vault',
  braintree_paypal: 'braintree_paypal_vault',
};

export const vaultCodeOf = (token) => VAULT_CODES[token?.payment_method_code] || null;

export const BILLING_AGREEMENT_CODE = 'paypal_billing_agreement';

export const isVaultCode = (code) => /_vault$/.test(code || '');

export const AUTHNETCIM_STORED_CODE = 'authnetcim_stored';

export const isStoredCode = (code) => isVaultCode(code) || code === BILLING_AGREEMENT_CODE || code === AUTHNETCIM_STORED_CODE;

export const tokenbaseCardLabel = (card) => {
  const info = card?.additional || {};
  const parts = [CARD_TYPES[info.cc_type] || info.cc_type || 'Card'];
  if (info.cc_last4) parts.push(`ending ${info.cc_last4}`);
  if (info.cc_exp_month && info.cc_exp_year) parts.push(`(expires: ${String(info.cc_exp_month).padStart(2, '0')}/${info.cc_exp_year})`);
  return parts.join(' ');
};

export const isAccountToken = (token) => token?.type === 'account' || token?.payment_method_code === 'braintree_paypal';

export const tokenLabel = (token) => {
  const details = parseTokenDetails(token?.details);
  if (isAccountToken(token)) return details.payerEmail || 'PayPal';
  const parts = [cardBrand(details)];
  if (details.maskedCC) parts.push(`ending ${details.maskedCC}`);
  if (details.expirationDate) parts.push(`(expires: ${details.expirationDate})`);
  return parts.join(' ');
};
