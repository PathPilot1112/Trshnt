import React, { useEffect, useRef, useState } from 'react';

const RadiationSymbol = () => {
  const containerRef = useRef(null);
  const [rotation, setRotation] = useState({ rotZ: 0, tiltX: 0, tiltY: 0 });

  useEffect(() => {
    let rotZ = 0;
    let targetTiltX = 0;
    let targetTiltY = 0;
    let currentTiltX = 0;
    let currentTiltY = 0;
    let animId;

    const lerp = (a, b, t) => a + (b - a) * t;

    const animate = () => {
      rotZ += 0.4; // Continuous baseline 360 rotation
      if (rotZ >= 360) rotZ -= 360;

      // Smooth interpolation for mouse 3D tilt
      currentTiltX = lerp(currentTiltX, targetTiltX, 0.08);
      currentTiltY = lerp(currentTiltY, targetTiltY, 0.08);

      setRotation({
        rotZ,
        tiltX: currentTiltX,
        tiltY: currentTiltY,
      });

      animId = requestAnimationFrame(animate);
    };

    const handlePointerMove = (e) => {
      const clientX = e.touches && e.touches[0] ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches && e.touches[0] ? e.touches[0].clientY : e.clientY;
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;

      // Calculate tilt angle based on distance from screen center (-25deg to +25deg)
      targetTiltX = -((clientY - cy) / cy) * 25;
      targetTiltY = ((clientX - cx) / cx) * 25;
    };

    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('touchmove', handlePointerMove, { passive: true });

    animId = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('touchmove', handlePointerMove);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        width: '140px',
        height: '140px',
        perspective: '700px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto',
      }}
    >
      <div
        style={{
          width: '130px',
          height: '130px',
          transform: `perspective(700px) rotateX(${rotation.tiltX}deg) rotateY(${rotation.tiltY}deg) rotateZ(${rotation.rotZ}deg)`,
          transformStyle: 'preserve-3d',
          willChange: 'transform',
        }}
      >
        <svg viewBox="0 0 200 200" style={{ width: '100%', height: '100%' }}>
          <defs>
            <filter id="neon-wireframe-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Outer Radar Geometry Rings */}
          <circle cx="100" cy="100" r="95" fill="none" stroke="#39FF14" strokeWidth="1" strokeDasharray="4 4" opacity="0.4" />
          <circle cx="100" cy="100" r="88" fill="none" stroke="#39FF14" strokeWidth="0.8" opacity="0.6" />
          <circle cx="100" cy="100" r="76" fill="none" stroke="#39FF14" strokeWidth="0.5" strokeDasharray="12 6" opacity="0.5" />

          {/* Registration Radiation Symbol — 3 Wireframe Hatched Blades + Geometric Core */}
          <g stroke="#39FF14" fill="none" filter="url(#neon-wireframe-glow)">
            {[0, 120, 240].map((angle, idx) => (
              <g key={idx} transform={`rotate(${angle} 100 100)`}>
                {/* Main Outer Blade Outline */}
                <path
                  d="M 100 30 A 70 70 0 0 1 160.6 65 L 122.5 87 A 26 26 0 0 0 100 74 Z"
                  fill="rgba(57, 255, 20, 0.18)"
                  stroke="#39FF14"
                  strokeWidth="1.8"
                />
                {/* Wireframe Hatch Lines inside blade */}
                <line x1="100" y1="30" x2="100" y2="74" stroke="#39FF14" strokeWidth="1" opacity="0.9" />
                <line x1="115" y1="35" x2="106" y2="70" stroke="#39FF14" strokeWidth="0.7" opacity="0.75" />
                <line x1="130" y1="43" x2="112" y2="78" stroke="#39FF14" strokeWidth="0.7" opacity="0.75" />
                <line x1="145" y1="53" x2="118" y2="83" stroke="#39FF14" strokeWidth="0.7" opacity="0.75" />
                {/* Arc ribbed edge detailing */}
                <path d="M 102 33 A 67 67 0 0 1 157 67" stroke="#39FF14" strokeWidth="0.8" strokeDasharray="3 2" opacity="0.85" />
              </g>
            ))}

            {/* Geometric Central Core Circle */}
            <circle cx="100" cy="100" r="22" fill="rgba(0, 24, 26, 0.95)" stroke="#39FF14" strokeWidth="2" />
            {/* Inscribed Pentagon & Triangle Geometry */}
            <polygon points="100,80 119,94 112,117 88,117 81,94" stroke="#39FF14" strokeWidth="1" fill="none" opacity="0.9" />
            <polygon points="100,82 116,112 84,112" stroke="#39FF14" strokeWidth="0.8" fill="none" opacity="0.8" />
            <circle cx="100" cy="100" r="4" fill="#39FF14" />
          </g>
        </svg>
      </div>
    </div>
  );
};

export default RadiationSymbol;
