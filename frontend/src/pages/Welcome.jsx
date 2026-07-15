import React, { useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';
import { Camera, Key, Radio, Upload, UserPlus, Wifi, X } from 'lucide-react';

const Welcome = ({ onLogin, onQrLogin }) => {
  const [operatorHash, setOperatorHash] = useState('');
  const [scanOpen, setScanOpen] = useState(false);
  const [scanMessage, setScanMessage] = useState('');
  const [scanError, setScanError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const frameRef = useRef(null);
  const processingRef = useRef(false);

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

  const handleLogin = () => {
    const hash = operatorHash.trim() || 'STALKER_01';
    onLogin(hash);
  };

  const handleNewUnit = () => {
    const randomHash = `STALKER_${Math.floor(1000 + Math.random() * 9000)}`;
    setOperatorHash(randomHash);
  };

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
    <div className="welcome-page">
      <div className="stalker-header">
        <div className="net-info">
          <div className="net-name">STALKER_NET_v2.1</div>
        </div>
        <div className="header-icons">
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px' }}>
            <Wifi size={12} className="glow-text" />
            <span className="glow-text">UPLINK: ACTIVE</span>
          </div>
        </div>
      </div>

      <div className="access-protocol glow-text">ZONE_ACCESS_PROTOCOL</div>

      <div className="welcome-title-container">
        <div className="welcome-title glitch-text" data-text="WELCOME TO THE ZONE">
          WELCOME TO THE ZONE
        </div>
        <div className="welcome-subtitle">&gt; Initialize connection to Pripyat-Central</div>
      </div>

      <div className="qr-section">
        <div className="qr-corners"></div>
        <div className="qr-container">
          <div className="qr-radar-line"></div>
          <svg viewBox="0 0 100 100" className="qr-placeholder-svg">
            <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="0.5" strokeDasharray="3, 3" />
            <circle cx="50" cy="50" r="30" fill="none" stroke="currentColor" strokeWidth="0.5" />
            <line x1="50" y1="5" x2="50" y2="95" stroke="currentColor" strokeWidth="0.25" />
            <line x1="5" y1="50" x2="95" y2="50" stroke="currentColor" strokeWidth="0.25" />
          </svg>
        </div>

        <button className="cyber-btn striped qr-btn" onClick={openScanner}>
          <Radio size={16} /> Scan QR to Begin Mission
        </button>
      </div>

      <div className="id-prompt-box">
        <label className="id-prompt-label">ID_PROMPT: TEAM IDENTIFICATION UNIT</label>
        <div className="id-input-wrapper">
          <input
            type="text"
            className="id-input"
            placeholder="ENTER_OPERATOR_HASH..."
            value={operatorHash}
            onChange={(e) => setOperatorHash(e.target.value)}
          />
        </div>
      </div>

      <div className="welcome-actions">
        <button className="cyber-btn" onClick={handleLogin} style={{ color: 'var(--bg-darkest)' }}>
          <Key size={14} /> LOGIN
        </button>
        <button className="cyber-btn-outline" onClick={handleNewUnit}>
          <UserPlus size={14} /> NEW UNIT
        </button>
      </div>

      <div className="welcome-footer-info">
        <div className="welcome-footer-row">
          <span>RAD_LEVEL: 0.15mSv/h (STABLE)</span>
          <span>SECTOR: PRIPYAT_SUB_EXT_04</span>
        </div>
        <div className="welcome-footer-row" style={{ color: 'rgba(0, 240, 255, 0.25)' }}>
          <span>SERIAL: COBALT_VOID_V2.1</span>
          <span>BUILD: 2024.11.08.VOID</span>
        </div>
      </div>

      {scanOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.85)',
            zIndex: 200,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '420px',
              background: '#020b0d',
              border: '1px solid var(--cyan-primary)',
              padding: '16px',
              position: 'relative',
            }}
          >
            <button
              onClick={closeScanner}
              style={{ position: 'absolute', right: '10px', top: '10px', background: 'transparent', border: 0, color: '#fff', cursor: 'pointer' }}
            >
              <X size={18} />
            </button>

            <div className="clue-header" style={{ marginBottom: '12px' }}>TEAM_QR_SCANNER</div>

            <div
              style={{
                height: '260px',
                border: '1px solid rgba(0,240,255,0.25)',
                background: '#010608',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
              }}
            >
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: isProcessing ? 0.45 : 0.9 }}
              />
            </div>

            <canvas ref={canvasRef} style={{ display: 'none' }} />

            <div style={{ marginTop: '12px', fontSize: '11px', color: 'var(--cyan-primary)', minHeight: '18px' }}>
              {scanMessage}
            </div>
            {scanError && (
              <div style={{ marginTop: '8px', fontSize: '11px', color: 'var(--amber-primary)' }}>{scanError}</div>
            )}

            <label className="cyber-btn-outline" style={{ width: '100%', marginTop: '14px', display: 'flex', justifyContent: 'center', cursor: 'pointer' }}>
              <Upload size={14} /> Scan from Local File
              <input type="file" accept="image/*" onChange={handleFileUpload} style={{ display: 'none' }} />
            </label>
          </div>
        </div>
      )}
    </div>
  );
};

export default Welcome;
