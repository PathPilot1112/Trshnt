import React, { useRef, useState, useEffect } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import RadiationSymbol from './RadiationSymbol';
import MagicRings from './MagicRings';

const HomeSection = () => {
  const sectionRef = useRef();

  // Typewriter effect state
  const [typedText, setTypedText] = useState('');
  const fullText = "Descend into the exclusion zone. Follow the clues. Survive the radiation. Scroll to begin the transmission.";

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

          .home-telemetry-left {
            position: absolute;
            top: 4.8rem;
            left: 1.2rem;
            z-index: 20;
            font-family: var(--font-mono);
            font-size: 0.8rem;
            color: var(--color-text);
            pointer-events: none;
            text-align: left;
            line-height: 1.4;
          }

          .home-telemetry-right {
            position: absolute;
            top: 4.8rem;
            right: 1.2rem;
            z-index: 20;
            font-family: var(--font-mono);
            font-size: 0.8rem;
            color: var(--color-text);
            pointer-events: none;
            text-align: right;
            line-height: 1.4;
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
            .home-telemetry-left, .home-telemetry-right {
              font-size: 0.65rem !important;
              top: 3.8rem !important;
              line-height: 1.3 !important;
            }
            .home-telemetry-left {
              left: 0.6rem !important;
            }
            .home-telemetry-right {
              right: 0.6rem !important;
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
          colorTwo="#39FF14"
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
      
      {/* Classified UI Corners */}
      <div className="home-telemetry-left">
        SYS.BOOT: <span className="redacted">OK</span><br/>
        PRTCL: <span style={{ color: '#39FF14' }}>ACTIVE</span><br/>
        SEC.LVL: <span className="redacted">OMEGA</span>
      </div>
      <div className="home-telemetry-right">
        RAD.LVL: <span style={{ color: '#39FF14' }}>3.6R/hr</span><br/>
        <span className="redacted">NOT GREAT</span><br/>
        <span className="redacted">NOT TERRIBLE</span>
      </div>

      {/* Title Text Block (Top) */}
      <div className="home-title-block">
        <h1 className="glitch-text" data-text="CHERNOBYL" style={{ 
          fontSize: 'clamp(2.1rem, 7.5vw, 6rem)', 
          margin: 0,
          letterSpacing: 'clamp(2px, 1.5vw, 6px)',
          lineHeight: 1.05
        }}>
          CHERNOBYL
        </h1>
        <h2 style={{ 
          letterSpacing: 'clamp(3px, 1.8vw, 7px)', 
          fontSize: 'clamp(0.8rem, 2.2vw, 1.5rem)', 
          marginTop: '6px', 
          fontFamily: 'var(--font-mono)', 
          color: 'var(--color-text)' 
        }}>
          TREASURE HUNT
        </h2>
      </div>

      {/* Description Text Block (Bottom) */}
      <div className="home-desc-block">
        <p className="flicker-box" style={{ 
          marginInline: 'auto', 
          backgroundColor: 'rgba(0,39,41,0.92)',
          padding: '0.75rem 1rem',
          border: '1px solid var(--color-neon-green)',
          fontFamily: 'var(--font-mono)',
          fontSize: 'clamp(0.75rem, 2.4vw, 0.95rem)',
          lineHeight: 1.45,
          color: 'var(--color-text)',
          pointerEvents: 'auto',
          backdropFilter: 'blur(8px)',
          boxShadow: '0 0 15px rgba(57, 255, 20, 0.15)',
          borderRadius: '3px'
        }}>
          {typedText}<span className="terminal-cursor" style={{ color: '#39FF14' }}>_</span>
        </p>
      </div>
    </section>
  );
};

export default HomeSection;
