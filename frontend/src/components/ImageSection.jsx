import React from 'react';

const ImageSection = () => {
  return (
    <section style={{
      padding: '4rem 1.5rem',
      backgroundColor: 'transparent',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
      maxWidth: '1200px',
      margin: '0 auto',
      position: 'relative'
    }}>
      {/* Tactical Card Poster */}
      <div style={{
        position: 'relative',
        width: '100%',
        minHeight: '420px',
        background: 'radial-gradient(circle at center, rgba(57, 255, 20, 0.08) 0%, rgba(8, 20, 22, 0.95) 75%)',
        border: '2px solid rgba(57, 255, 20, 0.35)',
        borderRadius: '6px',
        padding: '3rem 2rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        boxShadow: '0 0 35px rgba(0, 0, 0, 0.9), 0 0 15px rgba(57, 255, 20, 0.15)',
        overflow: 'hidden'
      }}>
        {/* Decorative corner brackets */}
        <div style={{ position: 'absolute', top: '10px', left: '10px', width: '20px', height: '20px', borderTop: '2px solid #39FF14', borderLeft: '2px solid #39FF14' }} />
        <div style={{ position: 'absolute', top: '10px', right: '10px', width: '20px', height: '20px', borderTop: '2px solid #39FF14', borderRight: '2px solid #39FF14' }} />
        <div style={{ position: 'absolute', bottom: '10px', left: '10px', width: '20px', height: '20px', borderBottom: '2px solid #39FF14', borderLeft: '2px solid #39FF14' }} />
        <div style={{ position: 'absolute', bottom: '10px', right: '10px', width: '20px', height: '20px', borderBottom: '2px solid #39FF14', borderRight: '2px solid #39FF14' }} />

        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.85rem',
          color: '#39FF14',
          letterSpacing: '3px',
          marginBottom: '1rem'
        }}>
          // CHERNOBYL_SURVIVAL_PROTOCOL
        </div>

        <h2 style={{
          fontFamily: 'var(--font-serif)',
          fontSize: 'clamp(1.8rem, 4.5vw, 3rem)',
          color: '#D9E0E0',
          letterSpacing: '4px',
          maxWidth: '850px',
          lineHeight: '1.4',
          margin: '0 0 1.5rem 0',
          textShadow: '0 0 20px rgba(217, 224, 224, 0.3)'
        }}>
          GEAR UP YOURSELF WITH THE RULES CAREFULLY TO ESCAPE
        </h2>

        <p style={{
          fontFamily: 'var(--font-sans)',
          fontSize: '1.05rem',
          color: 'rgba(217, 224, 224, 0.8)',
          maxWidth: '680px',
          lineHeight: '1.7',
          margin: 0
        }}>
          Every sector holds hidden clues, encrypted dosimeter telemetry, and critical mission directives. Coordinate with your team and follow safety protocols to secure victory.
        </p>
      </div>
    </section>
  );
};

export default ImageSection;
