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

    return () => {
      window.removeEventListener('pwa-install-ready', syncPrompt);
      window.removeEventListener('beforeinstallprompt', syncPrompt);
    };
  }, []);

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
        background: 'rgba(0, 39, 41, 0.9)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(57, 255, 20, 0.4)',
        borderRadius: '16px',
        padding: '36px 28px',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.9), 0 0 30px rgba(57, 255, 20, 0.15)',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '16px'
      }}>
        {/* App Icon / Badge */}
        <div style={{
          width: '76px',
          height: '76px',
          borderRadius: '18px',
          background: 'linear-gradient(135deg, #00363a 0%, #001f21 100%)',
          border: '2px solid #39FF14',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 25px rgba(57, 255, 20, 0.4)',
          fontSize: '32px',
          fontWeight: 'bold',
          color: '#39FF14'
        }}>
          ☢
        </div>

        <div style={{ fontSize: '11px', letterSpacing: '3px', color: '#39FF14', textTransform: 'uppercase' }}>
          // CLEARANCE REQUIRED // PWA GATE
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
            background: '#39FF14',
            color: '#002729',
            border: 'none',
            borderRadius: '8px',
            fontSize: '15px',
            fontWeight: 'bold',
            fontFamily: 'var(--font-mono, monospace)',
            letterSpacing: '1px',
            textTransform: 'uppercase',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            boxShadow: '0 0 24px rgba(57, 255, 20, 0.4)',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#ffffff';
            e.currentTarget.style.boxShadow = '0 0 30px rgba(255, 255, 255, 0.6)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#39FF14';
            e.currentTarget.style.boxShadow = '0 0 24px rgba(57, 255, 20, 0.4)';
          }}
        >
          <Download size={20} />
          {isInstalling ? 'INSTALLING PROTOCOL…' : isIos ? 'INSTALL ON IPHONE' : '1-CLICK INSTALL APP'}
        </button>

        {installStatus && (
          <div style={{
            fontSize: '12px',
            color: '#39FF14',
            background: 'rgba(57, 255, 20, 0.1)',
            border: '1px solid rgba(57, 255, 20, 0.3)',
            borderRadius: '6px',
            padding: '8px 12px',
            width: '100%'
          }}>
            <CheckCircle size={14} style={{ display: 'inline', marginRight: '6px' }} />
            {installStatus}
          </div>
        )}

        <div style={{ fontSize: '10px', color: 'rgba(155, 168, 168, 0.6)', letterSpacing: '1px' }}>
          STANDALONE EXCLUSION PROTOCOL V4.2
        </div>
      </div>

      {/* Guide Modal */}
      {showGuide && (
        <div
          onClick={() => setShowGuide(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 15, 18, 0.88)',
            backdropFilter: 'blur(8px)',
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
              maxWidth: '400px',
              background: '#002729',
              border: '2px solid #39FF14',
              borderRadius: '8px',
              padding: '24px',
              boxShadow: '0 0 35px rgba(57, 255, 20, 0.3)',
              textAlign: 'left',
              color: '#D9E0E0'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '15px', fontWeight: 'bold', color: '#39FF14', marginBottom: '16px', letterSpacing: '1px' }}>
              <Smartphone size={20} color="#39FF14" />
              {isIos ? '// INSTALL ON IOS SAFARI' : '// INSTALL ON ANDROID / PHONE / BROWSER'}
            </div>

            {isIos ? (
              <ol style={{ paddingLeft: '20px', margin: 0, lineHeight: '1.8', fontSize: '13px', color: 'rgba(217, 224, 224, 0.9)' }}>
                <li>Tap the <strong>Share</strong> icon in Safari <Share size={14} style={{ display: 'inline', verticalAlign: 'middle' }} />.</li>
                <li>Scroll down and tap <strong>Add to Home Screen</strong> <PlusSquare size={14} style={{ display: 'inline', verticalAlign: 'middle' }} />.</li>
                <li>Tap <strong>Add</strong> in top-right corner.</li>
                <li>Launch <strong>The Pripyat Exodus</strong> from your Home Screen to unlock the app!</li>
              </ol>
            ) : (
              <ol style={{ paddingLeft: '20px', margin: 0, lineHeight: '1.8', fontSize: '13px', color: 'rgba(217, 224, 224, 0.9)' }}>
                <li>Tap the browser menu button (<strong>⋮</strong> or <strong>≡</strong>) in Chrome, Edge, Firefox, or Samsung Internet.</li>
                <li>Select <strong>Install App</strong> or <strong>Add to Home Screen</strong>.</li>
                <li>Confirm installation, then open <strong>The Pripyat Exodus</strong> from your home screen.</li>
              </ol>
            )}

            <button
              onClick={() => setShowGuide(false)}
              style={{
                width: '100%',
                marginTop: '20px',
                padding: '12px',
                background: '#39FF14',
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
