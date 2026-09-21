import React, { useRef, useState, useEffect } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import RadiationSymbol from './RadiationSymbol';
import MagicRings from './MagicRings';

const HomeSection = () => {
  const sectionRef = useRef();

  // Typewriter effect state
  const [typedText, setTypedText] = useState('');
  const fullText = "Welcome to the Hunt. Follow the clues. Decode the transmissions. Scroll to begin.";

  useEffect(() => {
    let currentText = '';
    let i = 0;
    const interval = setInterval(() => {
      currentText += fullText[i];
      setTypedText(currentText);
      i++;
      if (i >= fullText.length) clearInterval(interval);
    }, 60);
    return () => clearInterval(interval);
  }, []);

  useGSAP(() => {
    // Parallax disabled to prevent section overlap
  }, { scope: sectionRef });

  return (
    <section id="home" ref={sectionRef} style={{
      backgroundColor: 'transparent',
      zIndex: 10,
      overflow: 'hidden',
      justifyContent: 'center',
      position: 'relative',
      minHeight: '100vh',
      minHeight: '100dvh',
      width: '100%',
      maxWidth: '100vw',
      display: 'flex',
      alignItems: 'center',
      boxSizing: 'border-box'
    }}>
      <style>
        {`
          @keyframes cursor-blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
          .terminal-cursor { animation: cursor-blink 1s step-end infinite; }

          .radiation-container {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: clamp(220px, 60vw, 360px);
            height: clamp(220px, 60vw, 360px);
            z-index: 5;
            pointer-events: auto;
            opacity: 0.9;
          }

          .home-title-block {
            position: absolute;
            top: 15%;
            left: 50%;
            transform: translateX(-50%);
            text-align: center;
            width: 92%;
            max-width: 900px;
            z-index: 20;
            pointer-events: none;
          }

          .home-desc-block {
            position: absolute;
            bottom: 8%;
            left: 50%;
            transform: translateX(-50%);
            text-align: center;
            width: 92%;
            max-width: 520px;
            z-index: 20;
            pointer-events: none;
          }

          @media (max-width: 768px) {
            .radiation-container {
              width: clamp(190px, 56vw, 260px) !important;
              height: clamp(190px, 56vw, 260px) !important;
              top: 50% !important;
            }
            .home-title-block {
              top: 20% !important;
              width: 95% !important;
            }
            .home-desc-block {
              bottom: 6% !important;
              width: 94% !important;
            }
          }
        `}
      </style>

      {/* Magic Rings Background */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1, overflow: 'hidden' }}>
        <MagicRings 
          color="#9BA8A8"
          colorTwo="var(--color-neon-green, #2ee540)"
          opacity={0.75}
          ringCount={5}
          baseRadius={0.18}
          radiusStep={0.14}
          speed={1.4}
          scaleRate={0.3}
        />
      </div>

      {/* Center Revolving Radiation Symbol */}
      <div className="radiation-container">
        <RadiationSymbol />
      </div>

      {/* Hazard Warning Borders */}
      <div className="hazard-border-top"></div>
      <div className="hazard-border-bottom"></div>
      
      {/* CRT Scanlines Overlay */}
      <div className="scanlines"></div>

      {/* Title Text Block (Top) */}
      <div className="home-title-block">
        <h1 className="glitch-text" data-text="TREASURE" style={{ 
          fontSize: 'clamp(2.2rem, 7vw, 5.2rem)', 
          margin: 0,
          letterSpacing: 'clamp(2px, 1.5vw, 6px)',
          lineHeight: 1.05
        }}>
          TREASURE
        </h1>
        <h2 style={{ 
          letterSpacing: 'clamp(4px, 2vw, 9px)', 
          fontSize: 'clamp(1.2rem, 3.2vw, 2.4rem)', 
          marginTop: '6px', 
          fontFamily: 'var(--font-serif, "Cinzel", serif)', 
          color: 'var(--color-neon-green, #2ee540)',
          fontWeight: 'bold'
        }}>
          HUNT
        </h2>
      </div>

      {/* Description Text Block (Bottom) */}
      <div className="home-desc-block">
        <p className="flicker-box" style={{ 
          marginInline: 'auto', 
          backgroundColor: 'rgba(0,39,41,0.92)',
          padding: '0.75rem 1rem',
          border: '1px solid var(--color-neon-green, #2ee540)',
          fontFamily: 'var(--font-mono)',
          fontSize: 'clamp(0.75rem, 2.4vw, 0.95rem)',
          lineHeight: 1.45,
          color: 'var(--color-text)',
          pointerEvents: 'auto',
          backdropFilter: 'blur(8px)',
          boxShadow: '0 0 15px rgba(46, 229, 64, 0.15)',
          borderRadius: '3px'
        }}>
          {typedText}<span className="terminal-cursor" style={{ color: 'var(--color-neon-green, #2ee540)' }}>_</span>
        </p>
      </div>
    </section>
  );
};

export default HomeSection;
