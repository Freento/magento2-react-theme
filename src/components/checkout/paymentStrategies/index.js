import braintreeCC from './braintreeCC';
import braintreeCcVault from './braintreeCcVault';
import authnetcim from './authnetcim';
import checkmo from './checkmo';
import paypalExpress from './paypalExpress';
import paypalExpressBml from './paypalExpressBml';

const STRATEGIES = Object.freeze({
  [braintreeCC.code]: braintreeCC,
  [braintreeCcVault.code]: braintreeCcVault,
  [authnetcim.code]: authnetcim,
  [checkmo.code]: checkmo,
  [paypalExpress.code]: paypalExpress,
  [paypalExpressBml.code]: paypalExpressBml,
});

export const getPaymentStrategy = (code) => STRATEGIES[code] || null;

export const isOutOfBandPayment = (code) => {
  return code === 'authnetcim'
    || code === 'paypal_express'
    || code === 'paypal_express_bml'
    || code === 'braintree_googlepay';
};
