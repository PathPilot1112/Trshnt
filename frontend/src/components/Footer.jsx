import React from 'react';

const Footer = () => {
  return (
    <footer style={{
      padding: '2rem 1rem',
      backgroundColor: 'var(--color-bg)',
      borderTop: '1px solid rgba(155, 168, 168, 0.2)',
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
        gap: '0.8rem'
      }}>
        <div style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(1rem, 4vw, 1.4rem)', color: 'var(--color-accent)', letterSpacing: '1px' }}>
          THE PRIPYAT EXODUS // EXCLUSION ZONE
        </div>
        
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: '#888' }}>
          &copy; {new Date().getFullYear()} Elite Operatives. All clear.
        </div>

        <div style={{ display: 'flex', gap: '1rem', marginTop: '0.6rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <a href="#" style={{ color: 'var(--color-text)', textDecoration: 'none', fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>[ TERMS ]</a>
          <a href="#" style={{ color: 'var(--color-text)', textDecoration: 'none', fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>[ PRIVACY ]</a>
          <a href="#" style={{ color: 'var(--color-text)', textDecoration: 'none', fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>[ CONTACT COMM ]</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
