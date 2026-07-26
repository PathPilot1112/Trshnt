import React, { useEffect, useRef } from 'react';

const CustomCursor = () => {
  const glowRef = useRef(null);
  const dotRef = useRef(null);
  const ringRef = useRef(null);

  useEffect(() => {
    let glowX = -300, glowY = -300;
    let ringX = -300, ringY = -300;
    let dotX = -300, dotY = -300;
    let mouseX = -300, mouseY = -300;
    let animId;

    const lerp = (a, b, t) => a + (b - a) * t;

    const animate = () => {
      // Dot is nearly instant
      dotX = lerp(dotX, mouseX - 3, 0.35);
      dotY = lerp(dotY, mouseY - 3, 0.35);

      // Ring follows with slight lag
      ringX = lerp(ringX, mouseX - 20, 0.15);
      ringY = lerp(ringY, mouseY - 20, 0.15);

      // Large glow trails most
      glowX = lerp(glowX, mouseX - 150, 0.07);
      glowY = lerp(glowY, mouseY - 150, 0.07);

      if (dotRef.current) {
        dotRef.current.style.transform = `translate(${dotX}px, ${dotY}px)`;
      }
      if (ringRef.current) {
        ringRef.current.style.transform = `translate(${ringX}px, ${ringY}px)`;
      }
      if (glowRef.current) {
        glowRef.current.style.transform = `translate(${glowX}px, ${glowY}px)`;
      }

      animId = requestAnimationFrame(animate);
    };

    const updatePos = (clientX, clientY) => {
      mouseX = clientX;
      mouseY = clientY;
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
    animId = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchstart', handleTouchMove);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <>
      {/* Large faint trailing glow */}
      <div
        ref={glowRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '300px',
          height: '300px',
          borderRadius: '50%',
          pointerEvents: 'none',
          zIndex: 99997,
          background: 'radial-gradient(circle, rgba(57, 255, 20, 0.06) 0%, rgba(57, 255, 20, 0) 60%)',
          mixBlendMode: 'screen',
          willChange: 'transform',
        }}
      />
      {/* Outer animated ring */}
      <div
        ref={ringRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          pointerEvents: 'none',
          zIndex: 99998,
          border: '2px dotted rgba(57, 255, 20, 0.6)',
          boxShadow: '0 0 10px rgba(57, 255, 20, 0.2)',
          willChange: 'transform',
        }}
      />
      {/* Inner solid dot */}
      <div
        ref={dotRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          pointerEvents: 'none',
          zIndex: 99999,
          backgroundColor: '#39FF14',
          boxShadow: '0 0 8px #39FF14',
          willChange: 'transform',
        }}
      />
    </>
  );
};

export default CustomCursor;
