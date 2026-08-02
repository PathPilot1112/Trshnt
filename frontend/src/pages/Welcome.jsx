import React, { useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';
import QRCode from 'react-qr-code';
import { Camera, Download, Key, Radio, Upload, UserPlus, Wifi, X } from 'lucide-react';
import RadiationSymbol from '../components/RadiationSymbol';

const Welcome = ({ onQrLogin }) => {
  const [scanOpen, setScanOpen] = useState(false);
  const [scanMessage, setScanMessage] = useState('');
  const [scanError, setScanError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [typedText, setTypedText] = useState('');

  // PWA states
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  // Listen for beforeinstallprompt event
  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      const dismissed = localStorage.getItem('stalker_pwa_dismissed') === 'true';
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
      if (!dismissed && !isStandalone) {
        setShowInstallBanner(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Dynamic banner fallback after 3 seconds if not standalone and not dismissed
    const fallbackTimer = setTimeout(() => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
      const dismissed = localStorage.getItem('stalker_pwa_dismissed') === 'true';
      if (!isStandalone && !dismissed && !deferredPrompt) {
        setShowInstallBanner(true);
      }
    }, 3000);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      clearTimeout(fallbackTimer);
    };
  }, [deferredPrompt]);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`PWA installation outcome: ${outcome}`);
      setDeferredPrompt(null);
      setShowInstallBanner(false);
    } else {
      setShowInstructions(true);
    }
  };

  const handleDismissInstall = () => {
    localStorage.setItem('stalker_pwa_dismissed', 'true');
    setShowInstallBanner(false);
  };

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const frameRef = useRef(null);
  const processingRef = useRef(false);

  // Typewriter effect
  useEffect(() => {
    const fullText = '> Initialize connection to Pripyat-Central...';
    let i = 0;
    const interval = setInterval(() => {
      setTypedText(fullText.slice(0, i + 1));
      i++;
      if (i >= fullText.length) clearInterval(interval);
    }, 55);
    return () => clearInterval(interval);
  }, []);

  const stopScanner = () => {
    if (frameRef.current) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  useEffect(() => stopScanner, []);

  const finalizeQrLogin = async (qrText) => {
    if (processingRef.current) return;
    processingRef.current = true;
    setIsProcessing(true);
    setScanError('');
    setScanMessage('QR detected. Resolving team access...');

    try {
      stopScanner();
      await onQrLogin(qrText);
      setScanOpen(false);
    } catch (err) {
      setScanError(err.message || 'QR login failed');
      setScanMessage('');
      processingRef.current = false;
      setIsProcessing(false);
    }
  };

  const scanImageData = async (imageData) => {
    const result = jsQR(imageData.data, imageData.width, imageData.height);
    if (result?.data) {
      await finalizeQrLogin(result.data);
      return true;
    }
    return false;
  };

  const tickScanner = async () => {
    if (!videoRef.current || !canvasRef.current || processingRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const found = await scanImageData(imageData);
      if (found) return;
    }
    frameRef.current = requestAnimationFrame(tickScanner);
  };

  const openScanner = async () => {
    setScanOpen(true);
    setScanError('');
    setScanMessage('Requesting rear camera access...');
    processingRef.current = false;
    setIsProcessing(false);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      });
      streamRef.current = stream;
      setScanMessage('Camera active. Point at the team QR.');
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      frameRef.current = requestAnimationFrame(tickScanner);
    } catch (err) {
      setScanError('Camera access failed. You can still scan from a local image file.');
      setScanMessage('');
    }
  };

  const closeScanner = () => {
    stopScanner();
    processingRef.current = false;
    setIsProcessing(false);
    setScanMessage('');
    setScanError('');
    setScanOpen(false);
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setScanError('');
    setScanMessage('Scanning uploaded image...');
    const image = new Image();
    image.onload = async () => {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      canvas.width = image.width;
      canvas.height = image.height;
      ctx.drawImage(image, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const found = await scanImageData(imageData);
      if (!found) {
        setScanError('No readable QR code found in that file.');
        setScanMessage('');
      }
    };
    image.onerror = () => {
      setScanError('Failed to read the selected file.');
      setScanMessage('');
    };
    image.src = URL.createObjectURL(file);
  };

  return (
    <div className="welcome-page" style={{ padding: 0 }}>
      {/* === Top Hazard Tape Bar === */}
      <div className="hazard-bar" />

      {/* === PWA Install Notification Banner === */}
      {showInstallBanner && (
        <div className="pwa-notification-banner">
          <div className="pwa-notification-content">
            <div className="pwa-alert-icon">⚠️</div>
            <div className="pwa-notification-text">
              <div className="pwa-notification-title">UPLINK_ALERT // PWA_DOWNLOAD_AVAILABLE</div>
              <div>STALKER_NET Tactical Interface can be downloaded to your terminal for offline mission data access.</div>
            </div>
          </div>
          <div className="pwa-notification-actions">
            <button className="pwa-install-btn" onClick={handleInstallClick}>
              <Download size={11} style={{ marginRight: '4px', verticalAlign: 'middle' }} /> Download
            </button>
            <button className="pwa-dismiss-btn" onClick={handleDismissInstall}>
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* === Top classified header === */}
      <div className="stalker-header">
        <div className="net-info">
          <div className="net-name glitch-text" data-text="STALKER_NET">STALKER_NET</div>
          <div className="operator-info">PRIPYAT EXCLUSION ZONE // DEPT OF BIO-RESEARCH</div>
        </div>
        <div className="header-icons" style={{ gap: '8px' }}>
          <span className="red-stamp-mini">TOP SECRET</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '9px', color: 'var(--color-neon-green)' }}>
            <Wifi size={11} style={{ filter: 'drop-shadow(0 0 4px #39FF14)' }} />
            <span className="glow-text">UPLINK</span>
          </div>
        </div>
      </div>

      <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
        {/* === Classified Banner === */}
        <div className="classified-banner">
          FORM-4B // CLEARANCE OMEGA // CHERNOBYL PROTOCOL ACTIVE
        </div>

        {/* === Title Block with Glitch & Parchment Text === */}
        <div className="welcome-title-container" style={{ margin: '4px 0', textAlign: 'center' }}>
          <div
            className="welcome-title glitch-text"
            data-text="WELCOME TO THE ZONE"
            style={{ fontSize: 'clamp(18px, 5vw, 24px)', color: 'var(--color-text)' }}
          >
            WELCOME TO THE ZONE
          </div>
          <div className="welcome-subtitle" style={{ color: 'var(--color-accent)', fontSize: '10px' }}>
            {typedText}
            <span className="glow-text" style={{ animation: 'cursor-blink 1s step-end infinite' }}>_</span>
          </div>
        </div>

        {/* === CENTER HERO: Interactive Animated Radiation Trefoil Symbol === */}
        <div className="hero-biohazard-wrapper">
          <RadiationSymbol />

          {/* === SCAN QR BUTTON DIRECTLY UNDERNEATH BIOHAZARD SYMBOL === */}
          <button
            className="cyber-btn striped qr-btn"
            onClick={openScanner}
            style={{ width: '100%', maxWidth: '300px', marginTop: '12px', padding: '10px 16px', fontSize: '12px', zIndex: 3 }}
          >
            <Radio size={15} /> Scan QR to Begin Mission
          </button>
        </div>



        {/* === Classified Telemetry Footer (Matching Reference Image Layout) === */}
        <div className="welcome-footer-info" style={{ marginTop: '4px' }}>
          <div className="welcome-footer-row">
            <span>RAD LEVEL: <span className="glow-text">3.6R/hz</span> <span className="redacted" style={{ fontSize: '7px' }}>NOT GREAT</span></span>
            <span>SEC_STATUS: <span style={{ color: 'var(--color-neon-green)', fontWeight: 'bold' }}>ACTIVE</span></span>
          </div>
          <div className="welcome-footer-row" style={{ color: 'rgba(155, 168, 168, 0.5)' }}>
            <span>PRIPYAT_SUB_EXT_04</span>
            <span>BUILD: 2024.11.08.VOID</span>
          </div>
        </div>
      </div>

      {/* === Bottom Hazard Tape Bar === */}
      <div className="hazard-bar" />

      {/* === QR Scanner Modal === */}
      {scanOpen && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.9)',
          zIndex: 200,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '20px',
        }}>
          <div style={{
            width: '100%', maxWidth: '420px',
            background: 'var(--bg-panel-dark)',
            border: '1px solid rgba(57, 255, 20, 0.5)',
            boxShadow: '0 0 30px rgba(57, 255, 20, 0.2)',
            padding: '16px',
            position: 'relative',
          }}>
            {/* Hazard stripe top */}
            <div className="hazard-bar" style={{ margin: '-16px -16px 12px -16px', borderRadius: 0 }} />

            <button
              onClick={closeScanner}
              style={{ position: 'absolute', right: '12px', top: '26px', background: 'transparent', border: 0, color: 'var(--color-accent)', cursor: 'pointer' }}
            >
              <X size={18} />
            </button>

            <div style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '12px',
              letterSpacing: '2px',
              color: 'var(--color-accent)',
              marginBottom: '12px',
              textTransform: 'uppercase',
            }}>
              TEAM_QR_SCANNER // ZONE_AUTH
            </div>

            <div style={{
              height: '240px',
              border: '1px solid rgba(57, 255, 20, 0.25)',
              background: '#010608',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              overflow: 'hidden',
              position: 'relative',
            }}>
              {/* Green laser sweep over camera */}
              <div className="laser-beam" />
              <video
                ref={videoRef}
                autoPlay playsInline muted
                style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: isProcessing ? 0.4 : 0.9 }}
              />
            </div>

            <canvas ref={canvasRef} style={{ display: 'none' }} />

            <div style={{ marginTop: '10px', fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--color-neon-green)', minHeight: '16px' }}>
              {scanMessage}
            </div>
            {scanError && (
              <div style={{ marginTop: '6px', fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--color-amber)' }}>
                {scanError}
              </div>
            )}

            <label className="cyber-btn-outline" style={{ width: '100%', marginTop: '12px', display: 'flex', justifyContent: 'center', cursor: 'pointer', gap: '8px' }}>
              <Upload size={13} /> Scan from Local File
              <input type="file" accept="image/*" onChange={handleFileUpload} style={{ display: 'none' }} />
            </label>
          </div>
        </div>
      )}

      {/* === Manual Install Instructions Modal === */}
      {showInstructions && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.85)',
          zIndex: 300,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '20px',
        }}>
          <div style={{
            width: '100%', maxWidth: '380px',
            background: '#010608',
            border: '1px solid var(--color-amber)',
            boxShadow: '0 0 25px var(--color-amber-glow)',
            padding: '16px',
            position: 'relative',
            color: 'var(--color-text)',
            fontFamily: 'var(--font-mono)'
          }}>
            <div className="hazard-bar" style={{ margin: '-16px -16px 12px -16px', height: '6px', borderRadius: 0, background: 'repeating-linear-gradient(-45deg, #ffb700, #ffb700 10px, #000 10px, #000 20px)' }} />

            <button
              onClick={() => setShowInstructions(false)}
              style={{ position: 'absolute', right: '12px', top: '20px', background: 'transparent', border: 0, color: 'var(--color-amber)', cursor: 'pointer' }}
            >
              <X size={18} />
            </button>

            <div style={{
              fontSize: '12px',
              fontWeight: 'bold',
              color: 'var(--color-amber)',
              marginBottom: '12px',
              textTransform: 'uppercase',
            }}>
              TERMINAL_MANUAL_INSTALL // PROT_OS
            </div>

            <div style={{ fontSize: '10px', lineHeight: '1.5', display: 'flex', flexDirection: 'column', gap: '8px', textAlign: 'left' }}>
              <p>Direct automated downloads are restricted by your browser policies.</p>
              <p><strong>For iOS Safari:</strong></p>
              <ol style={{ paddingLeft: '16px', margin: 0 }}>
                <li>Tap the <strong>Share</strong> button (box with an up arrow) in Safari.</li>
                <li>Scroll down and select <strong>"Add to Home Screen"</strong>.</li>
                <li>Confirm by tapping <strong>"Add"</strong> at the top right.</li>
              </ol>
              <p><strong>For other browsers:</strong></p>
              <ol style={{ paddingLeft: '16px', margin: 0 }}>
                <li>Open the browser settings menu (three dots or lines).</li>
                <li>Select <strong>"Install App"</strong> or <strong>"Add to Home Screen"</strong>.</li>
              </ol>
            </div>

            <button
              onClick={() => setShowInstructions(false)}
              className="cyber-btn striped"
              style={{ width: '100%', marginTop: '16px', borderColor: 'var(--color-amber)', color: 'var(--color-amber)', background: 'transparent' }}
            >
              Acknowledge Protocol
            </button>
          </div>
        </div>
      )}

      {/* Inline styles for PWA banner and animations */}
      <style>{`
        @keyframes cursor-blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }

        .pwa-notification-banner {
          background: rgba(2, 20, 24, 0.95);
          border-bottom: 1.5px solid var(--color-neon-green);
          box-shadow: 0 4px 20px var(--color-green-glow);
          padding: 8px 12px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          animation: slideDown 0.4s cubic-bezier(0.19, 1, 0.22, 1) forwards;
          z-index: 90;
          position: relative;
        }

        @keyframes slideDown {
          from { transform: translateY(-100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        .pwa-notification-content {
          display: flex;
          align-items: center;
          gap: 10px;
          text-align: left;
        }

        .pwa-alert-icon {
          color: var(--color-amber);
          animation: pulse 1s infinite alternate;
          filter: drop-shadow(0 0 4px var(--color-amber-glow));
          font-size: 14px;
        }

        .pwa-notification-text {
          font-family: var(--font-mono);
          font-size: 9px;
          color: var(--color-text);
          line-height: 1.3;
        }

        .pwa-notification-title {
          color: var(--color-neon-green);
          font-weight: bold;
          letter-spacing: 1px;
          margin-bottom: 2px;
          text-shadow: 0 0 5px var(--color-green-glow);
        }

        .pwa-notification-actions {
          display: flex;
          gap: 6px;
          align-items: center;
          flex-shrink: 0;
        }

        .pwa-install-btn {
          background: var(--color-neon-green);
          color: var(--color-bg);
          font-family: var(--font-mono);
          font-size: 9px;
          font-weight: bold;
          padding: 5px 10px;
          border: none;
          cursor: pointer;
          box-shadow: 0 0 8px var(--color-green-glow);
          transition: all 0.2s ease;
          text-transform: uppercase;
        }

        .pwa-install-btn:hover {
          background: #fff;
          box-shadow: 0 0 12px rgba(255, 255, 255, 0.8);
          color: #000;
        }

        .pwa-dismiss-btn {
          background: transparent;
          color: var(--color-accent);
          font-family: var(--font-mono);
          font-size: 9px;
          padding: 4px 8px;
          border: 1px solid rgba(155, 168, 168, 0.3);
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .pwa-dismiss-btn:hover {
          border-color: var(--color-accent);
          color: #fff;
        }

        @keyframes pulse {
          from { opacity: 0.6; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default Welcome;
