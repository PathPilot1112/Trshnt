import React, { useState } from 'react';
import { Download, Smartphone, Globe, Shield, Radio, CheckCircle } from 'lucide-react';
import PwaInstallButton, { usePwaInstall } from '../components/PwaInstallPrompt';
import BackgroundCanvas from '../components/BackgroundCanvas';

const PwaDownloadLanding = ({ onContinueToWeb, onOpenRegister, onOpenAdmin }) => {
  const { isInstalled, isIOS, triggerInstall } = usePwaInstall();
  const [showIosGuide, setShowIosGuide] = useState(false);

  const handleDownloadClick = () => {
    triggerInstall(setShowIosGuide);
  };

  return (
    <div style={{
      position: 'relative',
      minHeight: '100vh',
      width: '100vw',
      background: '#001a1c',
      color: '#e0e0e0',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      boxSizing: 'border-box',
      overflowX: 'hidden',
      fontFamily: "'Share Tech Mono', monospace"
    }}>
      <BackgroundCanvas />
      <div className="noise-overlay" />
      <div className="scanlines" />

      {/* Main Container */}
      <div style={{
        position: 'relative',
        zIndex: 10,
        maxWidth: '680px',
        width: '100%',
        background: 'rgba(3, 14, 18, 0.92)',
        border: '1px solid rgba(57, 255, 20, 0.4)',
        boxShadow: '0 0 40px rgba(57, 255, 20, 0.15)',
        padding: '36px 28px',
        textAlign: 'center',
        borderRadius: '8px'
      }}>
        {/* Top Header Logos */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
          <img 
            src="/logo1.png" 
            alt="Fundaz Logo" 
            style={{ height: '42px', width: '42px', objectFit: 'contain', borderRadius: '50%', background: '#fff', padding: '2px' }} 
          />
          <img 
            src="/aaruush_logo_clean.png" 
            alt="Aaruush '26 Logo" 
            style={{ height: '38px', width: 'auto', objectFit: 'contain' }} 
          />
        </div>

        <div style={{ fontSize: '11px', letterSpacing: '3px', color: '#39FF14', marginBottom: '8px', fontWeight: 'bold' }}>
          ZONE OPERATIVE TERMINAL // PRIPYAT SECTOR
        </div>

        <h1 className="glitch-text" data-text="THE PRIPYAT EXODUS" style={{
          fontFamily: "'Times New Roman', serif",
          fontSize: 'clamp(2rem, 5vw, 3rem)',
          fontWeight: 900,
          color: '#fff',
          letterSpacing: '3px',
          margin: '0 0 10px 0',
          textTransform: 'uppercase'
        }}>
          THE PRIPYAT EXODUS
        </h1>

        <div style={{
          fontSize: '12px',
          color: 'rgba(0, 240, 255, 0.8)',
          letterSpacing: '2px',
          marginBottom: '20px'
        }}>
          TACTICAL PWA MOBILE APPLICATION REQUIRED
        </div>

        {/* Info Banner */}
        <div style={{
          background: 'rgba(57, 255, 20, 0.05)',
          border: '1px dashed rgba(57, 255, 20, 0.3)',
          borderLeft: '4px solid #39FF14',
          padding: '14px 18px',
          marginBottom: '28px',
          textAlign: 'left',
          fontSize: '13px',
          color: '#cbd5e1',
          lineHeight: '1.6'
        }}>
          <strong style={{ color: '#39FF14' }}>[NOTICE]:</strong> For live camera AR scanning, real-time GPS telemetry, and full offline caching, please <strong>Download &amp; Install</strong> the official App to your device's home screen.
        </div>

        {/* Big Download Button */}
        <div style={{ marginBottom: '28px' }}>
          <button
            onClick={handleDownloadClick}
            style={{
              width: '100%',
              maxWidth: '480px',
              padding: '18px 24px',
              background: 'linear-gradient(135deg, #39FF14 0%, #005c4b 100%)',
              border: '2px solid #39FF14',
              color: '#002729',
              fontFamily: "'Share Tech Mono', monospace",
              fontSize: '17px',
              fontWeight: 'bold',
              letterSpacing: '2px',
              cursor: 'pointer',
              textTransform: 'uppercase',
              boxShadow: '0 0 25px rgba(57, 255, 20, 0.35)',
              transition: 'all 0.3s ease',
              display: 'inline-flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              borderRadius: '6px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.02)';
              e.currentTarget.style.boxShadow = '0 0 35px rgba(57, 255, 20, 0.6)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = '0 0 25px rgba(57, 255, 20, 0.35)';
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Download size={22} />
              <span>⚡ DOWNLOAD &amp; INSTALL APP</span>
            </div>
            <span style={{ fontSize: '10px', opacity: 0.9, letterSpacing: '1px' }}>
              [ AUTOMATIC PWA INSTALL FOR ANDROID &amp; IOS ]
            </span>
          </button>
        </div>

        {/* Feature Highlights */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '12px',
          marginBottom: '28px',
          textAlign: 'left'
        }}>
          <div style={{ background: 'rgba(0, 0, 0, 0.4)', padding: '12px', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '4px' }}>
            <div style={{ fontSize: '11px', color: '#39FF14', fontWeight: 'bold' }}>📸 HIGH-SPEED SCANNER</div>
            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.6)', marginTop: '4px' }}>Hardware accelerated optical verification</div>
          </div>
          <div style={{ background: 'rgba(0, 0, 0, 0.4)', padding: '12px', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '4px' }}>
            <div style={{ fontSize: '11px', color: '#39FF14', fontWeight: 'bold' }}>🛰️ LIVE GPS TELEMETRY</div>
            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.6)', marginTop: '4px' }}>Precision campus geofence mapping</div>
          </div>
          <div style={{ background: 'rgba(0, 0, 0, 0.4)', padding: '12px', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '4px' }}>
            <div style={{ fontSize: '11px', color: '#39FF14', fontWeight: 'bold' }}>⚡ INSTANT LAUNCH</div>
            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.6)', marginTop: '4px' }}>Zero-delay launch directly from home screen</div>
          </div>
        </div>

        {/* Secondary Navigation Options */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '12px',
          flexWrap: 'wrap',
          borderTop: '1px solid rgba(155, 168, 168, 0.15)',
          paddingTop: '20px'
        }}>
          {onOpenRegister && (
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
                borderRadius: '4px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Shield size={14} /> Register Team
            </button>
          )}

          {onContinueToWeb && (
            <button
              onClick={onContinueToWeb}
              style={{
                padding: '10px 18px',
                background: 'rgba(0, 0, 0, 0.4)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: '#D9E0E0',
                fontFamily: "'Share Tech Mono', monospace",
                fontSize: '12px',
                cursor: 'pointer',
                borderRadius: '4px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Globe size={14} /> Continue to Web Portal
            </button>
          )}

          {onOpenAdmin && (
            <button
              onClick={onOpenAdmin}
              style={{
                padding: '10px 18px',
                background: 'rgba(0, 240, 255, 0.08)',
                border: '1px solid rgba(0, 240, 255, 0.3)',
                color: '#00e5ff',
                fontFamily: "'Share Tech Mono', monospace",
                fontSize: '12px',
                cursor: 'pointer',
                borderRadius: '4px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Radio size={14} /> Admin Access
            </button>
          )}
        </div>
      </div>

      {/* iOS Installation Guide Modal */}
      {showIosGuide && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 15, 18, 0.88)',
          backdropFilter: 'blur(8px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            maxWidth: '460px',
            width: '100%',
            background: '#002729',
            border: '2px solid #39FF14',
            borderRadius: '6px',
            padding: '24px',
            boxShadow: '0 0 30px rgba(57, 255, 20, 0.3)'
          }}>
            <div style={{ fontSize: '15px', color: '#39FF14', fontWeight: 'bold', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Smartphone size={20} /> PWA INSTALLATION INSTRUCTIONS
            </div>

            <p style={{ fontSize: '13px', color: '#D9E0E0', lineHeight: '1.6', marginBottom: '16px' }}>
              To install <strong>The Pripyat Exodus</strong> app directly on your device:
            </p>

            <ol style={{ fontSize: '12px', color: '#9BA8A8', paddingLeft: '20px', lineHeight: '1.8', marginBottom: '20px' }}>
              <li>Tap the <strong>Share / Menu button</strong> in Safari or Chrome.</li>
              <li>Scroll down and select <strong>"Add to Home Screen"</strong> (＋).</li>
              <li>Tap <strong>Add / Install</strong>.</li>
              <li>Launch <strong>The Pripyat Exodus</strong> directly from your home screen!</li>
            </ol>

            <button
              onClick={() => {
                setShowIosGuide(false);
                if (onContinueToWeb) onContinueToWeb();
              }}
              style={{
                width: '100%',
                padding: '12px',
                background: '#39FF14',
                border: 'none',
                color: '#002729',
                fontWeight: 'bold',
                fontFamily: "'Share Tech Mono', monospace",
                cursor: 'pointer',
                borderRadius: '4px'
              }}
            >
              GOT IT // LAUNCH PORTAL
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PwaDownloadLanding;
