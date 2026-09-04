import React from 'react';

const BackgroundCanvas = () => {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      zIndex: 1,
      pointerEvents: 'none',
      background: 'radial-gradient(circle at 50% 35%, #0d1e20 0%, #050c0d 75%, #020607 100%)',
      overflow: 'hidden'
    }}>
      {/* Tactical Radar Grid Overlay */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: 'linear-gradient(rgba(57, 255, 20, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(57, 255, 20, 0.03) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
        opacity: 0.8
      }} />

      {/* Subtle Vignette Gradient */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'radial-gradient(circle at center, transparent 40%, rgba(0, 0, 0, 0.8) 100%)'
      }} />
    </div>
  );
};

export default BackgroundCanvas;
