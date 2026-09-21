import React, { useState, useEffect } from 'react';

/**
 * Custom hook to manage PWA installability state
 */
export function usePwaInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if already in standalone mode
    const isStandalone = 
      window.matchMedia('(display-mode: standalone)').matches || 
      window.navigator.standalone === true;
      
    setIsInstalled(isStandalone);

    // Detect iOS
    const ua = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(ua);
    setIsIOS(isIosDevice);

    // Capture standard PWA install event (Chrome, Edge, Android, etc.)
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const triggerInstall = async (onShowIOSModal) => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else if (isIOS && onShowIOSModal) {
      onShowIOSModal(true);
    } else if (onShowIOSModal) {
      onShowIOSModal(true);
    }
  };

  return {
    deferredPrompt,
    isInstalled,
    isIOS,
    canInstall: !isInstalled && (Boolean(deferredPrompt) || isIOS),
    triggerInstall,
  };
}

/**
 * Reusable PWA Install & Download Button
 */
export default function PwaInstallButton({ variant = 'nav', className = '', style = {} }) {
  const { isInstalled, isIOS, deferredPrompt, triggerInstall } = usePwaInstall();
  const [showModal, setShowModal] = useState(false);

  // If already installed, show subtle badge in dossier or hide in nav
  if (isInstalled) {
    if (variant === 'dossier') {
      return (
        <span style={{
          fontSize: '0.75rem',
          color: '#008800',
          fontFamily: 'Courier New, monospace',
          letterSpacing: '1px',
          padding: '2px 8px',
          border: '1px solid #008800',
          background: 'rgba(0, 136, 0, 0.1)',
          ...style
        }}>
          [✓ APP INSTALLED]
        </span>
      );
    }
    return null;
  }

  const handleClick = () => {
    triggerInstall(setShowModal);
  };

  return (
    <>
      {variant === 'nav' ? (
        <button
          onClick={handleClick}
          title="Download/Install The Pripyat Exodus App"
          className={`pwa-install-btn ${className}`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(57, 255, 20, 0.08)',
            border: '1px solid var(--color-neon-green)',
            color: 'var(--color-neon-green)',
            padding: '6px 14px',
            cursor: 'pointer',
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: '0.85rem',
            letterSpacing: '1px',
            textTransform: 'uppercase',
            borderRadius: '2px',
            transition: 'all 0.25s ease',
            boxShadow: '0 0 10px rgba(57, 255, 20, 0.2)',
            ...style
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--color-neon-green)';
            e.currentTarget.style.color = '#002729';
            e.currentTarget.style.boxShadow = '0 0 15px rgba(57, 255, 20, 0.5)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(57, 255, 20, 0.08)';
            e.currentTarget.style.color = 'var(--color-neon-green)';
            e.currentTarget.style.boxShadow = '0 0 10px rgba(57, 255, 20, 0.2)';
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          DOWNLOAD APP
        </button>
      ) : (
        /* Dossier / Registration document variant */
        <button
          onClick={handleClick}
          type="button"
          title="Install App for Offline Dossier Access"
          className={`pwa-dossier-btn ${className}`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: '#ffffea',
            border: '1px dashed #990000',
            color: '#990000',
            padding: '4px 10px',
            cursor: 'pointer',
            fontFamily: 'Courier New, monospace',
            fontSize: '0.75rem',
            fontWeight: 'bold',
            letterSpacing: '1px',
            textTransform: 'uppercase',
            transition: 'all 0.2s ease',
            ...style
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#990000';
            e.currentTarget.style.color = '#fff';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#ffffea';
            e.currentTarget.style.color = '#990000';
          }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          INSTALL APP [OFFLINE ACCESS]
        </button>
      )}

      {/* Instructional Modal (for iOS or browsers requiring manual install) */}
      {showModal && (
        <div 
          onClick={() => setShowModal(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 15, 18, 0.85)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1.5rem',
          }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#002729',
              border: '2px solid #39FF14',
              boxShadow: '0 0 30px rgba(57, 255, 20, 0.3)',
              borderRadius: '4px',
              maxWidth: '440px',
              width: '100%',
              padding: '1.5rem',
              color: '#e0e0e0',
              fontFamily: 'var(--font-mono, monospace)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(57, 255, 20, 0.3)', paddingBottom: '0.8rem', marginBottom: '1rem' }}>
              <span style={{ color: '#39FF14', fontWeight: 'bold', fontSize: '1rem', letterSpacing: '2px' }}>
                INSTALL THE PRIPYAT EXODUS APP
              </span>
              <button 
                onClick={() => setShowModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#9BA8A8',
                  fontSize: '1.2rem',
                  cursor: 'pointer',
                }}
              >
                ✕
              </button>
            </div>

            <p style={{ fontSize: '0.85rem', lineHeight: '1.6', color: '#9BA8A8', marginBottom: '1.2rem' }}>
              {isIOS ? (
                <>To install the application on iOS Safari, follow these security protocol steps:</>
              ) : (
                <>To install The Pripyat Exodus as a standalone desktop/mobile app:</>
              )}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
              {isIOS ? (
                <>
                  <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center', background: 'rgba(0,0,0,0.3)', padding: '0.6rem 0.8rem', borderLeft: '3px solid #39FF14' }}>
                    <span style={{ fontSize: '1.2rem' }}>1.</span>
                    <span>Tap the <strong>Share button</strong> in Safari (bottom navigation bar)</span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center', background: 'rgba(0,0,0,0.3)', padding: '0.6rem 0.8rem', borderLeft: '3px solid #39FF14' }}>
                    <span style={{ fontSize: '1.2rem' }}>2.</span>
                    <span>Scroll down and select <strong>"Add to Home Screen"</strong></span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center', background: 'rgba(0,0,0,0.3)', padding: '0.6rem 0.8rem', borderLeft: '3px solid #39FF14' }}>
                    <span style={{ fontSize: '1.2rem' }}>3.</span>
                    <span>Tap <strong>Add</strong> in top-right. Launch The Pripyat Exodus from your home screen.</span>
                  </div>
                </>
              ) : (
                <>
                  <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center', background: 'rgba(0,0,0,0.3)', padding: '0.6rem 0.8rem', borderLeft: '3px solid #39FF14' }}>
                    <span style={{ fontSize: '1.2rem' }}>1.</span>
                    <span>Tap browser menu (<strong>⋮</strong>) or check address bar for <strong>Install / Computer Icon</strong></span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center', background: 'rgba(0,0,0,0.3)', padding: '0.6rem 0.8rem', borderLeft: '3px solid #39FF14' }}>
                    <span style={{ fontSize: '1.2rem' }}>2.</span>
                    <span>Click <strong>Install The Pripyat Exodus</strong> to enable fast standalone launch & 3D caching</span>
                  </div>
                </>
              )}
            </div>

            <button
              onClick={() => setShowModal(false)}
              style={{
                width: '100%',
                padding: '0.7rem',
                background: '#39FF14',
                color: '#002729',
                fontWeight: 'bold',
                fontFamily: 'inherit',
                border: 'none',
                cursor: 'pointer',
                letterSpacing: '1px',
                textTransform: 'uppercase',
              }}
            >
              ACKNOWLEDGED
            </button>
          </div>
        </div>
      )}
    </>
  );
}
