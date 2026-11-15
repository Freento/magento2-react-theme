import React from 'react';
import CardBrandIcon from './CardBrandIcon';
import PayPalLogoIcon from './PayPalLogoIcon';
import GoogleGIcon from './GoogleGIcon';
import { isAccountToken, parseTokenDetails } from '../../../lib/storedCards';

const PaymentTokenIcon = ({ token, className = '' }) => {
  if (isAccountToken(token)) return <PayPalLogoIcon className={className} />;
  const details = parseTokenDetails(token?.details);
  if (token?.payment_method_code !== 'braintree_googlepay') {
    return <CardBrandIcon type={details.type} className={className} />;
  }
  return (
    <span className={`relative inline-flex ${className}`}>
      <CardBrandIcon type={details.type} />
      <span className="absolute -right-1.5 -bottom-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full bg-bg border border-line">
        <GoogleGIcon size={10} />
      </span>
    </span>
  );
};

export default PaymentTokenIcon;
