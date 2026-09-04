import React from 'react';

const Navigation = ({ onNavigate }) => {
  const handleNavClick = (item) => {
    if (item === 'Registration' || item === 'Register') {
      if (onNavigate) {
        onNavigate('register');
      } else {
        window.location.hash = '#register';
      }
      return;
    }
    
    const element = document.getElementById(item.toLowerCase());
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleHomeClick = () => {
    const element = document.getElementById('home');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <nav className="nav-container" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      padding: '1.2rem 2rem',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      zIndex: 100,
      fontFamily: 'var(--font-mono)',
      color: '#39FF14',
      background: 'linear-gradient(to bottom, rgba(0, 39, 41, 0.95), transparent)'
    }}>
      <div className="nav-title" style={{ fontSize: '1.4rem', fontWeight: 'bold', cursor: 'pointer', letterSpacing: '3px' }} onClick={handleHomeClick}>
        CHERNOBYL-TRSHNT
      </div>
      <ul className="nav-links" style={{
        display: 'flex',
        listStyle: 'none',
        gap: '1.8rem',
        alignItems: 'center'
      }}>
        {['History', 'Rulebooks', 'Registration'].map((item) => (
          <li key={item}>
            <button 
              onClick={() => handleNavClick(item)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--color-text)',
                cursor: 'pointer',
                fontFamily: 'inherit',
                fontSize: '0.95rem',
                textTransform: 'uppercase',
                transition: 'color 0.3s ease',
                letterSpacing: '1px'
              }}
              onMouseEnter={(e) => e.target.style.color = '#39FF14'}
              onMouseLeave={(e) => e.target.style.color = 'var(--color-text)'}
            >
              {item}
            </button>
          </li>
        ))}
        <li>
          <button
            onClick={() => { window.location.hash = '#welcome'; }}
            style={{
              padding: '6px 14px',
              background: 'rgba(57, 255, 20, 0.15)',
              border: '1px solid #39FF14',
              color: '#39FF14',
              fontFamily: 'inherit',
              fontSize: '0.85rem',
              cursor: 'pointer',
              textTransform: 'uppercase',
              letterSpacing: '1px'
            }}
          >
            Terminal Login
          </button>
        </li>
      </ul>
    </nav>
  );
};

export default Navigation;
