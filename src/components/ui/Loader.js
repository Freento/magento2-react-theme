import React from 'react';

const Loader = ({ size = 'medium', fullScreen = false }) => {
  const sizeMap = {
    small: '20px',
    medium: '40px',
    large: '60px'
  };

  const loaderSize = sizeMap[size] || sizeMap.medium;

  const loaderStyle = {
    border: '2px solid #E8E8E5',
    borderTop: '2px solid #111111',
    borderRadius: '50%',
    width: loaderSize,
    height: loaderSize,
    animation: 'spin 1s linear infinite'
  };

  const containerStyle = fullScreen ? {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '60vh',
    width: '100%'
  } : {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '2rem'
  };

  return (
    <div style={containerStyle}>
      <div style={loaderStyle}></div>
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

export default Loader;
