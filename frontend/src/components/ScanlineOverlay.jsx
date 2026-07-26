import React from 'react';

const ScanlineOverlay = () => {
  return (
    <>
      {/* Neon-green grid overlay */}
      <div className="pda-grid-bg" />
      {/* Very subtle green tint flicker across CRT surface */}
      <div
        className="flicker"
        style={{
          position: 'absolute',
          top: 0, left: 0,
          width: '100%', height: '100%',
          pointerEvents: 'none',
          zIndex: 10,
          background: 'rgba(57, 255, 20, 0.004)',
        }}
      />
    </>
  );
};

export default ScanlineOverlay;
