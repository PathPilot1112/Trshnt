import React, { useState, useEffect } from 'react';
import { Download, Shield, Smartphone, Radio, CheckCircle2, Lock } from 'lucide-react';
import BackgroundCanvas from '../components/BackgroundCanvas';

const PwaDownloadLanding = ({ onOpenRegister, onOpenLogin }) => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showIosGuide, setShowIosGuide] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [installStatus, setInstallStatus] = useState('');
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const iosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIos(iosDevice);

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      localStorage.setItem('chernobyl_pwa_installed', 'true');
      setInstallStatus('PWA installed successfully! Redirecting to app home...');
      setTimeout(() => {
        window.location.hash = '#home';
      }, 1000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleDownloadClick = async () => {
    setIsInstalling(true);
    setInstallStatus('Initializing PWA download package...');

    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          localStorage.setItem('chernobyl_pwa_installed', 'true');
          setInstallStatus('PWA installed successfully! Launching app...');
          setTimeout(() => {
            window.location.hash = '#home';
          }, 1200);
        } else {
          setInstallStatus('Installation prompt dismissed.');
        }
        setDeferredPrompt(null);
      } catch (err) {
        console.error('Install prompt error:', err);
        setInstallStatus('Installation triggered. Check browser prompts.');
      } finally {
        setIsInstalling(false);
      }
    } else if (isIos) {
      setShowIosGuide(true);
      setIsInstalling(false);
    } else {
      setShowIosGuide(true);
      setIsInstalling(false);
    }
  };

  return (
    <div style={{
      position: 'relative',
      minHeight: '100vh',
      minHeight: '100dvh',
      width: '100vw',
      background: 'var(--color-bg, #002729)',
      color: 'var(--color-text, #D9E0E0)',
      fontFamily: "'Share Tech Mono', 'Inter', monospace",
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      overflowX: 'hidden',
      padding: 'max(20px, env(safe-area-inset-top)) max(16px, env(safe-area-inset-right)) max(20px, env(safe-area-inset-bottom)) max(16px, env(safe-area-inset-left))',
    }}>
      {/* Background FX */}
      <BackgroundCanvas />
      <div className="noise-overlay" />
      <div className="scanlines" />

      {/* Top Header Bar */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        padding: 'max(12px, env(safe-area-inset-top)) 24px 12px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'linear-gradient(180deg, rgba(0,25,27,0.95) 0%, rgba(0,25,27,0) 100%)',
        zIndex: 20
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Radio size={16} style={{ color: '#39FF14' }} />
          <span style={{ fontSize: '13px', letterSpacing: '2px', color: '#39FF14', fontWeight: 'bold' }}>
            CHERNOBYL_PWA_PORTAL
          </span>
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          <span className="red-stamp-mini">TOP SECRET</span>
        </div>
      </div>

      {/* Main Hero Card */}
      <div style={{
        position: 'relative',
        zIndex: 10,
        maxWidth: '620px',
        width: '100%',
        background: 'rgba(0, 39, 41, 0.88)',
        backdropFilter: 'blur(14px)',
        border: '2px solid rgba(155, 168, 168, 0.35)',
        boxShadow: '0 0 40px rgba(0, 0, 0, 0.95), 0 0 25px rgba(57, 255, 20, 0.15)',
        padding: '36px 24px',
        textAlign: 'center',
        margin: '60px auto 20px auto',
        borderRadius: '4px'
      }}>
        {/* Corner Brackets */}
        <div style={{ position: 'absolute', top: 0, left: 0, width: '16px', height: '16px', borderTop: '3px solid #39FF14', borderLeft: '3px solid #39FF14' }} />
        <div style={{ position: 'absolute', top: 0, right: 0, width: '16px', height: '16px', borderTop: '3px solid #39FF14', borderRight: '3px solid #39FF14' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, width: '16px', height: '16px', borderBottom: '3px solid #39FF14', borderLeft: '3px solid #39FF14' }} />
        <div style={{ position: 'absolute', bottom: 0, right: 0, width: '16px', height: '16px', borderBottom: '3px solid #39FF14', borderRight: '3px solid #39FF14' }} />

        {/* Subtitle */}
        <div style={{ fontSize: '11px', letterSpacing: '3px', color: '#39FF14', marginBottom: '8px' }}>
          ZONE OPERATIVE APPLICATION // PRIPYAT SECTOR
        </div>

        <h1 className="glitch-text" data-text="CHERNOBYL-TRSHNT" style={{
          fontFamily: "'Cinzel', serif",
          fontSize: 'clamp(2.2rem, 7vw, 3.6rem)',
          fontWeight: 700,
          color: '#D9E0E0',
          letterSpacing: '4px',
          margin: '0 0 6px 0',
          textShadow: '0 0 20px rgba(217, 224, 224, 0.4)'
        }}>
          CHERNOBYL-TRSHNT
        </h1>

        <div style={{
          fontSize: '13px',
          color: '#9BA8A8',
          letterSpacing: '3px',
          marginBottom: '24px',
          fontFamily: "'Share Tech Mono', monospace"
        }}>
          TACTICAL PWA MOBILE TERMINAL INTERFACE
        </div>

        <p style={{
          fontSize: '14px',
          color: '#c5d0d0',
          lineHeight: '1.7',
          maxWidth: '520px',
          margin: '0 auto 28px auto',
          fontFamily: "'Inter', sans-serif"
        }}>
          Official Progressive Web Application (PWA) for dedicated mobile terminals. Download and install onto your Android or iOS device to launch the application and enter the exclusion zone.
        </p>

        {/* Big Download PWA Button */}
        <div style={{ marginBottom: '16px' }}>
          <button
            onClick={handleDownloadClick}
            disabled={isInstalling}
            style={{
              width: '100%',
              maxWidth: '500px',
              padding: '20px 24px',
              background: 'linear-gradient(135deg, #39FF14 0%, #004d40 100%)',
              border: '2px solid #39FF14',
              color: '#002729',
              fontFamily: "'Share Tech Mono', monospace",
              fontSize: '18px',
              fontWeight: 'bold',
              letterSpacing: '2px',
              cursor: isInstalling ? 'wait' : 'pointer',
              textTransform: 'uppercase',
              boxShadow: '0 0 30px rgba(57, 255, 20, 0.5)',
              transition: 'all 0.3s ease',
              display: 'inline-flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              borderRadius: '3px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.02)';
              e.currentTarget.style.boxShadow = '0 0 40px rgba(57, 255, 20, 0.8)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = '0 0 30px rgba(57, 255, 20, 0.5)';
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Download size={24} style={{ animation: 'bounce 1.5s infinite' }} />
              <span>⚡ DOWNLOAD &amp; INSTALL PWA APP</span>
            </div>
            <span style={{ fontSize: '10px', opacity: 0.95, letterSpacing: '1.5px', textTransform: 'uppercase' }}>
              [ AUTOMATIC INSTALLATION FOR ANDROID &amp; IOS ]
            </span>
          </button>

          {installStatus && (
            <div style={{ fontSize: '12px', color: '#39FF14', marginTop: '12px', fontWeight: 'bold' }}>
              {installStatus}
            </div>
          )}
        </div>
      </div>

      {/* iOS & Manual Installation Modal Guide */}
      {showIosGuide && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0, 0, 0, 0.88)',
          backdropFilter: 'blur(10px)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            maxWidth: '480px',
            width: '100%',
            background: '#002729',
            border: '2px solid #39FF14',
            padding: '24px',
            position: 'relative',
            boxShadow: '0 0 35px rgba(57, 255, 20, 0.4)',
            borderRadius: '4px'
          }}>
            <div style={{ fontSize: '16px', color: '#39FF14', fontWeight: 'bold', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Smartphone size={20} /> PWA INSTALLATION GUIDE ({isIos ? 'IOS' : 'ANDROID'})
            </div>
            
            <p style={{ fontSize: '13px', color: '#D9E0E0', lineHeight: '1.6', marginBottom: '16px' }}>
              To install <strong>Chernobyl-trshnt</strong> app directly on your home screen:
            </p>

            <ol style={{ fontSize: '13px', color: '#9BA8A8', paddingLeft: '20px', lineHeight: '1.8', marginBottom: '20px' }}>
              {isIos ? (
                <>
                  <li>Tap the <strong>Share button</strong> (square with arrow) at the bottom or top of Safari.</li>
                  <li>Scroll down and select <strong>"Add to Home Screen"</strong> (＋).</li>
                  <li>Tap <strong>Add</strong> in top right corner.</li>
                  <li>Launch <strong>Chernobyl-trshnt</strong> directly from your home screen!</li>
                </>
              ) : (
                <>
                  <li>Tap the <strong>three dots (⋮)</strong> menu in Chrome.</li>
                  <li>Select <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.</li>
                  <li>Confirm installation.</li>
                  <li>Open the app from your home screen!</li>
                </>
              )}
            </ol>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => {
                  setShowIosGuide(false);
                  localStorage.setItem('chernobyl_pwa_installed', 'true');
                  window.location.hash = '#home';
                }}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: '#39FF14',
                  border: 'none',
                  color: '#002729',
                  fontWeight: 'bold',
                  fontFamily: "'Share Tech Mono', monospace",
                  cursor: 'pointer',
                  fontSize: '13px',
                  letterSpacing: '1px'
                }}
              >
                OPEN APP HOME PAGE
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
      `}</style>
    </div>
  );
};

export default PwaDownloadLanding;
