import React from 'react';

const Footer = () => {
  return (
    <footer style={{
      padding: '2.5rem 1rem',
      backgroundColor: 'var(--color-bg, #081011)',
      borderTop: '1px solid rgba(46, 229, 64, 0.2)',
      position: 'relative',
      zIndex: 10,
      textAlign: 'center',
      width: '100%',
      boxSizing: 'border-box'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '1rem'
      }}>
        {/* Brand Logos */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '14px' }}>
          <img 
            src="/logo1.png" 
            alt="Fundaz Logo" 
            style={{ 
              height: '38px', 
              width: '38px', 
              objectFit: 'contain',
              borderRadius: '50%',
              background: '#ffffff',
              padding: '2px',
              boxShadow: '0 0 10px rgba(255, 255, 255, 0.3)'
            }} 
          />
          <img 
            src="/aaruush_logo_clean.png" 
            alt="Aaruush '26 Logo" 
            style={{ 
              height: '34px', 
              width: 'auto', 
              objectFit: 'contain',
              filter: 'drop-shadow(0 0 8px rgba(255, 120, 0, 0.35))'
            }} 
          />
        </div>

        <div style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(1rem, 3.5vw, 1.3rem)', color: '#ffffff', letterSpacing: '2px', fontWeight: 'bold' }}>
          TREASURE HUNT
        </div>
        
        <div style={{ 
          fontFamily: 'var(--font-mono)', 
          fontSize: '0.9rem', 
          color: 'var(--color-neon-green, #2ee540)',
          letterSpacing: '1px'
        }}>
          Created by Aaruush
        </div>

        <div style={{ 
          fontFamily: 'var(--font-mono)', 
          fontSize: '0.85rem', 
          color: 'var(--color-text, #D9E0E0)',
          letterSpacing: '1px'
        }}>
          Contact: <a href="tel:7327916970" style={{ color: 'var(--color-neon-green, #2ee540)', textDecoration: 'none', fontWeight: 'bold' }}>7327916970</a>
        </div>

        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: '#667777', marginTop: '0.4rem' }}>
          &copy; {new Date().getFullYear()} Aaruush. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
