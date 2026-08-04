import { useEffect, useRef, useState } from 'react';
import { useLazyQuery, useMutation } from '@apollo/client';
import { GET_AUTHNET_HOSTED_PAYMENT_PARAMS, SYNC_AUTHNET_HOSTED_FORM } from '../../../queries/checkout';

const parseQueryString = (str) => {
  const vars = str.split('&');
  const query = {};
  for (let i = 0; i < vars.length; i++) {
    const pair = vars[i].split('=');
    query[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1] || '');
  }
  return query;
};

// All Authorize.Net hosted-iframe logic: fetch the hosted-form params from
// Magento, post them into the iframe, and bridge the postMessage protocol
// (resize / cancel / transaction response) back to the checkout callbacks.
// The component just renders the iframe + states this returns.
export default function useAcceptHostedIframe({
  cartData,
  customerInfo,
  onTransactionComplete,
  onTransactionError,
  onCancel,
  isVisible = false,
}) {
  const [hostedPaymentToken, setHostedPaymentToken] = useState(null);
  const [hostedPaymentParams, setHostedPaymentParams] = useState(null);
  const [iframeSessionId, setIframeSessionId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [iframeHeight, setIframeHeight] = useState(650);
  const [formUrl, setFormUrl] = useState('');
  const iframeRef = useRef(null);
  const formRef = useRef(null);

  const [getHostedParamsQuery] = useLazyQuery(GET_AUTHNET_HOSTED_PAYMENT_PARAMS);
  // eslint-disable-next-line no-unused-vars
  const [syncHostedFormMutation] = useMutation(SYNC_AUTHNET_HOSTED_FORM);

  // Handle transaction response from iframe
  const handleTransactionResponse = async (params) => {
    try {
      let responseData = params;
      if (params.response && typeof params.response === 'string') {
        try {
          responseData = JSON.parse(params.response);
        } catch (e) {
          console.warn('Failed to parse JSON response:', e);
          responseData = params;
        }
      }

      const response = {
        responseCode: responseData.responseCode || responseData.response_code || params.response_code,
        transactionId: responseData.transId || responseData.trans_id || responseData.transactionId || params.trans_id,
        authCode: responseData.authorization || responseData.auth_code || responseData.authCode || params.auth_code,
        messageCode: responseData.messageCode || responseData.message_code || params.message_code,
        description: responseData.description || params.description,
        accountNumber: responseData.accountNumber || responseData.account_number || params.account_number,
        accountType: responseData.accountType || responseData.account_type || params.account_type,
        amount: responseData.totalAmount || responseData.amount || params.amount,
        invoiceNumber: responseData.orderInvoiceNumber || responseData.invoice_number || params.invoice_number,
        customerId: responseData.customerId,
        dateTime: responseData.dateTime,
        shipTo: responseData.shipTo,
      };

      const isSuccess =
        params.response_code === '1' ||
        params.responseCode === '1' ||
        params.response === '1' ||
        response.transactionId;

      if (isSuccess) {
        setIsLoading(false);
        if (onTransactionComplete) {
          onTransactionComplete({
            success: true,
            transactionId: response.transactionId,
            authCode: response.authCode,
            amount: response.amount,
            response,
            iframeSessionId,
          });
        }
      } else {
        const errorMessage = response.description || params.description || 'Transaction failed';
        console.error('Transaction failed:', errorMessage);
        setError(errorMessage);
        setIsLoading(false);
        if (onTransactionError) {
          onTransactionError({ success: false, error: errorMessage, response });
        }
      }
    } catch (err) {
      console.error('Error parsing transaction response:', err);
      const errorMessage = 'Error processing payment response';
      setError(errorMessage);
      setIsLoading(false);
      if (onTransactionError) {
        onTransactionError({ success: false, error: errorMessage, parsingError: true, response: null });
      }
    }
  };

  // Communication bridge: window.CommunicationHandler (for the iframe
  // communicator) + a direct postMessage listener.
  useEffect(() => {
    const communicationHandler = {
      onReceiveCommunication(argument) {
        let params = {};
        if (argument && argument.qstr) params = parseQueryString(argument.qstr);
        else if (typeof argument === 'string') params = parseQueryString(argument);
        else if (argument && typeof argument === 'object') params = argument;

        switch (params.action) {
          case 'resizeWindow': {
            const height = parseInt(params.height);
            if (height && height > 0) setIframeHeight(height);
            break;
          }
          case 'cancel':
            setError('Payment was cancelled');
            setIsLoading(false);
            if (onCancel) onCancel();
            break;
          case 'transactResponse':
            setIsLoading(false);
            handleTransactionResponse(params);
            break;
          default:
            if (params.response_code || params.trans_id) {
              setIsLoading(false);
              handleTransactionResponse(params);
            }
        }
      },
    };

    window.CommunicationHandler = communicationHandler;
    if (window.parent && window.parent !== window) window.parent.CommunicationHandler = communicationHandler;
    if (window.top && window.top !== window) window.top.CommunicationHandler = communicationHandler;

    const handleWindowMessage = (event) => {
      if (!event.data) return;
      if (
        event.origin === 'https://test.authorize.net' ||
        event.origin === 'https://accept.authorize.net' ||
        event.origin.includes('authorize.net') ||
        event.origin === 'https://arbsession.loc:3000' ||
        event.origin === window.location.origin
      ) {
        let messageData = event.data;
        if (typeof event.data === 'string') {
          try {
            messageData = parseQueryString(event.data);
          } catch (e) {
            messageData = { action: event.data };
          }
        }

        if (messageData.action === 'transactResponse') {
          handleTransactionResponse(messageData);
        } else if (messageData.response_code) {
          handleTransactionResponse(messageData);
        } else if (messageData.action === 'resizeWindow') {
          // handled via CommunicationHandler
        } else {
          if (window.CommunicationHandler && window.CommunicationHandler.onReceiveCommunication) {
            window.CommunicationHandler.onReceiveCommunication(messageData);
          }
          if (event.source && typeof event.source.postMessage === 'function') {
            try {
              event.source.postMessage({ received: true, originalData: messageData }, event.origin);
            } catch (e) {
              console.log('Could not send acknowledgment back to iframe:', e);
            }
          }
        }
      }
    };

    window.addEventListener('message', handleWindowMessage, false);

    return () => {
      if (window.CommunicationHandler) delete window.CommunicationHandler;
      if (window.parent && window.parent !== window && window.parent.CommunicationHandler) {
        delete window.parent.CommunicationHandler;
      }
      if (window.top && window.top !== window && window.top.CommunicationHandler) {
        delete window.top.CommunicationHandler;
      }
      window.removeEventListener('message', handleWindowMessage, false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onTransactionComplete, onTransactionError, onCancel]);

  // Request hosted payment form parameters from Magento GraphQL API
  const requestHostedPaymentToken = async () => {
    if (!cartData?.id) {
      setError('Cart ID is not available. Please refresh the page and try again.');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await getHostedParamsQuery({
        variables: { cartId: cartData.id, guestEmail: customerInfo?.email || null },
      });

      const data = result.data?.authnetcimHostedPaymentFormParams;
      if (data?.iframeAction && data?.iframeParams) {
        setFormUrl(data.iframeAction);
        setIframeSessionId(data.iframeSessionId);

        let params = {};
        try {
          params = JSON.parse(data.iframeParams);
        } catch (e) {
          console.warn('Could not parse iframe params:', data.iframeParams);
          params = { token: data.iframeParams };
        }

        params.iframeCommunicatorUrl = `${window.location.protocol}//${window.location.host}/authnetcim/hosted/communicator`;
        setHostedPaymentParams(params);
        setHostedPaymentToken(params.token || Object.keys(params)[0]);
        return true;
      }
      throw new Error('Failed to get hosted payment parameters');
    } catch (err) {
      console.error('Error requesting hosted payment parameters:', err);
      let errorMessage = 'Failed to initialize secure payment form. ';
      if (err.graphQLErrors?.length > 0) errorMessage += err.graphQLErrors[0].message;
      else if (err.networkError) errorMessage += 'Network error. Please check your connection and try again.';
      else errorMessage += err.message || 'Unknown error occurred.';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize hosted payment form when visible
  useEffect(() => {
    if (isVisible && !hostedPaymentParams && !isLoading) {
      requestHostedPaymentToken();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVisible]);

  // Submit parameters to iframe when available
  useEffect(() => {
    if (hostedPaymentParams && formRef.current && iframeRef.current && formUrl) {
      setTimeout(() => formRef.current.submit(), 100);
    }
  }, [hostedPaymentParams, formUrl]);

  // "Try again" — reset and re-request.
  const retry = () => {
    setError(null);
    setHostedPaymentToken(null);
    setHostedPaymentParams(null);
    requestHostedPaymentToken();
  };

  return {
    error,
    isLoading,
    hostedPaymentParams,
    formUrl,
    iframeHeight,
    iframeRef,
    formRef,
    retry,
  };
}
