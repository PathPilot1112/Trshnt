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
    const iosDevice = /iphone|ipad|ipod/.test(ua);
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

    const syncPrompt = () => setDeferredPrompt(window.__pwaInstallPrompt || null);
    window.addEventListener('pwa-install-ready', syncPrompt);
    window.addEventListener('beforeinstallprompt', syncPrompt);
    window.addEventListener('appinstalled', () => {
      setInstallStatus('App Installed Successfully! Launch Treasure Hunt from your home screen.');
      window.__pwaInstallPrompt = null;
      setDeferredPrompt(null);
    });

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
          setInstallStatus('App Installed! Launch Treasure Hunt from your home screen.');
        } else {
          setInstallStatus('Installation deferred.');
        }
        window.__pwaInstallPrompt = null;
        setDeferredPrompt(null);
      } catch {
        setShowGuide(true);
      } finally {
        setIsInstalling(false);
      }
      return;
    }
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
          fontSize: '32px',
          fontWeight: '900',
          color: '#ffffff',
          letterSpacing: '2px',
          margin: 0,
          fontFamily: 'var(--font-serif, "Cinzel", serif)'
        }}>
          ZONE_4
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
            ? 'Access Protocol: Install Treasure Hunt to your home screen. The full 3D interactive terminal, confidential dossier registration, and GPS radar will unlock in app mode.'
            : 'Access Protocol: Download & install the Treasure Hunt tactical app to your device. Once launched from your home screen, all 3D interfaces and clearance registration will unlock.'}
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
            boxShadow: '0 0 20px rgba(57, 255, 20, 0.4)',
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
            color: 'rgba(57, 255, 20, 0.7)',
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
            color: '#39FF14',
            fontFamily: 'var(--font-mono, monospace)',
            background: 'rgba(57, 255, 20, 0.1)',
            padding: '8px 14px',
            borderRadius: '4px',
            border: '1px solid rgba(57, 255, 20, 0.3)'
          }}>
            {installStatus}
          </div>
        )}

        <div style={{ fontSize: '10px', color: 'rgba(155, 168, 168, 0.6)', letterSpacing: '1px' }}>
          STANDALONE EXCLUSION PROTOCOL V4.2
        </div>
      </div>

      {/* Manual Installation Guide Modal */}
      {showGuide && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.85)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.5rem',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(0, 39, 41, 0.98), rgba(0, 20, 22, 0.99))',
            border: '1px solid #39FF14',
            boxShadow: '0 0 40px rgba(57, 255, 20, 0.3)',
            borderRadius: '8px',
            maxWidth: '480px',
            width: '100%',
            padding: '2rem',
            fontFamily: 'var(--font-mono, monospace)'
          }}>
            <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#39FF14', marginBottom: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Smartphone size={20} color="#39FF14" />
              {isIos ? '// INSTALL ON IOS SAFARI' : '// INSTALL ON ANDROID / PC'}
            </div>

            {isIos ? (
              <ol style={{ paddingLeft: '20px', margin: 0, lineHeight: '1.8', fontSize: '13px', color: 'rgba(217, 224, 224, 0.9)' }}>
                <li>Tap the <strong>Share</strong> icon in Safari <Share size={14} style={{ display: 'inline', verticalAlign: 'middle' }} />.</li>
                <li>Scroll down and tap <strong>Add to Home Screen</strong> <PlusSquare size={14} style={{ display: 'inline', verticalAlign: 'middle' }} />.</li>
                <li>Tap <strong>Add</strong> in top-right corner.</li>
                <li>Launch <strong>TREASURE HUNT</strong> from your Home Screen to unlock the 3D terminal!</li>
              </ol>
            ) : (
              <ol style={{ paddingLeft: '20px', margin: 0, lineHeight: '1.8', fontSize: '13px', color: 'rgba(217, 224, 224, 0.9)' }}>
                <li>Click the <strong>Install / Computer</strong> icon in the address bar, or open the browser menu (<strong>⋮</strong>).</li>
                <li>Select <strong>Install Treasure Hunt</strong> or <strong>Add to Home Screen</strong>.</li>
                <li>Confirm installation, then launch Treasure Hunt from your desktop/apps.</li>
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
