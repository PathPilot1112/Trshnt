import React, { useState } from 'react';
import PwaInstallButton from './PwaInstallPrompt';

const Navigation = ({ onNavigate }) => {
  const [menuOpen, setMenuOpen] = useState(false);

  const handleNavClick = (item) => {
    setMenuOpen(false);

    if (item === 'Registration' || item === 'Register') {
      if (onNavigate) {
        onNavigate('register');
      } else {
        window.location.hash = '#register';
      }
      return;
    }

    if (item === 'Login' || item === 'Operator Login') {
      if (onNavigate) {
        onNavigate('welcome');
      } else {
        window.location.hash = '#welcome';
      }
      return;
    }
    
    // Check if we are on home page, if not, navigate home first
    if (window.location.hash && window.location.hash !== '#home' && window.location.hash !== '') {
      if (onNavigate) onNavigate('home');
      else window.location.hash = '#home';
      setTimeout(() => {
        const element = document.getElementById(item.toLowerCase());
        if (element) element.scrollIntoView({ behavior: 'smooth' });
      }, 150);
    } else {
      const element = document.getElementById(item.toLowerCase());
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  const handleHomeClick = () => {
    setMenuOpen(false);
    if (window.location.hash && window.location.hash !== '#home' && window.location.hash !== '') {
      if (onNavigate) onNavigate('home');
      else window.location.hash = '#home';
    } else {
      const element = document.getElementById('home');
      if (element) element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <>
      <nav className="nav-container" style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        padding: '0.8rem 1.2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 1000,
        fontFamily: 'var(--font-mono, monospace)',
        color: '#39FF14',
        background: 'linear-gradient(to bottom, rgba(0, 39, 41, 0.98), rgba(0, 39, 41, 0.85))',
        borderBottom: '1px solid rgba(57, 255, 20, 0.2)',
        boxSizing: 'border-box',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)'
      }}>
        <div 
          className="nav-title" 
          style={{ 
            cursor: 'pointer', 
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }} 
          onClick={handleHomeClick}
          title="Home"
        >
          <img 
            src="/logo1.png" 
            alt="Atomic Pi Logo" 
            style={{ 
              height: '36px', 
              width: '36px', 
              objectFit: 'contain',
              borderRadius: '50%',
              background: '#ffffff',
              padding: '2px',
              boxShadow: '0 0 10px rgba(255, 255, 255, 0.4)',
              transition: 'transform 0.2s ease'
            }} 
          />
          <img 
            src="/logo2.png" 
            alt="Aaruush Logo" 
            style={{ 
              height: '36px', 
              width: '36px', 
              objectFit: 'contain',
              borderRadius: '50%',
              boxShadow: '0 0 10px rgba(255, 120, 0, 0.5)',
              transition: 'transform 0.2s ease'
            }} 
          />
          <span style={{ color: '#39FF14', fontSize: '1rem', marginLeft: '6px' }}>TREASURE_HUNT</span>
        </div>

        {/* Desktop Links */}
        <div className="nav-desktop-menu" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <ul style={{
            display: 'flex',
            listStyle: 'none',
            gap: '1.5rem',
            alignItems: 'center',
            margin: 0,
            padding: 0
          }}>
            {['Rulebooks', 'Registration'].map((item) => (
              <li key={item}>
                <button 
                  onClick={() => handleNavClick(item)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--color-text, #D9E0E0)',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    fontSize: '0.9rem',
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    transition: 'color 0.2s ease'
                  }}
                  onMouseEnter={(e) => e.target.style.color = '#39FF14'}
                  onMouseLeave={(e) => e.target.style.color = 'var(--color-text, #D9E0E0)'}
                >
                  {item}
                </button>
              </li>
            ))}
            <li>
              <button 
                onClick={() => handleNavClick('Login')}
                style={{
                  background: 'rgba(57, 255, 20, 0.1)',
                  border: '1px solid rgba(57, 255, 20, 0.4)',
                  color: '#39FF14',
                  padding: '4px 10px',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  fontSize: '0.8rem',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  borderRadius: '2px'
                }}
              >
                LOGIN [PDA]
              </button>
            </li>
          </ul>
          <PwaInstallButton variant="nav" />
        </div>

        {/* Mobile Actions: Install Icon & Hamburger Button */}
        <div className="nav-mobile-toggle" style={{ display: 'none', alignItems: 'center', gap: '8px' }}>
          <PwaInstallButton variant="nav" style={{ fontSize: '0.75rem', padding: '5px 8px' }} />
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle Navigation Menu"
            style={{
              background: 'rgba(57, 255, 20, 0.15)',
              border: '1px solid #39FF14',
              color: '#39FF14',
              padding: '6px 10px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontSize: '1.1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: '38px',
              minHeight: '34px'
            }}
          >
            {menuOpen ? '✕' : '☰'}
          </button>
        </div>
      </nav>

      {/* Mobile Drawer Menu Overlay */}
      {menuOpen && (
        <div 
          className="mobile-nav-drawer"
          style={{
            position: 'fixed',
            top: '50px',
            left: 0,
            width: '100%',
            maxWidth: '100vw',
            background: 'rgba(0, 24, 26, 0.98)',
            borderBottom: '2px solid #39FF14',
            boxShadow: '0 12px 36px rgba(0,0,0,0.95)',
            zIndex: 1002,
            display: 'flex',
            flexDirection: 'column',
            padding: '1.2rem 1.4rem',
            gap: '1rem',
            fontFamily: 'var(--font-mono, monospace)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            boxSizing: 'border-box'
          }}
        >
          {['Rulebooks', 'Registration'].map((item) => (
            <button
              key={item}
              onClick={() => handleNavClick(item)}
              style={{
                background: 'transparent',
                border: 'none',
                borderBottom: '1px solid rgba(57, 255, 20, 0.2)',
                color: '#D9E0E0',
                padding: '10px 0',
                textAlign: 'left',
                fontSize: '1rem',
                fontFamily: 'inherit',
                textTransform: 'uppercase',
                letterSpacing: '2px',
                cursor: 'pointer'
              }}
            >
              // {item}
            </button>
          ))}

          <button
            onClick={() => handleNavClick('Login')}
            style={{
              background: 'rgba(57, 255, 20, 0.18)',
              border: '1px solid #39FF14',
              color: '#39FF14',
              padding: '12px',
              textAlign: 'center',
              fontSize: '0.95rem',
              fontFamily: 'inherit',
              textTransform: 'uppercase',
              letterSpacing: '2px',
              cursor: 'pointer',
              fontWeight: 'bold',
              marginTop: '0.5rem',
              borderRadius: '2px'
            }}
          >
            LOGIN VIA SCAN QR
          </button>
        </div>
      )}

      {/* Responsive media queries for Navigation */}
      <style>{`
        @media (max-width: 820px) {
          .nav-desktop-menu {
            display: none !important;
          }
          .nav-mobile-toggle {
            display: flex !important;
          }
          .nav-container {
            padding: 0.6rem 0.9rem !important;
          }
          .nav-title {
            font-size: 1.15rem !important;
          }
        }
      `}</style>
    </>
  );
};

export default Navigation;
