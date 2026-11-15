import React from 'react';

const GoogleGIcon = ({ size = 20, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true" {...props}>
    <path fill="#4285F4" d="M44.5 20H24v8.5h11.7c-1.1 5.3-5.6 8.7-11.7 8.7-7 0-12.6-5.7-12.6-12.7S17 11.8 24 11.8c3.2 0 6.1 1.2 8.3 3.1l6.1-6.1C34.7 5.4 29.7 3 24 3 12.4 3 3 12.4 3 24s9.4 21 21 21c11.5 0 20.7-8.4 20.7-21 0-1.4-.2-2.7-.2-4z" />
  </svg>
);

export default GoogleGIcon;
