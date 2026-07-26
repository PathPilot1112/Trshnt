import React, { useEffect, useState } from 'react';

const FogLayer = () => {
  const [mousePos, setMousePos] = useState({ x: -500, y: -500 });

  useEffect(() => {
    const updatePos = (clientX, clientY) => {
      setMousePos({ x: clientX, y: clientY });
    };

    const handlePointerMove = (e) => {
      updatePos(e.clientX, e.clientY);
    };

    const handleTouchMove = (e) => {
      if (e.touches && e.touches[0]) {
        updatePos(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchstart', handleTouchMove, { passive: true });

    return () => {
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchstart', handleTouchMove);
    };
  }, []);

  const maskStyle = {
    maskImage: `radial-gradient(circle 140px at ${mousePos.x}px ${mousePos.y}px, transparent 0%, transparent 60%, rgba(0,0,0,1) 100%)`,
    WebkitMaskImage: `radial-gradient(circle 140px at ${mousePos.x}px ${mousePos.y}px, transparent 0%, transparent 60%, rgba(0,0,0,1) 100%)`,
  };

  return (
    <div className="fog-container" style={maskStyle}>
      <div className="fog-layer" />
      <div className="fog-layer layer-2" />
      <div className="fog-layer layer-3" />
    </div>
  );
};

export default FogLayer;
