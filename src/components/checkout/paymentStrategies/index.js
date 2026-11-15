import braintreeCC from './braintreeCC';
import { braintreeCcVault, braintreeGooglePayVault, braintreePayPalVault } from './braintreeVault';
import authnetcim from './authnetcim';
import authnetcimStored from './authnetcimStored';
import checkmo from './checkmo';
import paypalExpress from './paypalExpress';
import paypalExpressBml from './paypalExpressBml';
import paypalBillingAgreement from './paypalBillingAgreement';

const STRATEGIES = Object.freeze({
  [braintreeCC.code]: braintreeCC,
  [braintreeCcVault.code]: braintreeCcVault,
  [braintreeGooglePayVault.code]: braintreeGooglePayVault,
  [braintreePayPalVault.code]: braintreePayPalVault,
  [authnetcim.code]: authnetcim,
  [authnetcimStored.code]: authnetcimStored,
  [checkmo.code]: checkmo,
  [paypalExpress.code]: paypalExpress,
  [paypalExpressBml.code]: paypalExpressBml,
  [paypalBillingAgreement.code]: paypalBillingAgreement,
});

export const getPaymentStrategy = (code) => STRATEGIES[code] || null;
