import React, { useState, useEffect } from 'react';
import { Download, Shield, Smartphone, Globe, ArrowRight, CheckCircle2, QrCode, AlertTriangle, Radio } from 'lucide-react';
import BackgroundCanvas from '../components/BackgroundCanvas';

const PwaDownloadLanding = ({ onContinueToWeb, onOpenRegister, onOpenLogin }) => {
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

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
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
          setInstallStatus('PWA installed successfully! Launching app...');
          setTimeout(() => {
            onContinueToWeb();
          }, 1500);
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
      // Fallback for browsers where beforeinstallprompt didn't fire or standard A2HS
      setShowIosGuide(true);
      setIsInstalling(false);
    }
  };

  return (
    <div style={{
      position: 'relative',
      minHeight: '100vh',
      width: '100vw',
      background: 'var(--color-bg, #002729)',
      color: 'var(--color-text, #D9E0E0)',
      fontFamily: " 'Share Tech Mono', 'Inter', monospace",
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      overflowX: 'hidden',
      padding: '20px 16px',
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
        padding: '12px 24px',
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
        maxWidth: '680px',
        width: '100%',
        background: 'rgba(0, 39, 41, 0.85)',
        backdropFilter: 'blur(12px)',
        border: '2px solid rgba(155, 168, 168, 0.3)',
        boxShadow: '0 0 40px rgba(0, 0, 0, 0.8), 0 0 20px rgba(57, 255, 20, 0.1)',
        padding: '36px 28px',
        textAlign: 'center',
        margin: '60px auto 20px auto',
      }}>
        {/* Corner Brackets */}
        <div style={{ position: 'absolute', top: 0, left: 0, width: '16px', height: '16px', borderTop: '3px solid #39FF14', borderLeft: '3px solid #39FF14' }} />
        <div style={{ position: 'absolute', top: 0, right: 0, width: '16px', height: '16px', borderTop: '3px solid #39FF14', borderRight: '3px solid #39FF14' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, width: '16px', height: '16px', borderBottom: '3px solid #39FF14', borderLeft: '3px solid #39FF14' }} />
        <div style={{ position: 'absolute', bottom: 0, right: 0, width: '16px', height: '16px', borderBottom: '3px solid #39FF14', borderRight: '3px solid #39FF14' }} />

        {/* Title */}
        <div style={{ fontSize: '11px', letterSpacing: '3px', color: '#39FF14', marginBottom: '8px' }}>
          ZONE OPERATIVE APPLICATION // PRIPYAT SECTOR
        </div>

        <h1 className="glitch-text" data-text="CHERNOBYL-TRSHNT" style={{
          fontFamily: "'Cinzel', serif",
          fontSize: 'clamp(2rem, 6vw, 3.4rem)',
          fontWeight: 700,
          color: '#D9E0E0',
          letterSpacing: '4px',
          margin: '0 0 6px 0',
          textShadow: '0 0 15px rgba(217, 224, 224, 0.4)'
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
          maxWidth: '540px',
          margin: '0 auto 28px auto',
          fontFamily: "'Inter', sans-serif"
        }}>
          Official Progressive Web Application (PWA) for dedicated field terminals. Download and install directly onto your device for live camera scanning, real-time location telemetry, and mission operations.
        </p>

        {/* Big Download PWA Button */}
        <div style={{ marginBottom: '24px' }}>
          <button
            onClick={handleDownloadClick}
            disabled={isInstalling}
            style={{
              width: '100%',
              maxWidth: '520px',
              padding: '18px 24px',
              background: 'linear-gradient(135deg, #39FF14 0%, #004d40 100%)',
              border: '2px solid #39FF14',
              color: '#002729',
              fontFamily: "'Share Tech Mono', monospace",
              fontSize: '17px',
              fontWeight: 'bold',
              letterSpacing: '2px',
              cursor: isInstalling ? 'wait' : 'pointer',
              textTransform: 'uppercase',
              boxShadow: '0 0 25px rgba(57, 255, 20, 0.4)',
              transition: 'all 0.3s ease',
              display: 'inline-flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              borderRadius: '2px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.02)';
              e.currentTarget.style.boxShadow = '0 0 35px rgba(57, 255, 20, 0.7)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = '0 0 25px rgba(57, 255, 20, 0.4)';
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Download size={22} style={{ animation: 'bounce 1.5s infinite' }} />
              <span>⚡ DOWNLOAD &amp; INSTALL PWA APP</span>
            </div>
            <span style={{ fontSize: '10px', opacity: 0.9, letterSpacing: '1px', textTransform: 'uppercase' }}>
              [ AUTOMATIC INSTALLATION FOR ANDROID &amp; IOS ]
            </span>
          </button>

          {installStatus && (
            <div style={{ fontSize: '12px', color: '#39FF14', marginTop: '10px' }}>
              {installStatus}
            </div>
          )}
        </div>

        {/* Secondary Options */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '12px',
          flexWrap: 'wrap',
          borderTop: '1px solid rgba(155, 168, 168, 0.2)',
          paddingTop: '20px'
        }}>
          <button
            onClick={onContinueToWeb}
            style={{
              padding: '10px 18px',
              background: 'rgba(0, 0, 0, 0.4)',
              border: '1px solid #9BA8A8',
              color: '#D9E0E0',
              fontFamily: "'Share Tech Mono', monospace",
              fontSize: '12px',
              cursor: 'pointer',
              letterSpacing: '1px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#39FF14';
              e.currentTarget.style.color = '#39FF14';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#9BA8A8';
              e.currentTarget.style.color = '#D9E0E0';
            }}
          >
            <Globe size={14} /> Continue to Home Landing Page
          </button>

          <button
            onClick={onOpenRegister}
            style={{
              padding: '10px 18px',
              background: 'rgba(57, 255, 20, 0.1)',
              border: '1px solid rgba(57, 255, 20, 0.4)',
              color: '#39FF14',
              fontFamily: "'Share Tech Mono', monospace",
              fontSize: '12px',
              cursor: 'pointer',
              letterSpacing: '1px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s ease'
            }}
          >
            <Shield size={14} /> Register Team
          </button>
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
          background: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(8px)',
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
            boxShadow: '0 0 30px rgba(57, 255, 20, 0.3)'
          }}>
            <div style={{ fontSize: '16px', color: '#39FF14', fontWeight: 'bold', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Smartphone size={20} /> PWA INSTALLATION INSTRUCTIONS
            </div>
            
            <p style={{ fontSize: '13px', color: '#D9E0E0', lineHeight: '1.6', marginBottom: '16px' }}>
              To install <strong>Chernobyl-trshnt</strong> directly on your home screen:
            </p>

            <ol style={{ fontSize: '13px', color: '#9BA8A8', paddingLeft: '20px', lineHeight: '1.8', marginBottom: '20px' }}>
              <li>Tap the <strong>Share button</strong> in Safari / browser navigation bar (bottom or top).</li>
              <li>Scroll down and select <strong>"Add to Home Screen"</strong> (＋).</li>
              <li>Tap <strong>Add</strong> in the top right corner.</li>
              <li>Launch <strong>Chernobyl-trshnt</strong> directly from your home screen!</li>
            </ol>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => { setShowIosGuide(false); onContinueToWeb(); }}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: '#39FF14',
                  border: 'none',
                  color: '#002729',
                  fontWeight: 'bold',
                  fontFamily: "'Share Tech Mono', monospace",
                  cursor: 'pointer'
                }}
              >
                GOT IT // LAUNCH WEB PORTAL
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
