import React, { useState, useEffect } from 'react';
import { MessageSquare, Radio, Shield, Scan, Map, FileText, LayoutGrid, Play, LogOut } from 'lucide-react';

const API_BASE = 'http://localhost:6000/api';

const HUD = ({ operatorName, teamInfo, token, onNavigate, onLogout, onRefresh }) => {
  const [radiation, setRadiation] = useState(0.15);
  const [countdown, setCountdown] = useState({ hours: 3, minutes: 0, seconds: 0 });
  const [currentClue, setCurrentClue] = useState(null);
  const [clueFinished, setClueFinished] = useState(false);
  const [isLoadingClue, setIsLoadingClue] = useState(true);
  const [activeTab, setActiveTab] = useState('hud'); // 'hud', 'map', 'logs'
  const [chatOpen, setChatOpen] = useState(false);

  // Fluctuating radiation level
  useEffect(() => {
    const interval = setInterval(() => {
      setRadiation(prev => {
        const change = (Math.random() - 0.5) * 0.02;
        const next = Math.max(0.12, Math.min(0.18, prev + change));
        return parseFloat(next.toFixed(2));
      });
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Fetch current clue
  useEffect(() => {
    const fetchCurrentClue = async () => {
      if (!token || !teamInfo || teamInfo.status !== 'in_progress') {
        setIsLoadingClue(false);
        return;
      }

      setIsLoadingClue(true);
      try {
        const response = await fetch(`${API_BASE}/clues/current`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          if (data.finished) {
            setClueFinished(true);
          } else {
            setCurrentClue(data);
            setClueFinished(false);
          }
        }
      } catch (err) {
        console.error("Error fetching current clue:", err);
      } finally {
        setIsLoadingClue(false);
      }
    };

    fetchCurrentClue();
  }, [token, teamInfo?.currentClueIndex, teamInfo?.status]);

  // Sync countdown timer to database startedAt
  useEffect(() => {
    if (!teamInfo || !teamInfo.startedAt || teamInfo.status !== 'in_progress') {
      return;
    }

    const durationMs = 3 * 60 * 60 * 1000; // 3 hours limit

    const updateTimer = () => {
      const startTime = new Date(teamInfo.startedAt).getTime();
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, durationMs - elapsed);

      const hours = Math.floor(remaining / (3600 * 1000));
      const minutes = Math.floor((remaining % (3600 * 1000)) / (60 * 1000));
      const seconds = Math.floor((remaining % (60 * 1000)) / 1000);

      setCountdown({ hours, minutes, seconds });
    };

    updateTimer();
    const timerInterval = setInterval(updateTimer, 1000);
    return () => clearInterval(timerInterval);
  }, [teamInfo?.startedAt, teamInfo?.status]);

  // Periodically report simulated coordinates near coordinates
  useEffect(() => {
    if (!token || !teamInfo || teamInfo.status !== 'in_progress') return;

    const reportLocation = async () => {
      // coordinates from red forest clue or slightly drifted
      const lat = 51.3892 + (Math.random() - 0.5) * 0.001;
      const lng = 30.0997 + (Math.random() - 0.5) * 0.001;

      try {
        await fetch(`${API_BASE}/teams/location`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ lat, lng })
        });
      } catch (err) {
        console.error("GPS telemetry failed:", err);
      }
    };

    reportLocation();
    const gpsInterval = setInterval(reportLocation, 15000);
    return () => clearInterval(gpsInterval);
  }, [token, teamInfo?.status]);

  const handleStartMission = async () => {
    if (!token) return;
    try {
      const response = await fetch(`${API_BASE}/teams/start`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        onRefresh(); // Refresh App state to get the in_progress status and startedAt
      } else {
        alert("Failed to start mission.");
      }
    } catch (err) {
      console.error("Error starting mission:", err);
    }
  };

  const formatNumber = (num) => String(num).padStart(2, '0');

  // If team has not started, show the Deployment/Protocol Lock screen
  const isNotStarted = teamInfo?.status === 'not_started';

  return (
    <div className="hud-page">
      {/* Top Header */}
      <div className="stalker-header">
        <div className="net-info">
          <div className="net-name">STALKER_NET_V2.1</div>
          <div className="operator-info">OPERATOR: {operatorName} // {teamInfo?.name || 'UNASSIGNED'}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div className="rank-badge">RANK: LIQUIDATOR</div>
          <div className="header-icons">
            <MessageSquare 
              size={16} 
              className={chatOpen ? "glow-text" : ""} 
              style={{ cursor: 'pointer' }}
              onClick={() => setChatOpen(!chatOpen)}
            />
            <LogOut size={16} style={{ cursor: 'pointer', marginLeft: '4px' }} onClick={onLogout} />
          </div>
        </div>
      </div>

      {chatOpen && (
        <div style={{
          border: '1px solid var(--cyan-primary)',
          background: 'rgba(3, 12, 15, 0.95)',
          padding: '10px',
          fontSize: '10px',
          marginBottom: '10px',
          boxShadow: '0 0 10px rgba(0,240,255,0.3)',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          zIndex: 10
        }}>
          <div style={{ color: 'var(--amber-primary)', borderBottom: '1px solid rgba(0,240,255,0.1)', paddingBottom: '4px' }}>
            SECURE_COMMS_LINK: ACTIVE
          </div>
          <div><strong>[COMMAND]:</strong> Welcome Stalker. Initiate mission to retrieve encrypted transponders.</div>
          {isNotStarted && <div><strong>[COMMAND]:</strong> Click INITIATE MISSION PROTOCOL to synchronize timers.</div>}
        </div>
      )}

      {/* Main Content */}
      {activeTab === 'hud' && (
        <>
          {/* Telemetry */}
          <div className="hud-telemetry" style={{ marginTop: '10px' }}>
            <div className="telemetry-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="telemetry-label">RADIATION</span>
                <span className="telemetry-value glow-text">{radiation} mSv/h</span>
              </div>
              <div className="telemetry-bar-container">
                <div className="telemetry-bar-fill" style={{ width: `${(radiation / 0.3) * 100}%` }}></div>
              </div>
            </div>
          </div>

          <span className="telemetry-label" style={{ fontSize: '9px', marginLeft: '2px', display: 'block', marginBottom: '4px' }}>
            PSY-PROTECTION: ACTIVE [98%]
          </span>

          {/* Clue Panel */}
          <div className="clue-panel">
            {isNotStarted ? (
              // LOCKED DEPLOYMENT SCREEN
              <div style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                textAlign: 'center',
                gap: '20px',
                padding: '20px 10px'
              }}>
                <div className="glow-text-amber flicker" style={{ fontSize: '16px', fontWeight: 'bold', letterSpacing: '2px' }}>
                  ⚠️ DEPLOYMENT_LOCKED
                </div>
                <p style={{ fontSize: '12px', lineHeight: '1.6', color: 'rgba(255, 255, 255, 0.7)' }}>
                  PDA link initialized. GPS coordinates and objective decipher codes are held until command synchronization. Click below to begin mission.
                </p>
                <button className="cyber-btn striped" onClick={handleStartMission} style={{ width: '100%' }}>
                  <Play size={14} /> INITIATE MISSION PROTOCOL
                </button>
              </div>
            ) : clueFinished ? (
              // SOLVED ALL CLUES SUCCESS SCREEN
              <div style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                textAlign: 'center',
                gap: '20px',
                padding: '20px 10px'
              }}>
                <div className="glow-text-green flicker" style={{ fontSize: '18px', fontWeight: 'bold', letterSpacing: '2px' }}>
                  🏆 ALL OBJECTIVES SECURED
                </div>
                <p style={{ fontSize: '12px', lineHeight: '1.6', color: 'rgba(255, 255, 255, 0.8)' }}>
                  Congratulations, Operator. All radiation anomalies analyzed, and encrypted codes transmitted successfully. Report back to base camp immediately.
                </p>
                <div className="highlight-code" style={{ fontSize: '14px', width: '100%', padding: '10px 0' }}>
                  SCORE: {teamInfo?.score} PTS
                </div>
              </div>
            ) : isLoadingClue ? (
              // LOADING CLUE STATE
              <div style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '12px'
              }}>
                <div style={{ fontSize: '12px', color: 'var(--cyan-primary)' }}>RETRIEVING CLUE DATA...</div>
                <div className="telemetry-bar-container" style={{ width: '40%' }}>
                  <div className="telemetry-bar-fill" style={{ width: '100%', animation: 'radar-sweep 1.5s infinite linear' }}></div>
                </div>
              </div>
            ) : (
              // ACTIVE OBJECTIVE PANEL
              <>
                <button className="cyber-btn striped" style={{ marginBottom: '16px', fontSize: '11px', padding: '10px' }}>
                  <Radio size={12} className="flicker" /> DATA_CORE_ACTIVE // CLUE_{teamInfo?.currentClueIndex + 1}
                </button>

                <div className="clue-header">_ACTIVE_CLUE:</div>
                <div className="clue-title">"{currentClue?.title}"</div>

                <div className="clue-body-box">
                  <div className="clue-body-corners"></div>
                  {currentClue?.text}
                  
                  {currentClue?.hint && (
                    <div style={{ fontSize: '10px', color: 'var(--amber-primary)', marginTop: '12px', borderTop: '1px dotted rgba(0,240,255,0.1)', paddingTop: '8px' }}>
                      <strong>HINT:</strong> {currentClue.hint}
                    </div>
                  )}
                </div>

                {/* Expiry Countdown */}
                <div className="mission-expiry-section">
                  <span className="expiry-label">MISSION_EXPIRY</span>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                    <span style={{ fontSize: '8px', color: 'var(--amber-primary)' }}>T-MINUS</span>
                    <span className="expiry-time">
                      {formatNumber(countdown.hours)}:{formatNumber(countdown.minutes)}:{formatNumber(countdown.seconds)}
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>
        </>
      )}

      {activeTab === 'map' && (
        <div className="clue-panel" style={{ flex: 1, marginTop: '10px' }}>
          <div className="clue-header">MAP_MODULE: CURRENT_POSITION</div>
          <div className="clue-title">PRIPYAT / RED FOREST SECTOR</div>
          
          <div style={{
            flex: 1,
            border: '1px solid rgba(0, 240, 255, 0.3)',
            background: 'rgba(2, 10, 13, 0.8)',
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <svg viewBox="0 0 100 100" style={{ width: '90%', height: '90%', stroke: 'var(--cyan-primary)', strokeWidth: '0.5', fill: 'none' }}>
              <circle cx="50" cy="50" r="40" strokeDasharray="2,2" />
              <circle cx="50" cy="50" r="25" />
              <line x1="50" y1="10" x2="50" y2="90" strokeDasharray="2,2" />
              <line x1="10" y1="50" x2="90" y2="50" strokeDasharray="2,2" />
              
              <path d="M 20,30 Q 35,25 45,35 T 70,30 T 90,40" stroke="rgba(0, 240, 255, 0.2)" />
              <path d="M 10,70 Q 30,80 50,65 T 80,75" stroke="rgba(0, 240, 255, 0.2)" />
              
              <circle cx="65" cy="35" r="4" fill="var(--amber-primary)" />
              <text x="69" y="32" fill="var(--amber-primary)" fontSize="4" fontFamily="monospace">RAD ANOMALY</text>

              {/* Clue Coordinates Indicator */}
              {!isNotStarted && !clueFinished && (
                <g transform="translate(48, 48)">
                  <circle cx="2" cy="2" r="3" fill="var(--cyan-primary)" />
                  <line x1="2" y1="-3" x2="2" y2="7" stroke="var(--cyan-primary)" strokeWidth="0.7" />
                  <line x1="-3" y1="2" x2="7" y2="2" stroke="var(--cyan-primary)" strokeWidth="0.7" />
                  <text x="7" y="-1" fill="var(--cyan-primary)" fontSize="4" fontWeight="bold">TARGET_CLUE</text>
                </g>
              )}

              {/* User Position Pointer */}
              <polygon points="30,60 33,65 27,65" fill="var(--green-primary)" />
              <circle cx="30" cy="62" r="5" stroke="var(--green-primary)" strokeWidth="0.5" strokeDasharray="2,1" />
              <text x="32" y="71" fill="var(--green-primary)" fontSize="4">YOU</text>
            </svg>
          </div>
        </div>
      )}

      {activeTab === 'logs' && (
        <div className="clue-panel" style={{ flex: 1, marginTop: '10px' }}>
          <div className="clue-header">SYS_LOGS: STALKER_TERMINAL</div>
          <div className="clue-title">SYSTEM EVENT LOGS</div>

          <div style={{
            flex: 1,
            border: '1px solid rgba(0, 0, 0, 0.4)',
            background: 'rgba(1, 6, 8, 0.95)',
            fontFamily: 'monospace',
            fontSize: '11px',
            padding: '12px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            <div style={{ color: 'rgba(0,240,255,0.5)' }}>[09:30:12] UPLINK_INIT_REQUEST... SUCCESS</div>
            <div style={{ color: 'var(--green-primary)' }}>[09:30:15] HANDSHAKE SECURE TUNNEL_082 OK</div>
            <div style={{ color: 'var(--cyan-primary)' }}>[09:30:20] LOAD MODULE: DATA_CORE_0x82</div>
            <div style={{ color: 'var(--amber-primary)' }}>[09:32:00] RAD WARNING: 0.15 mSv/h IN REGION</div>
            {!isNotStarted && <div style={{ color: 'var(--green-primary)' }}>[09:40:02] MISSION SYNCHRONIZED BY OPERATOR</div>}
            {clueFinished && <div style={{ color: 'var(--green-primary)' }}>[09:48:12] ALL ENCRYPTED WAVEFORMS RECOVERED</div>}
            <div className="flicker" style={{ color: 'var(--cyan-primary)' }}>&gt; _</div>
          </div>
        </div>
      )}

      {/* Bottom Tabs Navbar */}
      <div className="hud-nav-bar">
        <div className="nav-tab" onClick={() => !isNotStarted && !clueFinished && onNavigate('scan')} style={{ opacity: (isNotStarted || clueFinished) ? 0.3 : 1 }}>
          <Scan size={18} />
          <span>SCAN</span>
        </div>
        <div className={`nav-tab ${activeTab === 'map' ? 'active' : ''}`} onClick={() => setActiveTab('map')}>
          <Map size={18} />
          <span>MAP</span>
        </div>
        <div className={`nav-tab ${activeTab === 'logs' ? 'active' : ''}`} onClick={() => setActiveTab('logs')}>
          <FileText size={18} />
          <span>LOGS</span>
        </div>
        <div className={`nav-tab ${activeTab === 'hud' ? 'active' : ''}`} onClick={() => setActiveTab('hud')}>
          <LayoutGrid size={18} />
          <span>HUD</span>
        </div>
      </div>
    </div>
  );
};

export default HUD;
