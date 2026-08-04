import { useQuery, useMutation } from '@apollo/client';
import { GET_CUSTOMER_DATA } from '../../../queries/customer';
import {
  GET_AVAILABLE_SHIPPING_METHODS,
  GET_AVAILABLE_PAYMENT_METHODS,
  GET_COUNTRIES,
  GET_TOKENBASE_CHECKOUT_CONFIG,
  SET_SHIPPING_ADDRESS_AND_EMAIL,
  SET_SHIPPING_ADDRESS_FOR_CUSTOMER,
  SET_BILLING_ADDRESS,
  SET_SHIPPING_METHOD,
  SET_PAYMENT_METHOD,
  PLACE_ORDER,
  SYNC_AUTHNET_HOSTED_FORM,
} from '../../../queries/checkout';
import { useBraintreeClientToken } from '../lib/braintree';

export default function useCheckoutQueries({ cartId, currentStep, user }) {
  const shippingMethods = useQuery(GET_AVAILABLE_SHIPPING_METHODS, {
    variables: { cartId },
    skip: !cartId || currentStep < 2,
    fetchPolicy: 'network-only',
    notifyOnNetworkStatusChange: false,
  });

  const paymentMethods = useQuery(GET_AVAILABLE_PAYMENT_METHODS, {
    variables: { cartId },
    skip: !cartId || currentStep < 3,
    fetchPolicy: 'cache-first',
    notifyOnNetworkStatusChange: false,
  });

  const countries = useQuery(GET_COUNTRIES, {
    fetchPolicy: 'cache-first',
  });

  const customer = useQuery(GET_CUSTOMER_DATA, {
    skip: !user,
    fetchPolicy: 'cache-first',
  });

  const tokenbase = useQuery(GET_TOKENBASE_CHECKOUT_CONFIG, {
    variables: { method: 'authnetcim' },
    skip: !paymentMethods.data?.cart?.available_payment_methods?.some(
      (m) => m.code === 'authnetcim',
    ),
    fetchPolicy: 'cache-first',
  });

  const [setShippingAddressAndEmail]    = useMutation(SET_SHIPPING_ADDRESS_AND_EMAIL);
  const [setShippingAddressForCustomer] = useMutation(SET_SHIPPING_ADDRESS_FOR_CUSTOMER);
  const [setBillingAddress]             = useMutation(SET_BILLING_ADDRESS);
  const [setShippingMethod]             = useMutation(SET_SHIPPING_METHOD);
  const [setPaymentMethod]              = useMutation(SET_PAYMENT_METHOD);
  const [placeOrder]                    = useMutation(PLACE_ORDER);
  const [syncHostedForm]                = useMutation(SYNC_AUTHNET_HOSTED_FORM);
  const createBraintreeClientToken      = useBraintreeClientToken();

  return {
    queries: {
      shippingMethods,
      paymentMethods,
      countries,
      customer,
      tokenbase,
    },
    mutations: {
      setShippingAddressAndEmail,
      setShippingAddressForCustomer,
      setBillingAddress,
      setShippingMethod,
      setPaymentMethod,
      placeOrder,
      syncHostedForm,
      createBraintreeClientToken,
    },
    data: {
      countries: countries.data?.countries || [],
      customerAddresses: customer.data?.customer?.addresses || [],
      paymentMethods: paymentMethods.data?.cart?.available_payment_methods || [],
      shippingAddresses: shippingMethods.data?.cart?.shipping_addresses || [],
      tokenbaseConfig: tokenbase.data?.tokenBaseCheckoutConfig || null,
    },
    loading: {
      shippingMethods: shippingMethods.loading,
      paymentMethods: paymentMethods.loading,
    },
    refetch: {
      shippingMethods: shippingMethods.refetch,
    },
  };
}
