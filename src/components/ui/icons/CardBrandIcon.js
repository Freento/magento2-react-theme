import React from 'react';

const BRAND_MARKS = {
  VI: (
    <text x="18" y="16.5" textAnchor="middle" fontSize="9" fontStyle="italic" fontWeight="700" fill="#1A1F71" fontFamily="inherit">VISA</text>
  ),
  MC: (
    <>
      <circle cx="14.5" cy="12" r="6.5" fill="#EB001B" />
      <circle cx="21.5" cy="12" r="6.5" fill="#F79E1B" fillOpacity="0.9" />
    </>
  ),
  AE: (
    <>
      <rect x="1" y="1" width="34" height="22" rx="3" fill="#2E77BB" />
      <text x="18" y="15" textAnchor="middle" fontSize="7" fontWeight="700" fill="#FFFFFF" fontFamily="inherit">AMEX</text>
    </>
  ),
  DI: (
    <>
      <text x="14" y="15" textAnchor="middle" fontSize="6.5" fontWeight="700" fill="#231F20" fontFamily="inherit">DISC</text>
      <circle cx="27" cy="12" r="5" fill="#FF6000" />
    </>
  ),
  JCB: (
    <>
      <rect x="8" y="5" width="6" height="14" rx="2.4" fill="#0E4C96" />
      <rect x="15" y="5" width="6" height="14" rx="2.4" fill="#C8222C" />
      <rect x="22" y="5" width="6" height="14" rx="2.4" fill="#199C4E" />
    </>
  ),
  DN: (
    <>
      <circle cx="18" cy="12" r="7" fill="#0079BE" />
      <rect x="15.5" y="7" width="5" height="10" rx="2.5" fill="#FFFFFF" />
    </>
  ),
  MI: (
    <>
      <circle cx="14.5" cy="12" r="6.5" fill="#0099DF" />
      <circle cx="21.5" cy="12" r="6.5" fill="#ED0006" fillOpacity="0.85" />
    </>
  ),
  UN: (
    <>
      <rect x="8" y="5" width="8" height="14" rx="2.4" fill="#E21836" transform="skewX(-8)" transform-origin="12 12" />
      <rect x="15" y="5" width="8" height="14" rx="2.4" fill="#00447C" transform="skewX(-8)" transform-origin="19 12" />
      <rect x="22" y="5" width="8" height="14" rx="2.4" fill="#007B84" transform="skewX(-8)" transform-origin="26 12" />
    </>
  ),
};

const CardBrandIcon = ({ type, width = 36, ...props }) => (
  <svg
    width={width}
    height={(width * 24) / 36}
    viewBox="0 0 36 24"
    fill="none"
    aria-hidden="true"
    {...props}
  >
    <rect x="0.5" y="0.5" width="35" height="23" rx="3.5" fill="#FFFFFF" stroke="#E8E8E5" />
    {BRAND_MARKS[type] || (
      <>
        <rect x="1" y="5" width="34" height="4" fill="#C9C9C5" />
        <rect x="5" y="15" width="12" height="2.5" rx="1.25" fill="#C9C9C5" />
      </>
    )}
  </svg>
);

export default CardBrandIcon;
