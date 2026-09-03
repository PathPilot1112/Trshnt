import React from 'react';

const Footer = () => {
  return (
    <footer style={{
      padding: '2rem',
      backgroundColor: 'var(--color-bg)',
      borderTop: '1px solid rgba(155, 168, 168, 0.2)',
      position: 'relative',
      zIndex: 10,
      textAlign: 'center'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '1rem'
      }}>
        <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', color: 'var(--color-accent)' }}>
          TREASURE HUNT // OPERATION CHERNOBYL
        </div>
        
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', color: '#888' }}>
          &copy; {new Date().getFullYear()} Elite Operatives. All clear.
        </div>

        <div style={{ display: 'flex', gap: '1.5rem', marginTop: '1rem' }}>
          <a href="#" style={{ color: 'var(--color-text)', textDecoration: 'none', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>[ TERMS ]</a>
          <a href="#" style={{ color: 'var(--color-text)', textDecoration: 'none', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>[ PRIVACY ]</a>
          <a href="#" style={{ color: 'var(--color-text)', textDecoration: 'none', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>[ CONTACT COMM ]</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
