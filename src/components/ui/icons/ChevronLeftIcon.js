import React from 'react';

const ChevronLeftIcon = ({ size = 18, strokeWidth = 1.75, ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    {...props}
  >
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

export default ChevronLeftIcon;
