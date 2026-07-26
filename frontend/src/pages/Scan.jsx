import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Camera, MapPin, RefreshCw, Send, Upload } from 'lucide-react';
import scannerBg from '../assets/stalker_scan_bg.png';

const Scan = ({ API_BASE, token, onAbort }) => {
  const [logs, setLogs] = useState([
    'SYSTEM INITIALIZATION OK',
    'CAMERA MODULE ONLINE',
    'GPS LINK BOOTSTRAP STARTED',
  ]);
  const [hasCamera, setHasCamera] = useState(false);
  const [isCaptured, setIsCaptured] = useState(false);
  const [capturedBlob, setCapturedBlob] = useState(null);
  const [isFlashing, setIsFlashing] = useState(false);
  const [isTransmitting, setIsTransmitting] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [cameraPermission, setCameraPermission] = useState('pending');
  const [locationPermission, setLocationPermission] = useState('pending');
  const [coords, setCoords] = useState(null);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const watchIdRef = useRef(null);

  const pushLog = (...entries) => setLogs((prev) => [...prev, ...entries]);

  useEffect(() => {
    const startCamera = async () => {
      try {
        const isMobile = window.innerWidth <= 768 || /Mobi|Android|iPhone/i.test(navigator.userAgent);
        if (!isMobile) {
          pushLog(
            '>> DESKTOP SCREEN DETECTED',
            '>> AUTO OPTIC BYPASSED',
            '>> LOAD FILE SUBMISSION OR USE MOCK FEED'
          );
          setHasCamera(false);
          setCameraPermission('dismissed');
          return;
        }

        pushLog('>> REQUESTING CAMERA FEED...');

        const constraints = {
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1280, max: 1920 },
            height: { ideal: 720, max: 1080 }
          },
          audio: false
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        streamRef.current = stream;
        setHasCamera(true);
        setCameraPermission('granted');
        pushLog('>> CAMERA PERMISSION: GRANTED', '>> LIVE OPTIC FEED ONLINE');

        if (videoRef.current) {
          const video = videoRef.current;
          video.srcObject = stream;
          video.setAttribute('playsinline', 'true');
          video.setAttribute('webkit-playsinline', 'true');
          video.setAttribute('autoplay', 'true');
          video.muted = true;
          video.play().then(() => {
            pushLog('>> CAMERA PLAYBACK RUNNING');
          }).catch((playErr) => {
            pushLog(`>> PLAYBACK ERROR: ${playErr.message}`);
          });
        }
      } catch (err) {
        try {
          pushLog('>> CONSTRAINTS FAILED. RETRYING WITH MINIMAL FEED...');
          const fallbackStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
          streamRef.current = fallbackStream;
          setHasCamera(true);
          setCameraPermission('granted');
          pushLog('>> CAMERA PERMISSION: GRANTED (FALLBACK)');
          if (videoRef.current) {
            const video = videoRef.current;
            video.srcObject = fallbackStream;
            video.setAttribute('playsinline', 'true');
            video.setAttribute('webkit-playsinline', 'true');
            video.setAttribute('autoplay', 'true');
            video.muted = true;
            video.play().catch(() => {});
          }
        } catch (fallbackErr) {
          setHasCamera(false);
          setCameraPermission('denied');
          pushLog(
            '>> CAMERA PERMISSION: DENIED',
            `>> ERROR: ${err.message || fallbackErr.message}`,
            '>> FALLING BACK TO STATIC VIEWPORT'
          );
        }
      }
    };

    const startLocation = () => {
      if (!navigator.geolocation) {
        setLocationPermission('unsupported');
        pushLog('>> GPS MODULE: UNSUPPORTED');
        return;
      }

      watchIdRef.current = navigator.geolocation.watchPosition(
        async (position) => {
          const nextCoords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setCoords(nextCoords);
          setLocationPermission('granted');
          pushLog(`>> GPS LOCK: ${nextCoords.lat.toFixed(5)}, ${nextCoords.lng.toFixed(5)}`);
          try {
            await fetch(`${API_BASE}/teams/location`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
              body: JSON.stringify(nextCoords),
            });
          } catch {
            pushLog('>> GPS UPLINK WARNING: LOCATION SYNC FAILED');
          }
        },
        (error) => {
          setLocationPermission('denied');
          pushLog(`>> GPS PERMISSION: DENIED (${error.message})`);
        },
        { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
      );
    };

    startCamera();
    startLocation();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (watchIdRef.current !== null) {
        navigator.geolocation?.clearWatch(watchIdRef.current);
      }
    };
  }, [API_BASE, token]);

  const handleCapture = () => {
    setIsFlashing(true);
    setTimeout(() => setIsFlashing(false), 250);

    if (hasCamera && videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        if (!blob) return;
        setCapturedBlob(blob);
        setIsCaptured(true);
        pushLog(
          '>> IMAGE FRAME FROZEN',
          `>> DATA SIZE: ${Math.round(blob.size / 1024)} KB`,
          '>> SCAN READY FOR TRANSMISSION'
        );
      }, 'image/jpeg', 0.9);
      return;
    }

    fetch(scannerBg)
      .then((res) => res.blob())
      .then((blob) => {
        setCapturedBlob(blob);
        setIsCaptured(true);
        pushLog('>> SIMULATED CAPTURE STORED', '>> SCAN READY FOR TRANSMISSION');
      });
  };

  const handleLocalFile = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setCapturedBlob(file);
    setIsCaptured(true);
    setScanResult(null);
    pushLog(`>> LOCAL FILE LOADED: ${file.name}`, '>> SCAN READY FOR TRANSMISSION');
  };

  const handleRecapture = () => {
    setIsCaptured(false);
    setCapturedBlob(null);
    setScanResult(null);
    pushLog('>> CAMERA RESET. FEED REACTIVATED.');
  };

  const handleTransmit = async () => {
    if (!capturedBlob) return;
    setIsTransmitting(true);
    pushLog('>> INITIATING ENCRYPTED UPLINK...', '>> SENDING DATA CHUNKS TO COMMAND CORE...');
    try {
      const formData = new FormData();
      formData.append('image', capturedBlob, 'pda_scan.jpg');
      const response = await fetch(`${API_BASE}/clues/submit`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Submission failed');
      setScanResult({
        success: data.isCorrect,
        message: data.message,
        prediction: data.prediction,
        confidence: Math.round((data.confidence || 0) * 100),
      });
      pushLog(
        `>> RESPONSE: ${data.message.toUpperCase()}`,
        `>> PREDICTED LABEL: ${data.prediction || 'UNKNOWN'}`,
        `>> CONFIDENCE: ${Math.round((data.confidence || 0) * 100)}%`
      );
      setShowModal(true);
    } catch (err) {
      pushLog(`>> TRANSMISSION ERROR: ${err.message}`);
      alert(err.message);
    } finally {
      setIsTransmitting(false);
    }
  };

  return (
    <div className="scan-page" style={{ height: '100%', display: 'flex', flexDirection: 'column', width: '100%', overflow: 'hidden' }}>

      {/* ═══════════════ SCAN HEADER ═══════════════ */}
      <div className="scan-header">
        <button className="abort-btn" onClick={onAbort}>
          <ArrowLeft size={11} /> ABORT_SCAN
        </button>
        <div className="scan-status-info">
          <span>CAM: <span style={{ color: cameraPermission === 'granted' ? 'var(--color-neon-green)' : 'var(--color-amber)' }}>
            {cameraPermission.toUpperCase()}
          </span></span>
          <span>GPS: <span style={{ color: locationPermission === 'granted' ? 'var(--color-neon-green)' : 'var(--color-amber)' }}>
            {locationPermission.toUpperCase()}
          </span></span>
        </div>
      </div>

      {/* ═══════════════ VIEWPORT ═══════════════ */}
      <div className="scan-viewport-container">
        {/* Grid overlay */}
        <div className="viewport-grid" />

        {/* Camera feed */}
        <video
          ref={videoRef}
          autoPlay playsInline muted
          style={{
            position: 'absolute', inset: 0,
            width: '100%', height: '100%',
            objectFit: 'cover',
            opacity: isCaptured ? 0.2 : (hasCamera ? 1.0 : 0.0),
            pointerEvents: hasCamera ? 'auto' : 'none',
          }}
        />
        {/* Canvas (captured frame) */}
        <canvas
          ref={canvasRef}
          style={{
            position: 'absolute', inset: 0,
            width: '100%', height: '100%',
            objectFit: 'cover',
            opacity: (isCaptured && hasCamera) ? 1.0 : 0,
            pointerEvents: (isCaptured && hasCamera) ? 'auto' : 'none',
          }}
        />

        {/* Simulated atmospheric bg when no camera */}
        {!hasCamera && <img src={scannerBg} alt="Simulated Viewport" className="camera-feed-bg" />}

        {/* Corner brackets + reticle */}
        <div className="viewport-corners" />
        {!isCaptured && (
          <div className="reticle">
            <div className="reticle-circle" />
          </div>
        )}

        {/* Green laser sweep */}
        {!isCaptured && <div className="laser-beam" />}

        {/* Flash effect */}
        <div className={`screen-flash ${isFlashing ? 'active' : ''}`} />

        {/* Transmitting overlay */}
        {isTransmitting && (
          <div style={{
            position: 'absolute', inset: 0,
            background: 'rgba(0, 20, 22, 0.88)',
            zIndex: 15,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexDirection: 'column', gap: '12px',
          }}>
            <div style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '14px',
              letterSpacing: '3px',
              color: 'var(--color-neon-green)',
              textShadow: '0 0 10px var(--color-green-glow)',
              textTransform: 'uppercase',
            }}>
              TRANSMITTING DATA...
            </div>
            <div className="telemetry-bar-container" style={{ width: '60%' }}>
              <div className="telemetry-bar-fill" style={{ width: '100%', animation: 'radar-sweep 1.5s infinite linear' }} />
            </div>
          </div>
        )}
      </div>

      {/* ═══════════════ CAPTURE CONTROLS ═══════════════ */}
      {!isCaptured ? (
        <div style={{
          padding: '12px 16px',
          display: 'grid',
          gridTemplateColumns: '1fr auto 1fr',
          alignItems: 'center',
          gap: '10px',
          background: 'rgba(0, 20, 22, 0.7)',
          borderTop: '1px solid rgba(57, 255, 20, 0.15)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <label className="cyber-btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', padding: '7px 12px', fontSize: '10px' }}>
              <Upload size={11} /> FILE
              <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleLocalFile} />
            </label>
          </div>

          {/* Capture button — circular neon-green */}
          <div>
            <button
              onClick={handleCapture}
              style={{
                width: '54px', height: '54px',
                borderRadius: '50%',
                border: '3px solid var(--color-neon-green)',
                background: 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 0 16px var(--color-green-glow), 0 0 4px rgba(57,255,20,0.2)',
                padding: 0,
              }}
            >
              <div style={{
                width: '36px', height: '36px',
                borderRadius: '50%',
                background: 'var(--color-neon-green)',
                boxShadow: '0 0 10px var(--color-neon-green)',
              }} />
            </button>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--color-accent)' }}>
            {coords ? `${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}` : 'NO GPS LOCK'}
          </div>
        </div>
      ) : (
        <div style={{
          padding: '12px 16px',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '10px',
          background: 'rgba(0, 20, 22, 0.7)',
          borderTop: '1px solid rgba(57, 255, 20, 0.15)',
        }}>
          <button className="cyber-btn-outline" onClick={handleRecapture} disabled={isTransmitting}>
            <RefreshCw size={11} /> RETAKE
          </button>
          <button className="cyber-btn striped" onClick={handleTransmit} disabled={!capturedBlob || isTransmitting}>
            <Send size={11} /> SUBMIT SCAN
          </button>
        </div>
      )}

      {/* ═══════════════ STATUS INDICATORS ═══════════════ */}
      <div style={{
        padding: '6px 16px',
        background: 'rgba(0, 20, 22, 0.9)',
        borderTop: '1px solid rgba(57, 255, 20, 0.1)',
        display: 'flex',
        justifyContent: 'space-between',
        fontFamily: 'var(--font-mono)',
        fontSize: '9px',
        color: 'rgba(155, 168, 168, 0.6)',
      }}>
        <span>CAM: <span style={{ color: cameraPermission === 'granted' ? 'var(--color-neon-green)' : 'var(--color-amber)' }}>{cameraPermission.toUpperCase()}</span></span>
        <span>GPS: <span style={{ color: locationPermission === 'granted' ? 'var(--color-neon-green)' : 'var(--color-amber)' }}>{locationPermission.toUpperCase()}</span></span>
        <span style={{ color: 'rgba(57, 255, 20, 0.6)' }}>LINK: SECURE</span>
      </div>

      {/* ═══════════════ LOG TICKER ═══════════════ */}
      <div style={{
        padding: '5px 14px',
        background: 'rgba(0, 10, 12, 0.85)',
        borderTop: '1px solid rgba(57, 255, 20, 0.08)',
        fontFamily: 'var(--font-mono)',
        fontSize: '8px',
        textAlign: 'center',
        overflow: 'hidden',
        whiteSpace: 'nowrap',
        textOverflow: 'ellipsis',
        color: 'rgba(57, 255, 20, 0.7)',
        letterSpacing: '1px',
      }}>
        STATUS // {logs[logs.length - 1] || 'SYSTEM ONLINE'}
      </div>

      {/* ═══════════════ RESULT MODAL ═══════════════ */}
      {showModal && scanResult && (
        <div
          onClick={() => setShowModal(false)}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0, 0, 0, 0.9)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 100, padding: '20px',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%', maxWidth: '360px',
              background: 'var(--bg-panel-dark)',
              border: `1px solid ${scanResult.success ? 'var(--color-neon-green)' : 'var(--color-amber)'}`,
              boxShadow: scanResult.success
                ? '0 0 30px rgba(57, 255, 20, 0.35)'
                : '0 0 30px rgba(255, 183, 0, 0.35)',
              padding: '0',
              overflow: 'hidden',
            }}
          >
            {/* Hazard stripe top */}
            <div className="hazard-bar" />

            <div style={{ padding: '20px', textAlign: 'center' }}>
              {/* Result header */}
              <div style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '15px',
                letterSpacing: '3px',
                textTransform: 'uppercase',
                fontWeight: 700,
                marginBottom: '12px',
                color: scanResult.success ? 'var(--color-neon-green)' : 'var(--color-amber)',
                textShadow: scanResult.success
                  ? '0 0 12px var(--color-green-glow)'
                  : '0 0 12px var(--color-amber-glow)',
              }}>
                {scanResult.success ? '✓ OBJECTIVE VERIFIED' : '✗ SUBMISSION REJECTED'}
              </div>

              {/* Message */}
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--color-text)', marginBottom: '8px', lineHeight: 1.5 }}>
                {scanResult.message}
              </div>

              {/* Prediction / confidence */}
              <div style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '10px',
                color: 'var(--color-accent)',
                marginBottom: '18px',
                padding: '8px',
                border: '1px solid rgba(155,168,168,0.2)',
                background: 'rgba(0,39,41,0.5)',
              }}>
                {scanResult.prediction} // <span className={scanResult.success ? 'glow-text' : 'glow-text-amber'}>{scanResult.confidence}% CONFIDENCE</span>
              </div>

              <button className="cyber-btn striped" style={{ width: '100%' }} onClick={onAbort}>
                RETURN TO HUD
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Scan;
