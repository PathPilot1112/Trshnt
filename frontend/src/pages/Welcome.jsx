import React, { useState } from 'react';
import { Key, UserPlus, Radio, Wifi } from 'lucide-react';

const Welcome = ({ onLogin }) => {
  const [operatorHash, setOperatorHash] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState('');

  const handleLogin = () => {
    const hash = operatorHash.trim() || 'STALKER_01';
    onLogin(hash);
  };

  const handleNewUnit = () => {
    const randomHash = `STALKER_${Math.floor(1000 + Math.random() * 9000)}`;
    setOperatorHash(randomHash);
  };

  const handleScanQR = () => {
    setIsScanning(true);
    setScanMessage('ESTABLISHING SECURE P2P CONNECTION...');
    
    setTimeout(() => {
      setScanMessage('DECRYPTING ZONE ACCESS DATA PROTOCOL...');
    }, 1500);

    setTimeout(() => {
      const generatedHash = `STALKER_LIQUIDATOR_0${Math.floor(1 + Math.random() * 9)}`;
      setOperatorHash(generatedHash);
      setIsScanning(false);
      setScanMessage('');
      onLogin(generatedHash);
    }, 3500);
  };

  return (
    <div className="welcome-page">
      {/* Top Header */}
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

      <div className="access-protocol glow-text">
        ZONE_ACCESS_PROTOCOL
      </div>

      {/* Welcome Title */}
      <div className="welcome-title-container">
        <div className="welcome-title glitch-text" data-text="WELCOME TO THE ZONE">
          WELCOME TO THE ZONE
        </div>
        <div className="welcome-subtitle">
          &gt; Initialize connection to Pripyat-Central
        </div>
      </div>

      {/* Schematic & QR Code Scan Block */}
      <div className="qr-section">
        <div className="qr-corners"></div>
        
        {/* Animated laser scan line when scanning */}
        {isScanning && <div className="laser-beam"></div>}

        <div className="qr-container">
          <div className="qr-radar-line"></div>
          {/* Schematic SVG with QR code */}
          <svg viewBox="0 0 100 100" className="qr-placeholder-svg">
            <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="0.5" strokeDasharray="3, 3" />
            <circle cx="50" cy="50" r="30" fill="none" stroke="currentColor" strokeWidth="0.5" />
            <line x1="50" y1="5" x2="50" y2="95" stroke="currentColor" strokeWidth="0.25" />
            <line x1="5" y1="50" x2="95" y2="50" stroke="currentColor" strokeWidth="0.25" />
            
            {/* Mock QR Code in the center */}
            <g transform="translate(35, 35)">
              <rect x="0" y="0" width="30" height="30" fill="none" stroke="currentColor" strokeWidth="1" />
              {/* Corner position markers */}
              <rect x="2" y="2" width="6" height="6" fill="currentColor" />
              <rect x="3" y="3" width="4" height="4" fill="var(--bg-darkest)" />
              
              <rect x="22" y="2" width="6" height="6" fill="currentColor" />
              <rect x="23" y="3" width="4" height="4" fill="var(--bg-darkest)" />
              
              <rect x="2" y="22" width="6" height="6" fill="currentColor" />
              <rect x="3" y="23" width="4" height="4" fill="var(--bg-darkest)" />
              
              {/* Random QR Code elements */}
              <rect x="10" y="3" width="3" height="3" fill="currentColor" />
              <rect x="15" y="6" width="3" height="3" fill="currentColor" />
              <rect x="10" y="10" width="6" height="3" fill="currentColor" />
              <rect x="3" y="15" width="3" height="6" fill="currentColor" />
              <rect x="18" y="12" width="3" height="3" fill="currentColor" />
              <rect x="22" y="15" width="3" height="3" fill="currentColor" />
              <rect x="14" y="18" width="6" height="6" fill="currentColor" />
              <rect x="22" y="22" width="3" height="3" fill="currentColor" />
              <rect x="10" y="22" width="3" height="3" fill="currentColor" />
            </g>
          </svg>
        </div>

        {isScanning ? (
          <div style={{
            fontSize: '11px',
            color: 'var(--cyan-primary)',
            textAlign: 'center',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold'
          }}>
            {scanMessage}
          </div>
        ) : (
          <button className="cyber-btn striped qr-btn" onClick={handleScanQR}>
            <Radio size={16} /> Scan QR to Begin Mission
          </button>
        )}
      </div>

      {/* ID Prompt Entry */}
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

      {/* Log In & New Unit Actions */}
      <div className="welcome-actions">
        <button className="cyber-btn" onClick={handleLogin} style={{ color: 'var(--bg-darkest)' }}>
          <Key size={14} /> LOGIN
        </button>
        <button className="cyber-btn-outline" onClick={handleNewUnit}>
          <UserPlus size={14} /> NEW UNIT
        </button>
      </div>

      {/* Footer Info */}
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
    </div>
  );
};

export default Welcome;
