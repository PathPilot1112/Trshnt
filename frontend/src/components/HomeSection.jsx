import React, { useState, useEffect } from 'react';

const HomeSection = () => {
  const [typedText, setTypedText] = useState('');
  const fullText = "Descend into the exclusion zone. Follow the clues. Survive the radiation. Initialize transmission.";

  useEffect(() => {
    let currentText = '';
    let i = 0;
    const interval = setInterval(() => {
      if (i < fullText.length) {
        currentText += fullText[i];
        setTypedText(currentText);
        i++;
      } else {
        clearInterval(interval);
      }
    }, 45);
    return () => clearInterval(interval);
  }, []);

  return (
    <section id="home" style={{
      minHeight: '100vh',
      minHeight: '100dvh',
      width: '100%',
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 'max(80px, env(safe-area-inset-top)) 20px 40px 20px',
      overflow: 'hidden',
      zIndex: 10
    }}>
      {/* Background Radial Glow & Grid */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        background: 'radial-gradient(circle at 50% 40%, rgba(57, 255, 20, 0.08) 0%, rgba(8, 16, 17, 0.95) 75%)',
        pointerEvents: 'none'
      }} />

      {/* Atmospheric Grid Overlay */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundImage: 'linear-gradient(rgba(57, 255, 20, 0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(57, 255, 20, 0.04) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
        pointerEvents: 'none',
        opacity: 0.6
      }} />

      {/* Tactical Status Corner Badges */}
      <div style={{
        position: 'absolute',
        top: 'max(80px, env(safe-area-inset-top))',
        left: '20px',
        zIndex: 20,
        fontFamily: "'Share Tech Mono', monospace",
        fontSize: '0.85rem',
        color: '#D9E0E0',
        pointerEvents: 'none',
        lineHeight: '1.6'
      }}>
        SYS.BOOT: <span style={{ color: '#39FF14' }}>OK</span><br />
        PRTCL: <span style={{ color: '#39FF14' }}>ACTIVE</span><br />
        SEC.LVL: <span style={{ color: '#ff3333' }}>OMEGA</span>
      </div>

      <div style={{
        position: 'absolute',
        top: 'max(80px, env(safe-area-inset-top))',
        right: '20px',
        zIndex: 20,
        fontFamily: "'Share Tech Mono', monospace",
        fontSize: '0.85rem',
        color: '#D9E0E0',
        pointerEvents: 'none',
        textAlign: 'right',
        lineHeight: '1.6'
      }}>
        RAD.LVL: <span style={{ color: '#39FF14' }}>3.6 R/hr</span><br />
        STATUS: <span style={{ color: '#39FF14' }}>STABLE</span>
      </div>

      {/* Center Tactical Radiation Symbol (Pure High-Perf SVG Animation) */}
      <div style={{
        position: 'relative',
        width: 'clamp(200px, 45vw, 320px)',
        height: 'clamp(200px, 45vw, 320px)',
        margin: '20px 0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 15
      }}>
        <div style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          border: '2px dashed rgba(57, 255, 20, 0.4)',
          animation: 'spin 25s linear infinite'
        }} />
        
        <div style={{
          position: 'absolute',
          inset: '-15px',
          borderRadius: '50%',
          border: '1px solid rgba(57, 255, 20, 0.2)',
          boxShadow: '0 0 30px rgba(57, 255, 20, 0.15)',
          animation: 'pulse-glow 3s infinite ease-in-out'
        }} />

        <svg viewBox="0 0 100 100" width="70%" height="70%" style={{ filter: 'drop-shadow(0 0 12px rgba(57, 255, 20, 0.6))' }}>
          <circle cx="50" cy="50" r="10" fill="#39FF14" />
          <path d="M50,50 L50,16 A34,34 0 0,1 79.4,33 Z" fill="#39FF14" />
          <path d="M50,50 L79.4,67 A34,34 0 0,1 50,84 Z" fill="#39FF14" />
          <path d="M50,50 L20.6,67 A34,34 0 0,1 20.6,33 Z" fill="#39FF14" />
        </svg>
      </div>

      {/* Main Title Block */}
      <div style={{ textAlign: 'center', zIndex: 20, marginBottom: '24px' }}>
        <h1 className="glitch-text" data-text="CHERNOBYL" style={{
          fontFamily: "'Cinzel', serif",
          fontSize: 'clamp(2.8rem, 9vw, 6.5rem)',
          margin: 0,
          color: '#D9E0E0',
          letterSpacing: '6px',
          lineHeight: 1,
          textShadow: '0 0 25px rgba(217, 224, 224, 0.3)'
        }}>
          CHERNOBYL
        </h1>
        <h2 style={{
          fontFamily: "'Share Tech Mono', monospace",
          letterSpacing: '8px',
          fontSize: 'clamp(1rem, 3.5vw, 1.8rem)',
          marginTop: '8px',
          color: '#39FF14',
          fontWeight: 400
        }}>
          TREASURE HUNT // ZONE_4
        </h2>
      </div>

      {/* Typewriter Terminal Box */}
      <div style={{
        maxWidth: '580px',
        width: '100%',
        backgroundColor: 'rgba(8, 20, 22, 0.92)',
        padding: '16px 20px',
        border: '2px solid rgba(155, 168, 168, 0.4)',
        fontFamily: "'Share Tech Mono', monospace",
        fontSize: 'clamp(0.9rem, 2.5vw, 1.05rem)',
        color: '#D9E0E0',
        zIndex: 20,
        backdropFilter: 'blur(8px)',
        boxShadow: '0 0 20px rgba(0, 0, 0, 0.8), 0 0 10px rgba(57, 255, 20, 0.1)',
        marginBottom: '24px',
        textAlign: 'center'
      }}>
        {typedText}<span style={{ color: '#39FF14', animation: 'blink 1s step-end infinite' }}>_</span>
      </div>

      {/* Tactical Action Buttons */}
      <div style={{
        display: 'flex',
        gap: '14px',
        justifyContent: 'center',
        flexWrap: 'wrap',
        zIndex: 20,
        width: '100%',
        maxWidth: '540px'
      }}>
        <button
          onClick={() => { window.location.hash = '#register'; }}
          style={{
            flex: '1 1 200px',
            padding: '16px 24px',
            background: '#39FF14',
            color: '#081011',
            border: 'none',
            fontFamily: "'Share Tech Mono', monospace",
            fontSize: '1rem',
            fontWeight: 'bold',
            letterSpacing: '2px',
            cursor: 'pointer',
            textTransform: 'uppercase',
            boxShadow: '0 0 20px rgba(57, 255, 20, 0.5)',
            borderRadius: '2px',
            transition: 'all 0.2s ease'
          }}
        >
          [ REGISTER TEAM ]
        </button>

        <button
          onClick={() => { window.location.hash = '#welcome'; }}
          style={{
            flex: '1 1 200px',
            padding: '16px 24px',
            background: 'rgba(8, 20, 22, 0.95)',
            color: '#39FF14',
            border: '2px solid #39FF14',
            fontFamily: "'Share Tech Mono', monospace",
            fontSize: '1rem',
            fontWeight: 'bold',
            letterSpacing: '2px',
            cursor: 'pointer',
            textTransform: 'uppercase',
            boxShadow: '0 0 15px rgba(57, 255, 20, 0.2)',
            borderRadius: '2px',
            transition: 'all 0.2s ease'
          }}
        >
          [ OPERATIVE LOGIN / SCAN QR ]
        </button>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulse-glow {
          0%, 100% { transform: scale(1); opacity: 0.3; }
          50% { transform: scale(1.05); opacity: 0.7; }
        }
        @keyframes blink {
          0%, 49% { opacity: 1; }
          50%, 100% { opacity: 0; }
        }
      `}</style>
    </section>
  );
};

export default HomeSection;
