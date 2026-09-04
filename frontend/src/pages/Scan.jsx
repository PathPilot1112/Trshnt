import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Camera, MapPin, RefreshCw, Send, Upload, RotateCcw, RotateCw, Crop, Check } from 'lucide-react';
import scannerBg from '../assets/stalker_scan_bg.png';

const getCroppedRotatedBlob = (imageBlob, rotation, crop) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(imageBlob);
    img.onload = () => {
      URL.revokeObjectURL(url);

      // 1. First canvas for rotation
      const rotCanvas = document.createElement('canvas');
      const rotCtx = rotCanvas.getContext('2d');
      const isRotated90or270 = (rotation / 90) % 2 !== 0;

      rotCanvas.width = isRotated90or270 ? img.height : img.width;
      rotCanvas.height = isRotated90or270 ? img.width : img.height;

      rotCtx.translate(rotCanvas.width / 2, rotCanvas.height / 2);
      rotCtx.rotate((rotation * Math.PI) / 180);
      rotCtx.drawImage(img, -img.width / 2, -img.height / 2);

      // 2. Second canvas for cropping
      const cropCanvas = document.createElement('canvas');
      const cropCtx = cropCanvas.getContext('2d');

      const cropX = Math.round((crop.x / 100) * rotCanvas.width);
      const cropY = Math.round((crop.y / 100) * rotCanvas.height);
      const cropW = Math.round((crop.width / 100) * rotCanvas.width);
      const cropH = Math.round((crop.height / 100) * rotCanvas.height);

      cropCanvas.width = Math.max(1, cropW);
      cropCanvas.height = Math.max(1, cropH);

      cropCtx.drawImage(
        rotCanvas,
        cropX, cropY, cropW, cropH,
        0, 0, cropCanvas.width, cropCanvas.height
      );

      cropCanvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.9);
    };
    img.onerror = reject;
    img.src = url;
  });
};

const Scan = ({ API_BASE, token, onAbort }) => {
  const [logs, setLogs] = useState([
    'SYSTEM INITIALIZATION OK',
    'CAMERA MODULE ONLINE',
    'GPS LINK BOOTSTRAP STARTED',
  ]);
  const [hasCamera, setHasCamera] = useState(false);
  const [isCaptured, setIsCaptured] = useState(false);
  const [capturedBlob, setCapturedBlob] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [rotation, setRotation] = useState(0);
  const [cropBox, setCropBox] = useState({ x: 0, y: 0, width: 100, height: 100 });
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
  const viewportRef = useRef(null);
  const previewImgRef = useRef(null);
  const [imageBox, setImageBox] = useState({ left: 0, top: 0, width: 100, height: 100 });
  const [cropActive, setCropActive] = useState(true);

  const isDraggingRef = useRef(false);
  const dragTypeRef = useRef(null);
  const dragStartRef = useRef({ mouseX: 0, mouseY: 0, cropX: 0, cropY: 0, cropW: 0, cropH: 0 });

  const pushLog = (...entries) => setLogs((prev) => [...prev, ...entries]);

  // Derived preview URL when capturedBlob changes
  useEffect(() => {
    if (!capturedBlob) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(capturedBlob);
    setPreviewUrl(url);
    setRotation(0);
    setCropBox({ x: 0, y: 0, width: 100, height: 100 });
    setCropActive(true);
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [capturedBlob]);

  useEffect(() => {
    if (!isCaptured) return;
    const id = requestAnimationFrame(measureImageBox);
    window.addEventListener('resize', measureImageBox);
    return () => {
      cancelAnimationFrame(id);
      window.removeEventListener('resize', measureImageBox);
    };
  }, [isCaptured, rotation, previewUrl]);

  const measureImageBox = () => {
    if (!viewportRef.current || !previewImgRef.current) return;
    const view = viewportRef.current.getBoundingClientRect();
    const img = previewImgRef.current.getBoundingClientRect();
    if (!view.width || !view.height) return;
    setImageBox({
      left: ((img.left - view.left) / view.width) * 100,
      top: ((img.top - view.top) / view.height) * 100,
      width: (img.width / view.width) * 100,
      height: (img.height / view.height) * 100,
    });
  };

  // Drag handlers for crop overlay box
  const handleDragStart = (e, type) => {
    e.preventDefault();
    e.stopPropagation();
    isDraggingRef.current = true;
    dragTypeRef.current = type;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    dragStartRef.current = {
      mouseX: clientX,
      mouseY: clientY,
      cropX: cropBox.x,
      cropY: cropBox.y,
      cropW: cropBox.width,
      cropH: cropBox.height,
    };
  };

  useEffect(() => {
    const handleMove = (e) => {
      if (!isDraggingRef.current || !viewportRef.current) return;
      if (e.cancelable) e.preventDefault();
      const rect = viewportRef.current.getBoundingClientRect();
      const imgW = (imageBox.width / 100) * rect.width;
      const imgH = (imageBox.height / 100) * rect.height;
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;

      const dxPct = ((clientX - dragStartRef.current.mouseX) / Math.max(1, imgW)) * 100;
      const dyPct = ((clientY - dragStartRef.current.mouseY) / Math.max(1, imgH)) * 100;

      const type = dragTypeRef.current;
      const start = dragStartRef.current;

      setCropBox((prev) => {
        let newX = start.cropX;
        let newY = start.cropY;
        let newW = start.cropW;
        let newH = start.cropH;

        const MIN_SIZE = 10;

        if (type === 'move') {
          newX = Math.max(0, Math.min(100 - start.cropW, start.cropX + dxPct));
          newY = Math.max(0, Math.min(100 - start.cropH, start.cropY + dyPct));
        } else if (type === 'nw') {
          const maxDx = start.cropW - MIN_SIZE;
          const maxDy = start.cropH - MIN_SIZE;
          const actualDx = Math.min(maxDx, Math.max(-start.cropX, dxPct));
          const actualDy = Math.min(maxDy, Math.max(-start.cropY, dyPct));
          newX = start.cropX + actualDx;
          newW = start.cropW - actualDx;
          newY = start.cropY + actualDy;
          newH = start.cropH - actualDy;
        } else if (type === 'ne') {
          const maxDx = 100 - start.cropX - start.cropW;
          const maxDy = start.cropH - MIN_SIZE;
          const actualDx = Math.min(maxDx, Math.max(-start.cropW + MIN_SIZE, dxPct));
          const actualDy = Math.min(maxDy, Math.max(-start.cropY, dyPct));
          newW = start.cropW + actualDx;
          newY = start.cropY + actualDy;
          newH = start.cropH - actualDy;
        } else if (type === 'sw') {
          const maxDx = start.cropW - MIN_SIZE;
          const maxDy = 100 - start.cropY - start.cropH;
          const actualDx = Math.min(maxDx, Math.max(-start.cropX, dxPct));
          const actualDy = Math.min(maxDy, Math.max(-start.cropH + MIN_SIZE, dyPct));
          newX = start.cropX + actualDx;
          newW = start.cropW - actualDx;
          newH = start.cropY + actualDy;
        } else if (type === 'se') {
          const maxDx = 100 - start.cropX - start.cropW;
          const maxDy = 100 - start.cropY - start.cropH;
          const actualDx = Math.min(maxDx, Math.max(-start.cropW + MIN_SIZE, dxPct));
          const actualDy = Math.min(maxDy, Math.max(-start.cropH + MIN_SIZE, dyPct));
          newW = start.cropW + actualDx;
          newH = start.cropH + actualDy;
        }

        return { x: newX, y: newY, width: newW, height: newH };
      });
    };

    const handleEnd = () => {
      isDraggingRef.current = false;
      dragTypeRef.current = null;
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleEnd);
    window.addEventListener('touchmove', handleMove, { passive: false });
    window.addEventListener('touchend', handleEnd);

    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [imageBox.width, imageBox.height]);

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
            video.play().catch(() => { });
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
          '>> SCAN READY FOR EDITING & TRANSMISSION'
        );
      }, 'image/jpeg', 0.9);
      return;
    }

    fetch(scannerBg)
      .then((res) => res.blob())
      .then((blob) => {
        setCapturedBlob(blob);
        setIsCaptured(true);
        pushLog('>> SIMULATED CAPTURE STORED', '>> SCAN READY FOR EDITING & TRANSMISSION');
      });
  };

  const handleLocalFile = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setCapturedBlob(file);
    setIsCaptured(true);
    setScanResult(null);
    pushLog(`>> LOCAL FILE LOADED: ${file.name}`, '>> SCAN READY FOR EDITING & TRANSMISSION');
  };

  const handleRecapture = () => {
    setIsCaptured(false);
    setCapturedBlob(null);
    setScanResult(null);
    setRotation(0);
    setCropBox({ x: 0, y: 0, width: 100, height: 100 });
    if (videoRef.current && streamRef.current) {
      if (videoRef.current.srcObject !== streamRef.current) {
        videoRef.current.srcObject = streamRef.current;
      }
      videoRef.current.play().catch(() => {});
    }
    pushLog('>> CAMERA RESET. FEED REACTIVATED.');
  };

  const handleRotateCcw = () => {
    setRotation((prev) => (prev + 270) % 360);
    pushLog('>> IMAGE ROTATED 90° CCW');
  };

  const handleRotateCw = () => {
    setRotation((prev) => (prev + 90) % 360);
    pushLog('>> IMAGE ROTATED 90° CW');
  };

  const handleTransmit = async () => {
    if (!capturedBlob) return;
    setIsTransmitting(true);
    pushLog('>> PROCESSING CROP & ROTATION...', '>> INITIATING ENCRYPTED UPLINK...');
    try {
      const finalBlob = await getCroppedRotatedBlob(
        capturedBlob,
        rotation,
        cropActive ? cropBox : { x: 0, y: 0, width: 100, height: 100 }
      );
      const formData = new FormData();
      formData.append('image', finalBlob, 'pda_scan.jpg');
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
        nextClue: data.nextClue || null,
      });
      pushLog(`>> RESPONSE: ${data.isCorrect ? 'ACCEPTED' : 'NOT ACCEPTED'}`);
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
      <div className="scan-viewport-container" ref={viewportRef} style={{ position: 'relative', overflow: 'hidden' }}>

        {/* Camera feed (always mounted) */}
        <video
          ref={videoRef}
          autoPlay playsInline muted
          style={{
            position: 'absolute', inset: 0,
            width: '100%', height: '100%',
            objectFit: 'cover',
            opacity: (!isCaptured && hasCamera) ? 1.0 : 0.0,
            pointerEvents: (!isCaptured && hasCamera) ? 'auto' : 'none',
          }}
        />

        {/* Offscreen Canvas for capture fallback */}
        <canvas ref={canvasRef} style={{ display: 'none' }} />

        {/* Simulated atmospheric bg when no camera and not captured */}
        {!hasCamera && !isCaptured && (
          <img src={scannerBg} alt="Simulated Viewport" className="camera-feed-bg" />
        )}

        {/* Captured image editor preview with rotation & crop box overlay */}
        {isCaptured && previewUrl && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000' }}>
            <img
              ref={previewImgRef}
              src={previewUrl}
              alt="Captured Frame"
              onLoad={measureImageBox}
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain',
                transform: `rotate(${rotation}deg)`,
                transition: cropActive ? 'none' : 'transform 0.2s ease',
              }}
            />

            {cropActive && (
              <div
                className="crop-layer"
                style={{
                  position: 'absolute',
                  left: `${imageBox.left}%`,
                  top: `${imageBox.top}%`,
                  width: `${imageBox.width}%`,
                  height: `${imageBox.height}%`,
                  touchAction: 'none',
                }}
              >
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: `${cropBox.y}%`, background: 'rgba(0,0,0,0.55)', pointerEvents: 'none' }} />
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: `${100 - cropBox.y - cropBox.height}%`, background: 'rgba(0,0,0,0.55)', pointerEvents: 'none' }} />
                <div style={{ position: 'absolute', top: `${cropBox.y}%`, left: 0, width: `${cropBox.x}%`, height: `${cropBox.height}%`, background: 'rgba(0,0,0,0.55)', pointerEvents: 'none' }} />
                <div style={{ position: 'absolute', top: `${cropBox.y}%`, right: 0, width: `${100 - cropBox.x - cropBox.width}%`, height: `${cropBox.height}%`, background: 'rgba(0,0,0,0.55)', pointerEvents: 'none' }} />

                <div
                  onMouseDown={(e) => handleDragStart(e, 'move')}
                  onTouchStart={(e) => handleDragStart(e, 'move')}
                  className="crop-frame"
                  style={{
                    position: 'absolute',
                    top: `${cropBox.y}%`,
                    left: `${cropBox.x}%`,
                    width: `${cropBox.width}%`,
                    height: `${cropBox.height}%`,
                  }}
                >
                  <div className="crop-grid-h" style={{ top: '33.33%' }} />
                  <div className="crop-grid-h" style={{ top: '66.66%' }} />
                  <div className="crop-grid-v" style={{ left: '33.33%' }} />
                  <div className="crop-grid-v" style={{ left: '66.66%' }} />
                  {['nw', 'ne', 'sw', 'se'].map((handle) => (
                    <div
                      key={handle}
                      className={`crop-handle crop-handle-${handle}`}
                      onMouseDown={(e) => handleDragStart(e, handle)}
                      onTouchStart={(e) => handleDragStart(e, handle)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Corner brackets + reticle */}
        <div className="viewport-corners" style={{ pointerEvents: 'none' }} />
        {!isCaptured && (
          <div className="reticle">
            <div className="reticle-circle" />
          </div>
        )}

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

      {/* ═══════════════ CAPTURE & EDIT CONTROLS ═══════════════ */}
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
          <div style={{ display: 'flex', justifyContent: 'flex-start' }} />

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
          padding: '10px 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          background: 'rgba(0, 20, 22, 0.9)',
          borderTop: '1px solid rgba(57, 255, 20, 0.2)',
        }}>
          {/* Rotate & Edit Toolbar */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <button className="cyber-btn-outline" onClick={handleRotateCcw} style={{ padding: '10px 14px', fontSize: '12px', minHeight: '44px' }} title="Rotate left">
              <RotateCcw size={16} /> Rotate 90°
            </button>
            <button
              className={cropActive ? 'cyber-btn striped' : 'cyber-btn-outline'}
              onClick={() => {
                setCropActive((prev) => !prev);
                requestAnimationFrame(measureImageBox);
              }}
              style={{ padding: '10px 18px', fontSize: '13px', minHeight: '48px', minWidth: '130px', fontWeight: 700, borderRadius: '8px' }}
              title="Crop photo"
            >
              <Crop size={18} /> {cropActive ? 'Crop Active' : 'Enable Crop'}
            </button>
            {cropActive && (
              <button
                className="cyber-btn-outline"
                onClick={() => setCropBox({ x: 0, y: 0, width: 100, height: 100 })}
                style={{ padding: '10px 12px', fontSize: '11px', minHeight: '44px' }}
                title="Reset crop frame to full"
              >
                Reset Crop
              </button>
            )}
            <button className="cyber-btn-outline" onClick={handleRotateCw} style={{ padding: '10px 14px', fontSize: '12px', minHeight: '44px' }} title="Rotate right">
              <RotateCw size={16} /> Rotate 90°
            </button>
          </div>
          {cropActive && (
            <div style={{ textAlign: 'center', fontFamily: 'var(--font-sans)', fontSize: '12px', color: 'var(--color-neon-green)', letterSpacing: '0.5px' }}>
              Drag glowing corner handles to frame photo. Tap SUBMIT when ready.
            </div>
          )}

          {/* Action Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <button className="cyber-btn-outline" onClick={handleRecapture} disabled={isTransmitting} style={{ borderRadius: '8px' }}>
              <RefreshCw size={14} /> RETAKE
            </button>
            <button className="cyber-btn striped" onClick={handleTransmit} disabled={!capturedBlob || isTransmitting} style={{ borderRadius: '8px', fontWeight: 700 }}>
              <Send size={14} /> SUBMIT SCAN
            </button>
          </div>
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
                fontFamily: 'var(--font-sans)',
                fontSize: '17px',
                fontWeight: 600,
                marginBottom: '12px',
                color: scanResult.success ? 'var(--color-neon-green)' : 'var(--color-amber)',
              }}>
                {scanResult.success ? 'Scan accepted' : 'Try again'}
              </div>

              {scanResult.success && scanResult.nextClue && !scanResult.nextClue.finished && (
                <div className="hud-clue-text" style={{ textAlign: 'left', marginBottom: '16px' }}>
                  {scanResult.nextClue.text}
                </div>
              )}
              {scanResult.success && scanResult.nextClue?.finished && (
                <div className="hud-copy" style={{ marginBottom: '16px' }}>All clues complete.</div>
              )}
              {!scanResult.success && (
                <div className="hud-copy" style={{ marginBottom: '16px' }}>{scanResult.message}</div>
              )}

              <button className="cyber-btn striped" style={{ width: '100%' }} onClick={onAbort}>
                Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Scan;
