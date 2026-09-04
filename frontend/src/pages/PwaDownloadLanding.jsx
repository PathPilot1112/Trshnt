import React, { useState, useEffect } from 'react';
import { Download, Smartphone, Share, PlusSquare, CheckCircle, ArrowRight } from 'lucide-react';
import BackgroundCanvas from '../components/BackgroundCanvas';

const PwaDownloadLanding = ({ onOpenRegister, onOpenLogin }) => {
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
      window.navigator.standalone === true ||
      document.referrer.includes('android-app://')
    );
    setIsStandalone(standaloneMode);

    const syncPrompt = () => setDeferredPrompt(window.__pwaInstallPrompt || null);
    window.addEventListener('pwa-install-ready', syncPrompt);
    window.addEventListener('beforeinstallprompt', syncPrompt);
    window.addEventListener('appinstalled', () => {
      setInstallStatus('App Installed Successfully! Open Chernobyl from your home screen.');
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
          setInstallStatus('App Installed! Launch from home screen.');
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
      background: 'var(--color-bg)',
      color: '#fff',
      fontFamily: 'var(--font-sans)',
      overflowY: 'auto'
    }}>
      <BackgroundCanvas />
      <div className="noise-overlay" />

      {/* Main Glassmorphic Card (Apple HIG Aesthetics) */}
      <div style={{
        position: 'relative',
        zIndex: 10,
        width: '100%',
        maxWidth: '440px',
        background: 'rgba(12, 22, 24, 0.85)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        border: '1px solid rgba(57, 255, 20, 0.3)',
        borderRadius: '24px',
        padding: '36px 28px',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8), 0 0 30px rgba(57, 255, 20, 0.12)',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '16px'
      }}>
        {/* App Icon / Badge */}
        <div style={{
          width: '72px',
          height: '72px',
          borderRadius: '18px',
          background: 'linear-gradient(135deg, #0a292d 0%, #001214 100%)',
          border: '1.5px solid var(--color-neon-green)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 20px var(--color-green-glow)',
          fontSize: '28px',
          fontWeight: 'bold',
          color: 'var(--color-neon-green)'
        }}>
          ☢
        </div>

        <div style={{ fontSize: '11px', letterSpacing: '3px', color: 'var(--color-neon-green)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>
          Tactical PWA Installation
        </div>

        <h1 style={{
          fontSize: '28px',
          fontWeight: '700',
          color: '#ffffff',
          letterSpacing: '0.5px',
          margin: 0,
          fontFamily: 'var(--font-sans)'
        }}>
          Chernobyl-trshnt
        </h1>

        <p style={{
          fontSize: '14px',
          lineHeight: '1.6',
          color: 'rgba(217, 224, 224, 0.82)',
          margin: 0,
          maxWidth: '360px'
        }}>
          {isIos
            ? 'Install directly on your iPhone for offline access and full camera tactical scan features.'
            : 'Download and install directly to your home screen in 1 click for real-time mission updates.'}
        </p>

        {/* Primary Action Button */}
        <button
          onClick={handleDownloadClick}
          disabled={isInstalling}
          style={{
            width: '100%',
            padding: '16px',
            marginTop: '8px',
            background: 'var(--color-neon-green)',
            color: '#040d0e',
            border: 'none',
            borderRadius: '14px',
            fontSize: '15px',
            fontWeight: '700',
            fontFamily: 'var(--font-sans)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            boxShadow: '0 0 24px var(--color-green-glow), 0 4px 12px rgba(0,0,0,0.4)',
            transition: 'all 0.2s ease'
          }}
        >
          <Download size={20} />
          {isInstalling ? 'Installing PWA…' : isIos ? 'Install on iPhone' : '1-Click Install App'}
        </button>

        {installStatus && (
          <div style={{
            fontSize: '13px',
            color: 'var(--color-neon-green)',
            background: 'rgba(57, 255, 20, 0.1)',
            border: '1px solid rgba(57, 255, 20, 0.3)',
            borderRadius: '10px',
            padding: '8px 12px',
            width: '100%'
          }}>
            <CheckCircle size={14} style={{ display: 'inline', marginRight: '6px' }} />
            {installStatus}
          </div>
        )}

        {/* Secondary navigation to Web App */}
        <div style={{ marginTop: '12px', display: 'flex', gap: '16px', fontSize: '13px' }}>
          <button
            onClick={() => window.location.hash = '#home'}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--color-accent)',
              cursor: 'pointer',
              textDecoration: 'underline',
              fontFamily: 'var(--font-sans)'
            }}
          >
            Continue in Browser <ArrowRight size={12} style={{ display: 'inline' }} />
          </button>
        </div>
      </div>

      {/* iPhone Apple HIG Installation Guide Modal */}
      {showGuide && (
        <div
          onClick={() => setShowGuide(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.85)',
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
              maxWidth: '380px',
              background: '#0d181a',
              border: '1px solid var(--color-neon-green)',
              borderRadius: '20px',
              padding: '28px 24px',
              boxShadow: '0 0 35px var(--color-green-glow)',
              textAlign: 'left'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '18px', fontWeight: '700', color: '#fff', marginBottom: '16px' }}>
              <Smartphone size={22} color="var(--color-neon-green)" />
              {isIos ? 'Install on iPhone' : 'Install on Android'}
            </div>

            {isIos ? (
              <ol style={{ paddingLeft: '20px', margin: 0, lineHeight: '1.8', fontSize: '14px', color: 'rgba(217, 224, 224, 0.9)' }}>
                <li>Tap the <strong>Share</strong> button in Safari <Share size={14} style={{ display: 'inline', verticalAlign: 'middle' }} />.</li>
                <li>Scroll down and select <strong>Add to Home Screen</strong> <PlusSquare size={14} style={{ display: 'inline', verticalAlign: 'middle' }} />.</li>
                <li>Tap <strong>Add</strong> at top right, then launch <strong>Chernobyl</strong> from your Home Screen.</li>
              </ol>
            ) : (
              <ol style={{ paddingLeft: '20px', margin: 0, lineHeight: '1.8', fontSize: '14px', color: 'rgba(217, 224, 224, 0.9)' }}>
                <li>Tap the browser options menu (<strong>⋮</strong>).</li>
                <li>Select <strong>Install app</strong> or <strong>Add to Home screen</strong>.</li>
                <li>Confirm, then launch Chernobyl from your apps grid.</li>
              </ol>
            )}

            <button
              onClick={() => setShowGuide(false)}
              style={{
                width: '100%',
                marginTop: '24px',
                padding: '12px',
                background: 'var(--color-neon-green)',
                color: '#000',
                border: 'none',
                borderRadius: '12px',
                fontWeight: '700',
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PwaDownloadLanding;

