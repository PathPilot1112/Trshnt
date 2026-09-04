import React from 'react';

const RadiationSymbol = () => {
  return (
    <div className="hero-biohazard-glow-ring" style={{
      width: '140px',
      height: '140px',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      margin: '0 auto',
      position: 'relative'
    }}>
      <svg
        viewBox="0 0 100 100"
        className="glowing-biohazard-svg-graphic"
        style={{
          width: '110px',
          height: '110px',
          filter: 'drop-shadow(0 0 10px #39FF14) drop-shadow(0 0 18px rgba(57, 255, 20, 0.5))'
        }}
      >
        <circle cx="50" cy="50" r="10" fill="#39FF14" />
        <path d="M50,50 L50,16 A34,34 0 0,1 79.4,33 Z" fill="#39FF14" />
        <path d="M50,50 L79.4,67 A34,34 0 0,1 50,84 Z" fill="#39FF14" />
        <path d="M50,50 L20.6,67 A34,34 0 0,1 20.6,33 Z" fill="#39FF14" />
      </svg>
    </div>
  );
};

export default RadiationSymbol;
