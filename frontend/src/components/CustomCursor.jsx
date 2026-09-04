import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';

const CustomCursor = () => {
  const glowRef = useRef(null);
  const dotRef = useRef(null);
  const ringRef = useRef(null);

  useEffect(() => {
    // Dot follows instantly
    const xDot = gsap.quickTo(dotRef.current, "x", { duration: 0.05, ease: "power3" });
    const yDot = gsap.quickTo(dotRef.current, "y", { duration: 0.05, ease: "power3" });
    
    // Ring follows with slight delay
    const xRing = gsap.quickTo(ringRef.current, "x", { duration: 0.15, ease: "power3" });
    const yRing = gsap.quickTo(ringRef.current, "y", { duration: 0.15, ease: "power3" });

    // Large glow follows with more delay for a trailing effect
    const xGlow = gsap.quickTo(glowRef.current, "x", { duration: 0.3, ease: "power3" });
    const yGlow = gsap.quickTo(glowRef.current, "y", { duration: 0.3, ease: "power3" });

    const handleMouseMove = (e) => {
      // Offset by half of each element's dimensions to center them on the mouse
      xDot(e.clientX - 3);
      yDot(e.clientY - 3);
      
      xRing(e.clientX - 20);
      yRing(e.clientY - 20);
      
      xGlow(e.clientX - 150);
      yGlow(e.clientY - 150);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
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
          zIndex: 9997,
          background: 'radial-gradient(circle, rgba(57, 255, 20, 0.06) 0%, rgba(57, 255, 20, 0) 60%)',
          mixBlendMode: 'screen',
          transform: 'translate(-100vw, -100vh)' // Hide offscreen initially
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
          zIndex: 9998,
          border: '2px dotted rgba(57, 255, 20, 0.6)',
          boxShadow: '0 0 10px rgba(57, 255, 20, 0.2)',
          transform: 'translate(-100vw, -100vh)' 
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
          zIndex: 9999,
          backgroundColor: '#39FF14',
          boxShadow: '0 0 8px #39FF14',
          transform: 'translate(-100vw, -100vh)' 
        }}
      />
    </>
  );
};

export default CustomCursor;
