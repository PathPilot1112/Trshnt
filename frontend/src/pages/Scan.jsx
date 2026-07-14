import React, { useState, useEffect, useRef } from 'react';
import { Camera, Send, ArrowLeft, RefreshCw } from 'lucide-react';
import scannerBg from '../assets/stalker_scan_bg.png';

const API_BASE = 'http://localhost:6000/api';

const Scan = ({ token, onAbort }) => {
  const [logs, setLogs] = useState([
    'SYSTEM INITIALIZATION OK',
    'CAMERA MODULE ONLINE',
    'SCANNING FOR ANOMALIES...'
  ]);
  const [isFlashing, setIsFlashing] = useState(false);
  const [confidence, setConfidence] = useState(85);
  const [isTransmitting, setIsTransmitting] = useState(false);
  const [scanResult, setScanResult] = useState(null); // { success: boolean, message: string, prediction: string, confidence: number }
  const [showModal, setShowModal] = useState(false);
  
  // Camera streams
  const [hasCamera, setHasCamera] = useState(false);
  const [isCaptured, setIsCaptured] = useState(false);
  const [capturedBlob, setCapturedBlob] = useState(null);
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const consoleEndRef = useRef(null);
  const streamRef = useRef(null);

  // Scroll console to bottom
  useEffect(() => {
    if (consoleEndRef.current) {
      consoleEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  // Initialize camera stream
  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: 640, height: 480 },
          audio: false
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setHasCamera(true);
          setLogs(prev => [...prev, '>> FEED: LIVE TELEMETRY LINKED']);
        }
      } catch (err) {
        console.warn("Camera hardware access denied/unavailable. Using in-universe simulated viewport.", err);
        setHasCamera(false);
        setLogs(prev => [...prev, '>> WARNING: HARDWARE FEED UNLINKED', '>> FEED: SIMULATED RADAR SCANNER']);
        
        // Fetch background image and turn into a blob so that the fallback upload still works!
        try {
          const response = await fetch(scannerBg);
          const blob = await response.blob();
          setCapturedBlob(blob);
        } catch (fetchErr) {
          console.error("Failed to load placeholder blob:", fetchErr);
        }
      }
    };

    startCamera();

    return () => {
      // Turn off camera stream when leaving Scan page
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const handleCapture = async () => {
    setIsFlashing(true);
    setTimeout(() => setIsFlashing(false), 300);

    if (hasCamera && videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      
      // Draw current video frame to canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      setIsCaptured(true);
      setLogs(prev => [...prev, '>> IMAGE FRAME FROZEN', '>> COMPRESSING RAW DATA STRUCT...']);

      // Convert canvas to blob
      canvas.toBlob((blob) => {
        setCapturedBlob(blob);
        setLogs(prev => [...prev, `>> DATA SIZE: ${Math.round(blob.size / 1024)} KB`, '>> SCAN READY FOR TRANSMISSION']);
      }, 'image/jpeg', 0.85);

    } else {
      // Fallback capture (uses the preloaded background image blob)
      setIsCaptured(true);
      setLogs(prev => [
        ...prev,
        '>> SIMULATED IMAGE CAPTURED',
        '>> MATCH FOUND: ARTIFACT_TYPE_A',
        '>> SCAN READY FOR TRANSMISSION'
      ]);
    }
  };

  const handleRecapture = () => {
    setIsCaptured(false);
    setScanResult(null);
    setLogs(prev => [...prev, '>> CAMERA RESET. FEED REACTIVATED.']);
    
    // Restart camera stream if it was running
    if (hasCamera && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  };

  const handleTransmit = async () => {
    if (!capturedBlob) {
      alert("No image captured yet!");
      return;
    }

    setIsTransmitting(true);
    setLogs(prev => [
      ...prev,
      '>> INITIATING ENCRYPTED UPLINK TRANSMISSION...',
      '>> SENDING DATA CHUNKS TO COMMAND CORE...'
    ]);

    try {
      const formData = new FormData();
      formData.append('image', capturedBlob, 'pda_scan.jpg');

      const response = await fetch(`${API_BASE}/clues/submit`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        
        setLogs(prev => [
          ...prev,
          `>> RESPONSE: ${data.message.toUpperCase()}`,
          `>> PREDICTED LABEL: ${data.prediction || 'UNKNOWN'}`,
          `>> CONFIDENCE LEVEL: ${data.confidence ? Math.round(data.confidence * 100) : 0}%`,
          data.isCorrect ? '>> STATUS: OBJECTIVE RESOLVED' : '>> STATUS: REJECTED BY COMMAND'
        ]);

        setScanResult({
          success: data.isCorrect,
          message: data.message,
          prediction: data.prediction,
          confidence: data.confidence ? Math.round(data.confidence * 100) : 85
        });
        
        setShowModal(true);

      } else {
        const errData = await response.json();
        setLogs(prev => [...prev, `>> TRANSMISSION ERROR: ${errData.message}`]);
        alert(`Uplink Failed: ${errData.message}`);
      }
    } catch (err) {
      console.error("Transmission error:", err);
      setLogs(prev => [...prev, '>> ERROR: CONNECTION LOST DURING BEAM TRANSMISSION']);
      alert("Uplink failed. Check backend connection.");
    } finally {
      setIsTransmitting(false);
    }
  };

  // Convert confidence to block fills (10 blocks total)
  const totalBlocks = 10;
  const filledBlocks = Math.round(confidence / 10);

  return (
    <div className="scan-page">
      {/* Top Header */}
      <div className="scan-header">
        <button className="abort-btn" onClick={onAbort}>
          <ArrowLeft size={12} /> ABORT_SCAN
        </button>
        <div className="scan-status-info">
          <span>HUD_LINK: ACTIVE</span>
          <span className="spike-indicator">
            ✦ RAD_SPIKE: 1.2mSv
          </span>
        </div>
      </div>

      {/* Main Viewport */}
      <div className="scan-viewport-container">
        
        {/* Dynamic Video Viewport */}
        {hasCamera ? (
          <>
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              style={{
                position: 'absolute',
                top: 0, left: 0, width: '100%', height: '100%',
                objectFit: 'cover',
                opacity: isCaptured ? 0 : 0.8,
                filter: 'grayscale(100%) contrast(140%) brightness(90%) sepia(20%) hue-rotate(80deg)'
              }}
            />
            <canvas 
              ref={canvasRef} 
              style={{
                position: 'absolute',
                top: 0, left: 0, width: '100%', height: '100%',
                objectFit: 'cover',
                opacity: isCaptured ? 0.8 : 0,
                filter: 'grayscale(100%) contrast(140%) brightness(90%) sepia(20%) hue-rotate(80deg)'
              }}
            />
          </>
        ) : (
          // Falling back to beautiful generated background
          <img src={scannerBg} alt="Simulated Viewport" className="camera-feed-bg" />
        )}
        
        {/* Viewport UI overlays */}
        <div className="viewport-grid"></div>
        <div className="viewport-corners"></div>
        
        {!isCaptured && (
          <div className="reticle">
            <div className="reticle-circle"></div>
          </div>
        )}

        <div className="laser-beam"></div>
        <div className={`screen-flash ${isFlashing ? 'active' : ''}`}></div>

        {/* Transmission Loading Screen */}
        {isTransmitting && (
          <div style={{
            position: 'absolute',
            top: 0, left: 0, width: '100%', height: '100%',
            background: 'rgba(2, 10, 13, 0.85)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 15,
            gap: '12px'
          }}>
            <div className="flicker" style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--cyan-primary)', letterSpacing: '2px' }}>
              TRANSMITTING_DATA...
            </div>
            <div className="telemetry-bar-container" style={{ width: '60%' }}>
              <div className="telemetry-bar-fill" style={{
                width: '100%',
                animation: 'radar-sweep 2s infinite linear'
              }}></div>
            </div>
          </div>
        )}

        {/* Verification Result Modal */}
        {showModal && scanResult && (
          <div className="popup-alert">
            {scanResult.success ? (
              <>
                <div className="popup-title glow-text-green">UPLINK ACCEPTED</div>
                <div className="popup-message" style={{ fontSize: '11px', lineHeight: '1.4' }}>
                  Artifact identified: <strong>{scanResult.prediction}</strong> ({scanResult.confidence}% confidence).<br/>
                  Grid coordinates unlocked. Command authorized next step.
                </div>
                <button className="cyber-btn striped" onClick={onAbort} style={{ width: '100%', padding: '8px' }}>
                  PROCEED TO NEXT CLUE
                </button>
              </>
            ) : (
              <>
                <div className="popup-title glow-text-amber">VERIFICATION FAILED</div>
                <div className="popup-message" style={{ fontSize: '11px', lineHeight: '1.4' }}>
                  Command rejected upload: {scanResult.message}.<br/>
                  Target identified as <strong>{scanResult.prediction || 'Unknown'}</strong> ({scanResult.confidence}%). Re-scan target area.
                </div>
                <button 
                  className="cyber-btn" 
                  onClick={() => {
                    setShowModal(false);
                    handleRecapture();
                  }} 
                  style={{ width: '100%', padding: '8px', color: 'var(--bg-darkest)' }}
                >
                  RE-TRY SCAN
                </button>
              </>
            )}
          </div>
        )}

        {/* Live Analysis Logs */}
        <div className="ml-analysis-panel">
          <div className="ml-header">
            <span>ML_ANALYSIS // VIEWPORT</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>CONFIDENCE: {confidence}%</span>
              <div className="ml-confidence-bar">
                {Array.from({ length: totalBlocks }).map((_, index) => (
                  <div 
                    key={index} 
                    className={`confidence-block ${index < filledBlocks ? 'filled' : ''}`}
                  ></div>
                ))}
              </div>
            </div>
          </div>
          
          <div className="ml-log-console">
            {logs.map((log, index) => (
              <div key={index} className="log-entry">
                {log}
              </div>
            ))}
            <div ref={consoleEndRef} />
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="scan-actions-bar">
        {isCaptured ? (
          <button className="cyber-btn-outline" onClick={handleRecapture} disabled={isTransmitting || showModal}>
            <RefreshCw size={14} /> RESET FEED
          </button>
        ) : (
          <button className="cyber-btn-outline" onClick={handleCapture} disabled={isTransmitting || showModal}>
            <Camera size={14} /> CAPTURE IMAGE
          </button>
        )}
        <button className="cyber-btn striped" onClick={handleTransmit} disabled={!isCaptured || isTransmitting || showModal}>
          <Send size={14} /> SEND TO COMMAND
        </button>
      </div>
    </div>
  );
};

export default Scan;
