import React from 'react';
import AcceptHostedIframe from './AcceptHostedIframe';

const AuthorizeNetForm = ({
  tokenbaseConfig = null,
  cartData = null,
  onTransactionComplete = null,
  onTransactionError = null,
  guestEmail = null
}) => {
  const handleIframeTransactionComplete = (result) => {
    if (onTransactionComplete) {
      onTransactionComplete(result);
    }
  };

  const handleIframeTransactionError = (error) => {
    console.error('Iframe transaction error:', error);
    if (onTransactionError) {
      onTransactionError(error);
    }
  };

  const handleIframeCancel = () => {
    console.log('Payment cancelled by user');
  };

  return (
    <div className="authorizenet-form">
      <h4 className="card-form-title">Secure Credit Card Payment</h4>

      <AcceptHostedIframe
        tokenbaseConfig={tokenbaseConfig}
        cartData={cartData}
        customerInfo={{ email: guestEmail }}
        onTransactionComplete={handleIframeTransactionComplete}
        onTransactionError={handleIframeTransactionError}
        onCancel={handleIframeCancel}
        isVisible={true}
      />
    </div>
  );
};

export default AuthorizeNetForm;