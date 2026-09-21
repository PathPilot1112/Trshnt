import React, { useState, useEffect } from 'react';
import { Download, Smartphone, Share, PlusSquare, CheckCircle } from 'lucide-react';
import BackgroundCanvas from '../components/BackgroundCanvas';

const PwaDownloadLanding = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(() => window.__pwaInstallPrompt || null);
  const [showGuide, setShowGuide] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [installStatus, setInstallStatus] = useState('');
  const [isIos, setIsIos] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    const ua = window.navigator.userAgent.toLowerCase();
    const iosDevice = /iphone|ipad|ipod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    setIsIos(iosDevice);
    
    const standaloneMode = Boolean(
      window.matchMedia('(display-mode: standalone)').matches ||
      window.matchMedia('(display-mode: fullscreen)').matches ||
      window.matchMedia('(display-mode: minimal-ui)').matches ||
      window.navigator?.standalone === true ||
      document.referrer.includes('android-app://') ||
      new URLSearchParams(window.location.search).get('pwa') === 'true' ||
      localStorage.getItem('force_pwa_mode') === 'true'
    );
    setIsStandalone(standaloneMode);

    const syncPrompt = (e) => {
      if (e && e.preventDefault && typeof e.preventDefault === 'function') {
        e.preventDefault();
      }
      const promptObj = e?.prompt ? e : (window.__pwaInstallPrompt || null);
      if (promptObj) {
        window.__pwaInstallPrompt = promptObj;
        setDeferredPrompt(promptObj);
      }
    };

    window.addEventListener('pwa-install-ready', syncPrompt);
    window.addEventListener('beforeinstallprompt', syncPrompt);
    window.addEventListener('appinstalled', () => {
      setInstallStatus('App Installed Successfully! Launch The Pripyat Exodus from your home screen.');
      window.__pwaInstallPrompt = null;
      setDeferredPrompt(null);
    });

    // Sync current prompt if already available on window
    if (window.__pwaInstallPrompt) {
      setDeferredPrompt(window.__pwaInstallPrompt);
    }

    // Auto-install: trigger prompt on first interaction or when ready
    const handleFirstGesture = () => {
      const p = window.__pwaInstallPrompt || deferredPrompt;
      if (p && typeof p.prompt === 'function') {
        p.prompt().catch(() => {});
      }
    };
    window.addEventListener('pointerdown', handleFirstGesture, { once: true });

    return () => {
      window.removeEventListener('pwa-install-ready', syncPrompt);
      window.removeEventListener('beforeinstallprompt', syncPrompt);
      window.removeEventListener('pointerdown', handleFirstGesture);
    };
  }, [deferredPrompt]);

  const handleDownloadClick = async () => {
    const promptEvent = deferredPrompt || window.__pwaInstallPrompt;
    if (promptEvent) {
      setIsInstalling(true);
      try {
        promptEvent.prompt();
        const { outcome } = await promptEvent.userChoice;
        if (outcome === 'accepted') {
          setInstallStatus('App Installed! Launch The Pripyat Exodus from your home screen.');
        } else {
          setInstallStatus('Installation deferred. Click below anytime to retry.');
        }
        window.__pwaInstallPrompt = null;
        setDeferredPrompt(null);
      } catch (err) {
        console.error('Install prompt error:', err);
        setShowGuide(true);
      } finally {
        setIsInstalling(false);
      }
      return;
    }

    // On iOS Safari, standard PWA prompt API isn't supported by Apple, so show iOS guide
    if (isIos) {
      setShowGuide(true);
      return;
    }

    // On Android & phone browsers (Chrome, Edge, Samsung Internet, Firefox, Opera, etc.):
    // If prompt is not ready yet, show immediate instructions/modal for fast 1-tap browser installation
    setShowGuide(true);
  };

  if (isStandalone) {
    window.location.hash = '#home';
    return null;
  }

  return (
    <div style={{
      position: 'relative',
      minHeight: '100vh',
      minHeight: '100dvh',
      width: '100vw',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px',
      background: '#002729',
      color: '#fff',
      fontFamily: 'var(--font-mono, monospace)',
      overflowY: 'auto'
    }}>
      <BackgroundCanvas />
      <div className="noise-overlay" />

      {/* Main Glassmorphic Card */}
      <div style={{
        position: 'relative',
        zIndex: 10,
        width: '100%',
        maxWidth: '460px',
        background: 'rgba(0, 39, 41, 0.92)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(46, 229, 64, 0.35)',
        borderRadius: '16px',
        padding: '36px 28px',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.9), 0 0 30px rgba(46, 229, 64, 0.12)',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '16px'
      }}>
        {/* Brand Logos */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '14px', marginBottom: '4px' }}>
          <img 
            src="/logo1.png" 
            alt="Fundaz Logo" 
            style={{ 
              height: '46px', 
              width: '46px', 
              objectFit: 'contain',
              borderRadius: '50%',
              background: '#ffffff',
              padding: '2px',
              boxShadow: '0 0 12px rgba(255, 255, 255, 0.35)'
            }} 
          />
          <img 
            src="/aaruush_logo_clean.png" 
            alt="Aaruush '26 Logo" 
            style={{ 
              height: '42px', 
              maxWidth: '200px', 
              objectFit: 'contain',
              filter: 'drop-shadow(0 0 10px rgba(255, 120, 0, 0.4))'
            }} 
          />
        </div>

        <div style={{ fontSize: '11px', letterSpacing: '2px', color: 'var(--color-neon-green, #2ee540)', textTransform: 'uppercase' }}>
          THE PRIPYAT EXODUS — APP INSTALLATION
        </div>

        <h1 style={{
          fontSize: '26px',
          fontWeight: '900',
          color: '#ffffff',
          letterSpacing: '2px',
          margin: 0,
          fontFamily: 'var(--font-serif, "Cinzel", serif)'
        }}>
          THE PRIPYAT EXODUS
        </h1>

        <p style={{
          fontSize: '13px',
          lineHeight: '1.6',
          color: '#D9E0E0',
          margin: 0,
          maxWidth: '380px',
          fontFamily: 'var(--font-mono, monospace)'
        }}>
          {isIos
            ? 'Access Protocol: Install The Pripyat Exodus to your home screen. The full 3D interactive terminal, confidential dossier registration, and GPS radar will unlock in app mode.'
            : 'Access Protocol: Download & install The Pripyat Exodus app to your device. Once launched from your home screen, all 3D interfaces and clearance registration will unlock.'}
        </p>

        {/* Primary Action Button */}
        <button
          onClick={handleDownloadClick}
          disabled={isInstalling}
          style={{
            width: '100%',
            padding: '16px',
            marginTop: '8px',
            background: 'var(--color-neon-green, #2ee540)',
            color: '#002729',
            border: 'none',
            borderRadius: '4px',
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: '1rem',
            fontWeight: 'bold',
            letterSpacing: '1.5px',
            cursor: isInstalling ? 'wait' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            boxShadow: '0 0 20px rgba(46, 229, 64, 0.35)',
            transition: 'all 0.2s ease',
            textTransform: 'uppercase'
          }}
        >
          <Download size={18} />
          {isInstalling ? 'INSTALLING PROTOCOL...' : 'DOWNLOAD & INSTALL APP'}
        </button>

        {/* Secondary: Show Manual Guide */}
        <button
          onClick={() => setShowGuide(true)}
          style={{
            background: 'none',
            border: 'none',
            color: 'rgba(46, 229, 64, 0.8)',
            fontSize: '0.85rem',
            fontFamily: 'var(--font-mono, monospace)',
            cursor: 'pointer',
            textDecoration: 'underline',
            letterSpacing: '0.5px'
          }}
        >
          [View Manual Installation Instructions]
        </button>

        {/* Status display */}
        {installStatus && (
          <div style={{
            fontSize: '0.85rem',
            color: 'var(--color-neon-green, #2ee540)',
            fontFamily: 'var(--font-mono, monospace)',
            background: 'rgba(46, 229, 64, 0.1)',
            padding: '8px 14px',
            borderRadius: '4px',
            border: '1px solid rgba(46, 229, 64, 0.3)'
          }}>
            {installStatus}
          </div>
        )}

        <div style={{ fontSize: '11px', color: 'rgba(155, 168, 168, 0.8)', letterSpacing: '1px', marginTop: '6px' }}>
          Created by Aaruush | Contact: <a href="tel:7327916970" style={{ color: 'var(--color-neon-green, #2ee540)', textDecoration: 'none' }}>7327916970</a>
        </div>
      </div>

      {/* Manual Installation Guide Modal */}
      {showGuide && (
        <div
          onClick={() => setShowGuide(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 15, 18, 0.88)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '460px',
              background: '#002729',
              border: '2px solid var(--color-neon-green, #2ee540)',
              borderRadius: '8px',
              padding: '24px',
              boxShadow: '0 0 35px rgba(46, 229, 64, 0.25)',
              textAlign: 'left',
              color: '#D9E0E0',
              fontFamily: 'var(--font-mono, monospace)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '15px', fontWeight: 'bold', color: 'var(--color-neon-green, #2ee540)', marginBottom: '16px', letterSpacing: '1px' }}>
              <Smartphone size={20} color="var(--color-neon-green, #2ee540)" />
              {isIos ? 'INSTALL ON IOS SAFARI' : 'INSTALL ON ANDROID, PHONE, OR DESKTOP BROWSER'}
            </div>

            {isIos ? (
              <ol style={{ paddingLeft: '20px', margin: 0, lineHeight: '1.8', fontSize: '13px', color: 'rgba(217, 224, 224, 0.9)' }}>
                <li>Tap the <strong>Share</strong> icon in Safari <Share size={14} style={{ display: 'inline', verticalAlign: 'middle' }} />.</li>
                <li>Scroll down and tap <strong>Add to Home Screen</strong> <PlusSquare size={14} style={{ display: 'inline', verticalAlign: 'middle' }} />.</li>
                <li>Tap <strong>Add</strong> in top-right corner.</li>
                <li>Launch <strong>The Pripyat Exodus</strong> from your Home Screen to unlock the 3D terminal!</li>
              </ol>
            ) : (
              <ol style={{ paddingLeft: '20px', margin: 0, lineHeight: '1.8', fontSize: '13px', color: 'rgba(217, 224, 224, 0.9)' }}>
                <li>Click the <strong>Install / Computer</strong> icon in the address bar, or open the browser menu (<strong>⋮</strong>).</li>
                <li>Select <strong>Install The Pripyat Exodus</strong> or <strong>Add to Home Screen</strong>.</li>
                <li>Confirm installation, then launch The Pripyat Exodus from your apps.</li>
              </ol>
            )}

            <button
              onClick={() => setShowGuide(false)}
              style={{
                width: '100%',
                marginTop: '20px',
                padding: '12px',
                background: 'var(--color-neon-green, #2ee540)',
                color: '#002729',
                border: 'none',
                borderRadius: '4px',
                fontWeight: 'bold',
                fontSize: '13px',
                letterSpacing: '1px',
                textTransform: 'uppercase',
                cursor: 'pointer'
              }}
            >
              ACKNOWLEDGED
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PwaDownloadLanding;
