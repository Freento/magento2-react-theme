import React from 'react';

const PayPalLogoIcon = ({ width = 36, ...props }) => (
  <svg
    width={width}
    height={(width * 24) / 36}
    viewBox="0 0 36 24"
    fill="none"
    aria-hidden="true"
    {...props}
  >
    <rect x="0.5" y="0.5" width="35" height="23" rx="3.5" fill="#FFFFFF" stroke="#E8E8E5" />
    <text x="18" y="15.5" textAnchor="middle" fontSize="8.5" fontStyle="italic" fontWeight="800" fontFamily="inherit">
      <tspan fill="#003087">Pay</tspan>
      <tspan fill="#009CDE">Pal</tspan>
    </text>
  </svg>
);

export default PayPalLogoIcon;
