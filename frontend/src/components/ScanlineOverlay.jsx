import React from 'react';

const ScanlineOverlay = () => {
  return (
    <>
      <div className="pda-grid-bg"></div>
      <div className="flicker" style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 10,
        background: 'rgba(0, 240, 255, 0.003)'
      }}></div>
    </>
  );
};

export default ScanlineOverlay;
