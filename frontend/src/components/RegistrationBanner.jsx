import React from 'react';

const RegistrationBanner = ({ onOpenRegister }) => {
  return (
    <section id="registration-banner" style={{
      padding: '4rem 1.5rem',
      backgroundColor: 'rgba(8, 20, 22, 0.85)',
      borderTop: '1px solid rgba(155, 168, 168, 0.25)',
      borderBottom: '1px solid rgba(155, 168, 168, 0.25)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      zIndex: 10
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        maxWidth: '1200px',
        width: '100%',
        gap: '2.5rem',
        flexWrap: 'wrap'
      }}>
        {/* Text Content */}
        <div style={{ flex: '1 1 480px' }}>
          <div style={{ fontSize: '0.85rem', color: '#39FF14', fontFamily: 'var(--font-mono)', letterSpacing: '3px', marginBottom: '0.5rem' }}>
            // JOIN_THE_EXCLUSION_ZONE
          </div>
          <h2 style={{
            fontSize: 'clamp(2rem, 5vw, 3.2rem)',
            color: '#D9E0E0',
            fontFamily: 'var(--font-serif)',
            marginBottom: '1rem',
            letterSpacing: '2px',
            textShadow: '0 0 15px rgba(217, 224, 224, 0.3)'
          }}>
            THE COUNTDOWN HAS BEGUN
          </h2>
          <p style={{
            fontSize: '1.05rem',
            color: 'rgba(217, 224, 224, 0.85)',
            marginBottom: '2rem',
            maxWidth: '600px',
            lineHeight: 1.8,
            fontFamily: 'var(--font-sans)'
          }}>
            Join elite squad forces. Register your team and prepare for an immersive tactical experience in Chernobyl-trshnt.
          </p>

          <button
            onClick={() => {
              window.scrollTo(0, 0);
              if (onOpenRegister) {
                onOpenRegister();
              } else {
                window.location.hash = '#register';
              }
            }}
            style={{
              padding: '1rem 2.5rem',
              background: '#39FF14',
              border: 'none',
              color: '#081011',
              fontFamily: 'var(--font-mono)',
              fontSize: '1.1rem',
              fontWeight: 'bold',
              cursor: 'pointer',
              textTransform: 'uppercase',
              letterSpacing: '2px',
              transition: 'all 0.2s ease',
              borderRadius: '2px',
              boxShadow: '0 0 20px rgba(57, 255, 20, 0.4)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.03)';
              e.currentTarget.style.boxShadow = '0 0 30px rgba(57, 255, 20, 0.7)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = '0 0 20px rgba(57, 255, 20, 0.4)';
            }}
          >
            [ REGISTER SQUAD NOW ]
          </button>
        </div>

        {/* Tactical Heatmap Map Graphic */}
        <div style={{
          flex: '1 1 380px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <div style={{
            width: '100%',
            maxWidth: '440px',
            aspectRatio: '4/3',
            background: '#040d0e',
            border: '2px solid rgba(57, 255, 20, 0.35)',
            borderRadius: '6px',
            position: 'relative',
            overflow: 'hidden',
            fontFamily: 'var(--font-mono)',
            color: 'rgba(57, 255, 20, 0.8)',
            boxShadow: 'inset 0 0 20px rgba(0, 0, 0, 0.8), 0 0 20px rgba(57, 255, 20, 0.1)',
            padding: '1rem'
          }}>
            {/* Corner Brackets */}
            <div style={{ position: 'absolute', top: 0, left: 0, width: '16px', height: '16px', borderTop: '3px solid #39FF14', borderLeft: '3px solid #39FF14' }} />
            <div style={{ position: 'absolute', top: 0, right: 0, width: '16px', height: '16px', borderTop: '3px solid #39FF14', borderRight: '3px solid #39FF14' }} />
            <div style={{ position: 'absolute', bottom: 0, left: 0, width: '16px', height: '16px', borderBottom: '3px solid #39FF14', borderLeft: '3px solid #39FF14' }} />
            <div style={{ position: 'absolute', bottom: 0, right: 0, width: '16px', height: '16px', borderBottom: '3px solid #39FF14', borderRight: '3px solid #39FF14' }} />

            <div style={{
              position: 'absolute',
              inset: '1rem',
              background: 'linear-gradient(rgba(57, 255, 20, 0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(57, 255, 20, 0.08) 1px, transparent 1px)',
              backgroundSize: '25% 25%',
              border: '1px solid rgba(57, 255, 20, 0.2)'
            }}>
              <div style={{ position: 'absolute', top: '10%', left: '15%', width: '70%', height: '70%', background: 'radial-gradient(circle, rgba(57, 255, 20, 0.25) 0%, transparent 70%)' }} />
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#39FF14', letterSpacing: '3px' }}>ZONE_4</div>
                <div style={{ fontSize: '0.75rem', color: '#9BA8A8', marginTop: '4px' }}>SECTOR 04 // PRIPYAT</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default RegistrationBanner;
