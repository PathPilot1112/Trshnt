import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Camera, MapPin, RefreshCw, Send, Upload } from 'lucide-react';
import scannerBg from '../assets/stalker_scan_bg.png';

const API_BASE = import.meta.env.VITE_API_BASE;

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
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' }, width: 1280, height: 720 },
          audio: false,
        });

        streamRef.current = stream;
        setHasCamera(true);
        setCameraPermission('granted');
        pushLog('>> CAMERA PERMISSION: GRANTED', '>> LIVE OPTIC FEED ONLINE');

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch {
        setHasCamera(false);
        setCameraPermission('denied');
        pushLog('>> CAMERA PERMISSION: DENIED', '>> FALLING BACK TO STATIC VIEWPORT');
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
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
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
    if (!capturedBlob) {
      alert('No image captured yet.');
      return;
    }

    setIsTransmitting(true);
    pushLog('>> INITIATING ENCRYPTED UPLINK...', '>> SENDING DATA CHUNKS TO COMMAND CORE...');

    try {
      const formData = new FormData();
      formData.append('image', capturedBlob, 'pda_scan.jpg');

      const response = await fetch(`${API_BASE}/clues/submit`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
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
    <div className="scan-page">
      <div className="scan-header">
        <button className="abort-btn" onClick={onAbort}>
          <ArrowLeft size={12} /> ABORT_SCAN
        </button>
        <div className="scan-status-info">
          <span>CAM: {cameraPermission.toUpperCase()}</span>
          <span>GPS: {locationPermission.toUpperCase()}</span>
        </div>
      </div>

      <div className="scan-viewport-container">
        {hasCamera ? (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                opacity: isCaptured ? 0.2 : 1.0,
              }}
            />
            <canvas
              ref={canvasRef}
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                opacity: isCaptured ? 1.0 : 0,
              }}
            />
          </>
        ) : (
          <img src={scannerBg} alt="Simulated Viewport" className="camera-feed-bg" />
        )}

        <div className="viewport-corners"></div>
        {!isCaptured && (
          <div className="reticle">
            <div className="reticle-circle"></div>
          </div>
        )}
        <div className={`screen-flash ${isFlashing ? 'active' : ''}`}></div>

        {isTransmitting && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(2, 10, 13, 0.85)',
              zIndex: 15,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--cyan-primary)',
              fontWeight: 'bold',
            }}
          >
            TRANSMITTING DATA...
          </div>
        )}
      </div>

      {/* Main Interactive Controls */}
      {!isCaptured ? (
        <div style={{ marginTop: '14px', display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: '10px', width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <label className="cyber-btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', margin: 0, padding: '8px 14px', fontSize: '11px' }}>
              <Upload size={12} /> FILE
              <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleLocalFile} />
            </label>
          </div>

          <div>
            <button
              onClick={handleCapture}
              title="Capture Image"
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                border: '3px solid var(--cyan-primary)',
                background: 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 0 12px rgba(0, 240, 255, 0.4)',
                padding: 0,
              }}
            >
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                background: 'var(--cyan-primary)',
                boxShadow: '0 0 8px var(--cyan-primary)',
              }}></div>
            </button>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', fontSize: '10px', color: 'rgba(0, 240, 255, 0.7)', fontFamily: 'var(--font-mono)' }}>
            {coords ? `${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}` : 'NO GPS LOCK'}
          </div>
        </div>
      ) : (
        <div style={{ marginTop: '14px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', width: '100%' }}>
          <button className="cyber-btn-outline" onClick={handleRecapture} disabled={isTransmitting}>
            <RefreshCw size={12} /> RETAKE
          </button>
          <button className="cyber-btn striped" onClick={handleTransmit} disabled={!capturedBlob || isTransmitting}>
            <Send size={12} /> SUBMIT SCAN
          </button>
        </div>
      )}

      {/* Simplified Status Indicators */}
      <div className="telemetry-card" style={{ marginTop: '10px', padding: '8px 12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'rgba(0, 240, 255, 0.8)' }}>
          <span>CAM: {cameraPermission.toUpperCase()}</span>
          <span>GPS: {locationPermission.toUpperCase()}</span>
          <span>LINK: SECURE</span>
        </div>
      </div>

      {/* Terminal Log Status Ticker */}
      <div className="log-entry" style={{
        marginTop: '10px',
        padding: '6px 10px',
        border: '1px solid rgba(0, 240, 255, 0.15)',
        background: 'rgba(3, 12, 15, 0.4)',
        fontSize: '9px',
        fontFamily: 'var(--font-mono)',
        textAlign: 'center',
        overflow: 'hidden',
        whiteSpace: 'nowrap',
        textOverflow: 'ellipsis',
        color: 'var(--cyan-primary)'
      }}>
        STATUS // {logs[logs.length - 1] || 'SYSTEM ONLINE'}
      </div>

      {showModal && scanResult && (
        <div
          onClick={() => setShowModal(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '20px',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '360px',
              background: '#020b0d',
              border: '1px solid var(--cyan-primary)',
              padding: '20px',
              textAlign: 'center',
            }}
          >
            <div className={scanResult.success ? 'glow-text-green' : 'glow-text-amber'} style={{ fontSize: '16px', marginBottom: '12px' }}>
              {scanResult.success ? 'OBJECTIVE VERIFIED' : 'SUBMISSION REJECTED'}
            </div>
            <div style={{ fontSize: '12px', marginBottom: '6px' }}>{scanResult.message}</div>
            <div style={{ fontSize: '11px', color: 'rgba(0,240,255,0.7)', marginBottom: '16px' }}>
              {scanResult.prediction} // {scanResult.confidence}% confidence
            </div>
            <button className="cyber-btn striped" onClick={onAbort}>RETURN TO HUD</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Scan;
