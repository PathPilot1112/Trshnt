import React, { useRef, useState, useEffect } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import RadiationSymbol from './RadiationSymbol';
import MagicRings from './MagicRings';
import RadarInstrument from './RadarInstrument';
import TransmissionTower from './TransmissionTower';

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
    // Removed section-level parallax to prevent it from colliding and overlapping with the next section (StorySection).
  }, { scope: sectionRef });

  return (
    <section id="home" ref={sectionRef} style={{
      backgroundColor: 'transparent',
      zIndex: 10,
      overflow: 'hidden',
      justifyContent: 'center',
      position: 'relative'
    }}>
      <style>
        {`
          @keyframes cursor-blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
          .terminal-cursor { animation: cursor-blink 1s step-end infinite; }
        `}
      </style>

      {/* Magic Rings Background */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1 }}>
        <MagicRings 
          color="#9BA8A8"
          colorTwo="#39FF14"
          opacity={0.8}
          ringCount={6}
          baseRadius={0.2}
          radiusStep={0.15}
          speed={1.5}
          scaleRate={0.3}
        />
      </div>

      {/* Radiation Symbol centered within the rings */}
      <div className="radiation-container" style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '350px',
        height: '350px',
        zIndex: 5,
        pointerEvents: 'auto',
        opacity: 0.8
      }}>
        <RadiationSymbol />
      </div>

      {/* Left Industrial Reactor Plant */}
      <div className="desktop-only" style={{
        position: 'absolute',
        top: '10%',
        bottom: '0',
        left: '2%',
        width: '400px',
        height: '85vh',
        zIndex: 4,
        pointerEvents: 'auto',
        opacity: 0.9
      }}>
        <RadarInstrument />
      </div>

      {/* Right Transmission Tower Plant */}
      <div className="desktop-only" style={{
        position: 'absolute',
        top: '10%',
        bottom: '0',
        right: '2%',
        width: '400px',
        height: '85vh',
        zIndex: 4,
        pointerEvents: 'auto',
        opacity: 0.9
      }}>
        <TransmissionTower />
      </div>

      {/* Hazard Warning Borders */}
      <div className="hazard-border-top"></div>
      <div className="hazard-border-bottom"></div>
      
      {/* CRT Scanlines Overlay */}
      <div className="scanlines"></div>
      
      {/* Classified UI Corners */}
      <div style={{ position: 'absolute', top: '6rem', left: '2rem', zIndex: 20, fontFamily: 'var(--font-mono)', fontSize: '0.9rem', color: 'var(--color-text)', pointerEvents: 'none', textAlign: 'left', textShadow: 'none' }}>
        SYS.BOOT: <span className="redacted">OK</span><br/>
        PRTCL: <span className="text-neon-green">ACTIVE</span><br/>
        SEC.LVL: <span className="redacted">OMEGA</span>
      </div>
      <div style={{ position: 'absolute', top: '6rem', right: '2rem', zIndex: 20, fontFamily: 'var(--font-mono)', fontSize: '0.9rem', color: 'var(--color-text)', pointerEvents: 'none', textAlign: 'right', textShadow: 'none' }}>
        RAD.LVL: <span className="text-neon-green">3.6R/hr</span><br/>
        <span className="redacted">NOT GREAT</span><br/>
        <span className="redacted">NOT TERRIBLE</span>
      </div>

      {/* Title Text Block (Top) */}
      <div className="home-title-container" style={{ position: 'absolute', top: '25%', left: '50%', transform: 'translateX(-50%)', textAlign: 'center', width: '100%', zIndex: 20, pointerEvents: 'none' }}>
        <h1 className="home-title glitch-text" data-text="CHERNOBYL" style={{ fontSize: '8rem', margin: 0 }}>
          CHERNOBYL
        </h1>
        <h2 className="home-subtitle" style={{ letterSpacing: '8px', fontSize: '2rem', marginTop: '-15px', fontFamily: 'var(--font-mono)', color: 'var(--color-text)' }}>
          TREASURE HUNT
        </h2>
      </div>

      {/* Description Text Block (Bottom) */}
      <div className="home-description-container" style={{ position: 'absolute', bottom: '18%', left: '50%', transform: 'translateX(-50%)', textAlign: 'center', width: '100%', zIndex: 20, pointerEvents: 'none' }}>
        <p className="flicker-box" style={{ 
          maxWidth: '600px', 
          marginInline: 'auto', 
          backgroundColor: 'rgba(0,39,41,0.85)',
          padding: '1rem',
          border: '2px solid var(--color-text)',
          fontFamily: 'var(--font-mono)',
          fontSize: '1.1rem',
          color: 'var(--color-text)',
          pointerEvents: 'auto',
          backdropFilter: 'blur(4px)'
        }}>
          {typedText}<span className="text-neon-green terminal-cursor">_</span>
        </p>
      </div>
    </section>
  );
};

export default HomeSection;
