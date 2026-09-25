import React, { useEffect, useState } from 'react';
import {
  LogOut,
  Scan,
  Clock,
  ShieldAlert,
  Compass,
  CheckCircle2,
  Lock,
  Package,
  Sparkles,
  Navigation,
  X,
  Radio,
  Check
} from 'lucide-react';
import { getSocket } from '../socket';
import ScanComponent from './Scan';

const HUD = ({ API_BASE, operatorName, teamInfo, token, onNavigate, onLogout }) => {
  const [cluePayload, setCluePayload] = useState(null);
  const [clueFinished, setClueFinished] = useState(false);
  const [isLoadingClue, setIsLoadingClue] = useState(true);
  const [localTeam, setLocalTeam] = useState(teamInfo);
  const [elapsedMs, setElapsedMs] = useState(teamInfo?.timerAccumulatedMs || 0);
  const [selectedItemModal, setSelectedItemModal] = useState(null);
  const [showInventoryDrawer, setShowInventoryDrawer] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  // Report Modal & System State
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportCategory, setReportCategory] = useState('clue_discrepancy');
  const [reportMessage, setReportMessage] = useState('');
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);
  const [systemState, setSystemState] = useState({ testDevMode: false, coordMappingEnabled: false });

  // GPS Telemetry State
  const [gpsStatus, setGpsStatus] = useState('acquiring'); // 'active' | 'acquiring' | 'denied'
  const [gpsCoords, setGpsCoords] = useState(null);

  useEffect(() => {
    setLocalTeam(teamInfo);
  }, [teamInfo]);

  // Fetch initial system state (Test Dev Mode, Geofence mapping)
  useEffect(() => {
    fetch(`${API_BASE}/admin/system-state`)
      .then(res => res.json())
      .then(data => setSystemState(data))
      .catch(() => {});
  }, [API_BASE]);

  // Request & Stream GPS Location on HUD Mount / Game Start
  useEffect(() => {
    if (!navigator.geolocation) {
      setGpsStatus('denied');
      return;
    }

    // 1. Initial position request
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsStatus('active');
        setGpsCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        if (token) {
          fetch(`${API_BASE}/teams/location`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
          }).catch(() => {});
        }
      },
      (err) => {
        console.warn("GPS Permission or signal error:", err.message);
        setGpsStatus('denied');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );

    // 2. Continuous watch
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setGpsStatus('active');
        setGpsCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        if (token) {
          fetch(`${API_BASE}/teams/location`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
          }).catch(() => {});
        }
      },
      (err) => {
        console.warn("GPS watch error:", err.message);
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [API_BASE, token]);

  // Fetch full clue payload with zero-lag background updates
  const fetchCurrentClue = async (showLoader = false) => {
    if (localTeam?.status === 'finished') {
      setClueFinished(true);
      setIsLoadingClue(false);
      return;
    }
    if (!token || !localTeam || localTeam.status !== 'in_progress') {
      setClueFinished(false);
      setIsLoadingClue(false);
      return;
    }
    if (showLoader && !cluePayload) {
      setIsLoadingClue(true);
    }
    try {
      const response = await fetch(`${API_BASE}/clues/current`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) return;
      const data = await response.json();
      setCluePayload(data);
      if (data.systemState) {
        setSystemState(data.systemState);
      }
      setClueFinished(Boolean(data.finished));
    } catch (err) {
      console.error("Error loading clue payload:", err);
    } finally {
      setIsLoadingClue(false);
    }
  };

  useEffect(() => {
    fetchCurrentClue(true);
  }, [API_BASE, token, localTeam?.currentClueIndex, localTeam?.status]);

  // Timer interval
  useEffect(() => {
    const calculateElapsed = () => {
      if (!localTeam) return 0;
      const base = localTeam.timerAccumulatedMs || 0;
      if (!localTeam.timerRunning || !localTeam.timerStartedAt) return base;
      return base + (Date.now() - new Date(localTeam.timerStartedAt).getTime());
    };
    setElapsedMs(calculateElapsed());
    const interval = setInterval(() => setElapsedMs(calculateElapsed()), 1000);
    return () => clearInterval(interval);
  }, [localTeam]);

  // Handle report submission
  const handleSendReport = async (e) => {
    e.preventDefault();
    if (!reportMessage.trim()) return;
    setReportSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/clues/report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          category: reportCategory,
          message: reportMessage,
          clueTitle: cluePayload?.pathSummary?.[cluePayload?.step - 1]?.locationName || cluePayload?.text || 'N/A',
          coords: gpsCoords,
        }),
      });
      if (res.ok) {
        setReportSuccess(true);
        setReportMessage('');
        setTimeout(() => {
          setReportSuccess(false);
          setShowReportModal(false);
        }, 1800);
      }
    } catch (err) {
      console.error("Error submitting report:", err);
    } finally {
      setReportSubmitting(false);
    }
  };

  // Socket updates
  useEffect(() => {
    const socket = getSocket(API_BASE);
    const teamId = localTeam?.id || localTeam?._id;

    const handleStatus = (payload) => {
      if (String(payload.teamId) !== String(teamId)) return;
      setLocalTeam((prev) => ({ ...prev, ...payload }));
    };
    const handleTimer = (payload) => {
      if (String(payload.teamId) !== String(teamId)) return;
      setLocalTeam((prev) => ({ ...prev, ...payload }));
    };
    const handleLeaderboard = (payload) => {
      const ownEntry = payload.find((entry) => String(entry.teamId) === String(teamId));
      if (ownEntry) {
        setLocalTeam((prev) => ({
          ...prev,
          score: ownEntry.score,
          currentClueIndex: ownEntry.currentClueIndex,
          status: ownEntry.status,
          timerRunning: ownEntry.timerRunning,
          timerStartedAt: ownEntry.timerStartedAt,
          timerAccumulatedMs: ownEntry.timerAccumulatedMs,
        }));
      }
    };
    const handleSystemState = (newState) => {
      setSystemState(newState);
    };

    socket.on('team:status', handleStatus);
    socket.on('team:timer', handleTimer);
    socket.on('leaderboard:snapshot', handleLeaderboard);
    socket.on('system:state', handleSystemState);

    return () => {
      socket.off('team:status', handleStatus);
      socket.off('team:timer', handleTimer);
      socket.off('leaderboard:snapshot', handleLeaderboard);
      socket.off('system:state', handleSystemState);
    };
  }, [API_BASE, localTeam?.id, localTeam?._id]);

  const formatElapsed = (ms) => {
    const totalSeconds = Math.floor(ms / 1000);
    const seconds = totalSeconds % 60;
    const minutes = Math.floor(totalSeconds / 60) % 60;
    const hours = Math.floor(totalSeconds / 3600);
    return [hours, minutes, seconds].map((v) => String(v).padStart(2, '0')).join(':');
  };

  const isNotStarted = localTeam?.status === 'not_started';
  const canScan = !isNotStarted && !clueFinished;

  const pathSummary = cluePayload?.pathSummary || [];
  const inventory = cluePayload?.inventory || [];
  const currentStepNum = cluePayload?.step || (localTeam?.currentClueIndex || 0) + 1;
  const totalStepsNum = cluePayload?.total || 5;

  return (
    <div className="hud-shell" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      
      {/* Top Header Bar */}
      <header className="hud-top" style={{ flexShrink: 0 }}>
        <div>
          <div className="hud-kicker" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{
              width: '8px', height: '8px', borderRadius: '50%',
              background: localTeam?.timerRunning ? '#39ff14' : '#ffb700',
              boxShadow: localTeam?.timerRunning ? '0 0 10px #39ff14' : '0 0 10px #ffb700'
            }} />
            <span style={{ fontSize: '10px', letterSpacing: '1px', fontWeight: 'bold' }}>
              {localTeam?.timerRunning ? 'LIVE TACTICAL UPLINK' : 'STANDBY MODE'}
            </span>
          </div>
          <div className="hud-operator" style={{ fontSize: '13px', marginTop: '2px' }}>
            {operatorName} <span style={{ color: 'var(--color-accent)', fontWeight: '600' }}>({localTeam?.name || 'Unassigned'})</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            className="hud-icon-btn"
            onClick={() => setShowInventoryDrawer(!showInventoryDrawer)}
            title="Squad Tactical Inventory"
            style={{ position: 'relative', background: 'rgba(57, 255, 20, 0.1)', border: '1px solid rgba(57, 255, 20, 0.3)' }}
          >
            <Package size={16} color="var(--color-neon-green)" />
            {inventory.length > 0 && (
              <span style={{
                position: 'absolute',
                top: '-4px',
                right: '-4px',
                background: '#39ff14',
                color: '#000',
                fontSize: '9px',
                fontWeight: 'bold',
                width: '14px',
                height: '14px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 6px #39ff14'
              }}>
                {inventory.length}
              </span>
            )}
          </button>

          <button type="button" className="hud-icon-btn" onClick={onLogout} aria-label="Sign out" title="Abort Session">
            <LogOut size={16} />
          </button>
        </div>
      </header>

      {/* Gamified Top Telemetry Bar (Live GPS, Squad Supplies) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '6px',
        padding: '8px 10px',
        background: 'rgba(15, 23, 42, 0.85)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        flexShrink: 0
      }}>


        {/* Stat 2: Live GPS Telemetry Indicator */}
        <div style={{
          background: 'rgba(0, 0, 0, 0.4)',
          borderRadius: '8px',
          padding: '6px 4px',
          textAlign: 'center',
          border: `1px solid ${gpsStatus === 'active' ? 'rgba(57, 255, 20, 0.3)' : 'rgba(255, 183, 0, 0.3)'}`
        }}>
          <div style={{ fontSize: '8px', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            🛰️ GPS
          </div>
          <div style={{
            fontSize: '10px',
            fontWeight: 'bold',
            color: gpsStatus === 'active' ? '#39ff14' : gpsStatus === 'acquiring' ? '#ffb700' : '#ff4444',
            fontFamily: 'var(--font-mono)'
          }}>
            {gpsStatus === 'active' ? 'LOCKED' : gpsStatus === 'acquiring' ? 'SEARCHING' : 'OFFLINE'}
          </div>
        </div>

        {/* Stat 3: Squad Inventory Counter */}
        <div
          onClick={() => setShowInventoryDrawer(true)}
          style={{
            background: 'rgba(0, 0, 0, 0.4)',
            borderRadius: '8px',
            padding: '6px 4px',
            textAlign: 'center',
            border: '1px solid rgba(0, 229, 255, 0.25)',
            cursor: 'pointer'
          }}
        >
          <div style={{ fontSize: '8px', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            🎒 Supplies
          </div>
          <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#00e5ff', fontFamily: 'var(--font-mono)' }}>
            {inventory.length} / 5
          </div>
        </div>
      </div>

      {/* Main Mission Screen: 5-Quest Path Ascent Cards */}
      <div className="hud-scroll" style={{ flex: 1, overflowY: 'auto', padding: '12px', paddingBottom: '80px' }}>

        {/* Sector Quest Path Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '12px',
          padding: '0 4px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Sparkles size={14} color="var(--color-neon-green)" />
            <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#fff', letterSpacing: '1px', textTransform: 'uppercase' }}>
              SECTOR QUEST ASCENT
            </span>
          </div>
          <span style={{ fontSize: '10px', color: 'var(--color-neon-green)', fontFamily: 'var(--font-mono)', fontWeight: 'bold' }}>
            {isNotStarted ? '0 OF 5 STARTED' : clueFinished ? 'ALL 5 COMPLETED' : `STEP ${currentStepNum} OF ${totalStepsNum}`}
          </span>
        </div>

        {/* Not Started State Banner */}
        {isNotStarted && (
          <div style={{
            background: 'rgba(255, 183, 0, 0.1)',
            border: '1px solid rgba(255, 183, 0, 0.4)',
            borderRadius: '14px',
            padding: '20px 16px',
            textAlign: 'center',
            marginBottom: '14px'
          }}>
            <ShieldAlert size={36} color="var(--color-amber)" style={{ marginBottom: '10px' }} />
            <h4 style={{ color: '#fff', fontSize: '16px', marginBottom: '6px', fontWeight: 'bold' }}>
              AWAITING MISSION START
            </h4>
            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', lineHeight: '1.5' }}>
              Your research squad is linked to Chernobyl Command. Tactical quest clues will activate as soon as admin control initiates the operation.
            </p>
          </div>
        )}

        {/* Mission Completed State Banner */}
        {clueFinished && (
          <div style={{
            background: 'rgba(57, 255, 20, 0.1)',
            border: '1px solid rgba(57, 255, 20, 0.5)',
            borderRadius: '14px',
            padding: '20px 16px',
            textAlign: 'center',
            marginBottom: '14px'
          }}>
            <CheckCircle2 size={42} color="var(--color-neon-green)" style={{ marginBottom: '10px', filter: 'drop-shadow(0 0 12px #39ff14)' }} />
            <h4 style={{ color: '#39ff14', fontSize: '18px', marginBottom: '6px', fontWeight: 'bold' }}>
              ALL 5 OBJECTIVES CLEARED!
            </h4>
            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)', lineHeight: '1.5' }}>
              Congratulations, Operator! All 5 tactical clues resolved and sector supplies secured. Return to base terminal for debriefing.
            </p>
          </div>
        )}

        {/* Render 5 Quest Node Cards with Clues directly inside! */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', position: 'relative' }}>
          
          {/* Vertical Path Line */}
          <div style={{
            position: 'absolute',
            top: '24px',
            bottom: '24px',
            left: '21px',
            width: '3px',
            background: 'linear-gradient(to bottom, #39ff14, #00e5ff, rgba(255,255,255,0.1))',
            zIndex: 1,
            borderRadius: '2px'
          }} />

          {(pathSummary.length > 0 ? pathSummary : Array.from({ length: 5 }).map((_, i) => ({
            stepIndex: i + 1,
            clueText: "Locate designated tactical anomaly.",
            status: i === 0 && !isNotStarted ? 'active' : 'locked',
            rewardItem: { name: 'Item', icon: '🎁', description: '' }
          }))).map((node, idx) => {
            const isCleared = node.status === 'cleared';
            const isActive = node.status === 'active' && !isNotStarted;
            const isLocked = node.status === 'locked' || isNotStarted;

            return (
              <div
                key={idx}
                style={{
                  position: 'relative',
                  zIndex: 2,
                  borderRadius: '14px',
                  background: isCleared
                    ? 'rgba(57, 255, 20, 0.06)'
                    : isActive
                    ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.95), rgba(15, 23, 42, 0.98))'
                    : 'rgba(15, 23, 42, 0.4)',
                  border: isCleared
                    ? '1px solid rgba(57, 255, 20, 0.35)'
                    : isActive
                    ? '2px solid var(--color-neon-green)'
                    : '1px solid rgba(255, 255, 255, 0.08)',
                  backdropFilter: 'blur(12px)',
                  padding: '14px',
                  transition: 'all 0.3s ease',
                  boxShadow: isActive
                    ? '0 0 24px rgba(57, 255, 20, 0.25), 0 8px 32px rgba(0,0,0,0.6)'
                    : isCleared
                    ? '0 0 12px rgba(57, 255, 20, 0.1)'
                    : 'none'
                }}
              >
                {/* Node Card Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: isActive ? '10px' : '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {/* Node Badge */}
                    <div style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      fontSize: '11px',
                      fontWeight: 'bold',
                      background: isCleared ? '#39ff14' : isActive ? '#39ff14' : 'rgba(255, 255, 255, 0.1)',
                      color: isCleared ? '#000' : isActive ? '#000' : '#888',
                      boxShadow: isCleared ? '0 0 10px #39ff14' : isActive ? '0 0 12px #39ff14' : 'none'
                    }}>
                      {isCleared ? (
                        <Check size={14} color="#000" strokeWidth={3} />
                      ) : isActive ? (
                        idx + 1
                      ) : (
                        <Lock size={11} color="#777" />
                      )}
                    </div>

                    {/* Objective Title */}
                    <span style={{
                      fontSize: '11px',
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 'bold',
                      letterSpacing: '1px',
                      color: isCleared ? '#39ff14' : isActive ? '#39ff14' : 'rgba(255,255,255,0.4)',
                      textTransform: 'uppercase'
                    }}>
                      {isCleared ? `OBJECTIVE ${idx + 1} CLEARED` : isActive ? `ACTIVE OBJECTIVE ${idx + 1}` : `OBJECTIVE ${idx + 1} (LOCKED)`}
                    </span>
                  </div>

                  {/* Reward Item Badge */}
                  <div
                    onClick={() => isCleared && setSelectedItemModal(node.rewardItem)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '3px 8px',
                      borderRadius: '12px',
                      background: isCleared ? 'rgba(57, 255, 20, 0.2)' : 'rgba(255,255,255,0.05)',
                      border: isCleared ? '1px solid rgba(57, 255, 20, 0.4)' : '1px solid rgba(255,255,255,0.08)',
                      cursor: isCleared ? 'pointer' : 'default'
                    }}
                  >
                    <span style={{ fontSize: '13px' }}>{node.rewardItem?.icon || '🎁'}</span>
                    <span style={{
                      fontSize: '9px',
                      color: isCleared ? '#39ff14' : 'rgba(255,255,255,0.4)',
                      fontWeight: isCleared ? 'bold' : 'normal'
                    }}>
                      {isCleared ? node.rewardItem?.name : 'Supply Reward'}
                    </span>
                  </div>
                </div>

                {/* ACTIVE NODE: Full Prominent Clue Box & Direct Scan Action */}
                {isActive && (
                  <div style={{ marginTop: '8px' }}>
                    <div style={{
                      position: 'relative',
                      background: 'rgba(4, 16, 18, 0.85)',
                      border: '1px solid rgba(57, 255, 20, 0.3)',
                      borderRadius: '10px',
                      padding: '14px 16px',
                      marginBottom: '12px'
                    }}>
                      <div style={{
                        position: 'absolute',
                        top: '-12px',
                        left: '12px',
                        background: '#39ff14',
                        color: '#000',
                        fontSize: '9px',
                        fontWeight: 'bold',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontFamily: 'var(--font-mono)',
                        letterSpacing: '1px'
                      }}>
                        TACTICAL CLUE TEXT
                      </div>

                      {isLoadingClue && !node.clueText && !cluePayload?.text ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0', opacity: 0.85 }}>
                          <div style={{
                            width: '12px', height: '12px', borderRadius: '50%',
                            border: '2px solid #39ff14', borderTopColor: 'transparent',
                            animation: 'spin 0.8s linear infinite', flexShrink: 0
                          }} />
                          <span style={{ fontSize: '12px', color: '#39ff14', fontFamily: 'var(--font-mono)' }}>
                            DECRYPTING TACTICAL INTEL...
                          </span>
                        </div>
                      ) : (
                        <p style={{
                          margin: 0,
                          fontSize: '14px',
                          lineHeight: '1.65',
                          color: '#ffffff',
                          fontWeight: '500',
                          fontFamily: 'var(--font-sans)',
                          letterSpacing: '0.2px',
                          textShadow: '0 1px 8px rgba(0,0,0,0.6)'
                        }}>
                          {node.clueText || cluePayload?.text || 'Locate the designated sector objective and capture a verification photo.'}
                        </p>
                      )}
                    </div>

                    {/* Direct Scan Trigger Button inside Active Node Box */}
                    <button
                      type="button"
                      className="hud-scan-btn"
                      disabled={!canScan}
                      onClick={() => canScan && setIsScanning(true)}
                      style={{
                        margin: 0,
                        width: '100%',
                        padding: '12px',
                        fontSize: '13px',
                        background: '#39ff14',
                        color: '#000',
                        fontWeight: 'bold',
                        border: 'none',
                        borderRadius: '10px',
                        boxShadow: '0 0 16px rgba(57, 255, 20, 0.4)'
                      }}
                    >
                      <Scan size={18} />
                      [ SCAN TARGET LOCATION PHOTO ]
                    </button>
                  </div>
                )}

                {/* CLEARED NODE: Summary Banner */}
                {isCleared && (
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <CheckCircle2 size={12} color="#39ff14" />
                    <span>Location photo verified. Earned squad resource: <strong style={{ color: '#39ff14' }}>{node.rewardItem?.name}</strong> ({node.rewardItem?.icon})</span>
                  </div>
                )}

                {/* LOCKED NODE: Lock Explanation */}
                {isLocked && (
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', marginTop: '2px' }}>
                    Complete Objective {idx} to decrypt tactical clue.
                  </div>
                )}

              </div>
            );
          })}
        </div>
      </div>

      {/* Item Detail Modal */}
      {selectedItemModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 100,
          background: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.98), rgba(15, 23, 42, 0.99))',
            border: '1px solid rgba(57, 255, 20, 0.4)',
            borderRadius: '16px',
            padding: '20px',
            maxWidth: '320px',
            width: '100%',
            textAlign: 'center',
            boxShadow: '0 0 30px rgba(57, 255, 20, 0.2)'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '10px' }}>{selectedItemModal.icon}</div>
            <h3 style={{ fontSize: '18px', color: '#39ff14', marginBottom: '4px' }}>{selectedItemModal.name}</h3>
            <div style={{ fontSize: '10px', color: 'var(--color-accent)', fontFamily: 'var(--font-mono)', marginBottom: '12px', textTransform: 'uppercase' }}>
              UNLOCKED SQUAD RESOURCE
            </div>
            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.85)', marginBottom: '16px', lineHeight: '1.4' }}>
              {selectedItemModal.description}
            </p>
            <button
              onClick={() => setSelectedItemModal(null)}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '8px',
                background: '#39ff14',
                color: '#000',
                fontWeight: 'bold',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              CLOSE ITEM INTEL
            </button>
          </div>
        </div>
      )}

      {/* Squad Inventory Drawer */}
      {showInventoryDrawer && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 90,
          background: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(12px)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end'
        }}>
          <div style={{
            background: 'linear-gradient(180deg, rgba(30, 41, 59, 0.98), rgba(15, 23, 42, 0.99))',
            borderTop: '2px solid rgba(57, 255, 20, 0.5)',
            borderTopLeftRadius: '20px',
            borderTopRightRadius: '20px',
            padding: '20px',
            maxHeight: '80vh',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Package color="var(--color-neon-green)" size={20} />
                <h3 style={{ color: '#fff', fontSize: '16px', margin: 0 }}>SQUAD INVENTORY ({inventory.length}/5)</h3>
              </div>
              <button
                onClick={() => setShowInventoryDrawer(false)}
                style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {inventory.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px 0', color: 'rgba(255,255,255,0.5)', fontSize: '13px' }}>
                No items collected yet. Clear campus objectives to earn squad items & resources!
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(1, 1fr)', gap: '10px' }}>
                {inventory.map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => setSelectedItemModal(item)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '10px 14px',
                      borderRadius: '12px',
                      background: 'rgba(57, 255, 20, 0.08)',
                      border: '1px solid rgba(57, 255, 20, 0.3)',
                      cursor: 'pointer'
                    }}
                  >
                    <span style={{ fontSize: '28px' }}>{item.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#fff' }}>{item.name}</div>
                      <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)', marginTop: '2px' }}>{item.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* HUD Bottom Navigation Bar */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: '62px',
        zIndex: 85,
        background: 'linear-gradient(180deg, rgba(3, 15, 20, 0.95), rgba(1, 8, 12, 0.99))',
        borderTop: `1px solid ${systemState.testDevMode ? '#ffaa00' : 'rgba(57, 255, 20, 0.4)'}`,
        backdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        padding: '0 10px',
        boxShadow: systemState.testDevMode ? '0 -4px 20px rgba(255, 170, 0, 0.25)' : '0 -4px 20px rgba(57, 255, 20, 0.15)'
      }}>
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#39ff14',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '3px',
            fontSize: '10px',
            fontFamily: 'var(--font-mono)',
            cursor: 'pointer'
          }}
        >
          <Compass size={18} />
          <span>OBJECTIVES</span>
        </button>

        <button
          onClick={() => canScan && setIsScanning(true)}
          disabled={!canScan}
          style={{
            background: canScan ? '#39ff14' : 'rgba(255,255,255,0.1)',
            color: canScan ? '#000' : 'rgba(255,255,255,0.4)',
            border: 'none',
            borderRadius: '20px',
            padding: '8px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '12px',
            fontWeight: 'bold',
            fontFamily: 'var(--font-mono)',
            cursor: canScan ? 'pointer' : 'not-allowed',
            boxShadow: canScan ? '0 0 12px rgba(57, 255, 20, 0.5)' : 'none'
          }}
        >
          <Scan size={16} />
          <span>SCAN</span>
        </button>

        <button
          onClick={() => setShowInventoryDrawer(true)}
          style={{
            background: 'transparent',
            border: 'none',
            color: inventory.length > 0 ? '#39ff14' : 'rgba(255,255,255,0.6)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '3px',
            fontSize: '10px',
            fontFamily: 'var(--font-mono)',
            cursor: 'pointer'
          }}
        >
          <Package size={18} />
          <span>GEAR ({inventory.length})</span>
        </button>

        {systemState.testDevMode && (
          <button
            onClick={() => setShowReportModal(true)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#ffaa00',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '3px',
              fontSize: '10px',
              fontFamily: 'var(--font-mono)',
              cursor: 'pointer'
            }}
          >
            <ShieldAlert size={18} color="#ffaa00" />
            <span>REPORT</span>
          </button>
        )}
      </div>

      {/* Test Mode / Feedback Issue Report Modal (Only available in Test Dev Mode) */}
      {showReportModal && systemState.testDevMode && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 110,
          background: 'rgba(0, 0, 0, 0.88)',
          backdropFilter: 'blur(12px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.98), rgba(30, 41, 59, 0.99))',
            border: `1px solid ${systemState.testDevMode ? '#ffaa00' : '#00e5ff'}`,
            borderRadius: '16px',
            padding: '22px',
            maxWidth: '380px',
            width: '100%',
            fontFamily: 'var(--font-mono)',
            boxShadow: `0 0 30px ${systemState.testDevMode ? 'rgba(255, 170, 0, 0.3)' : 'rgba(0, 229, 255, 0.3)'}`
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: systemState.testDevMode ? '#ffaa00' : '#00e5ff' }}>
                <ShieldAlert size={20} />
                <h3 style={{ fontSize: '15px', margin: 0 }}>SUBMIT TEST REPORT</h3>
              </div>
              <button onClick={() => setShowReportModal(false)} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            {reportSuccess ? (
              <div style={{ textAlign: 'center', padding: '20px 0', color: '#39ff14' }}>
                <CheckCircle2 size={36} style={{ margin: '0 auto 10px' }} />
                <div style={{ fontSize: '14px', fontWeight: 'bold' }}>REPORT RECEIVED</div>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)', marginTop: '4px' }}>Logged to Admin Dashboard live feed.</div>
              </div>
            ) : (
              <form onSubmit={handleSendReport}>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', display: 'block', marginBottom: '4px' }}>
                    ISSUE CATEGORY:
                  </label>
                  <select
                    value={reportCategory}
                    onChange={(e) => setReportCategory(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px',
                      background: '#020d10',
                      color: '#00e5ff',
                      border: '1px solid rgba(0, 229, 255, 0.4)',
                      borderRadius: '6px',
                      fontFamily: 'inherit',
                      fontSize: '12px'
                    }}
                  >
                    <option value="clue_discrepancy">Clue Text / Location Discrepancy</option>
                    <option value="coordinate_error">GPS Coordinate Mismatch</option>
                    <option value="ml_false_rejection">ML Scan False Rejection</option>
                    <option value="ui_lag">UI Lag or Delay</option>
                    <option value="other">Other Feedback</option>
                  </select>
                </div>

                <div style={{ marginBottom: '14px' }}>
                  <label style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', display: 'block', marginBottom: '4px' }}>
                    DESCRIPTION / FEEDBACK DETAILS:
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={reportMessage}
                    onChange={(e) => setReportMessage(e.target.value)}
                    placeholder="Describe any discrepancy, ML rejection, or location feedback..."
                    style={{
                      width: '100%',
                      padding: '10px',
                      background: '#020d10',
                      color: '#fff',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '6px',
                      fontFamily: 'inherit',
                      fontSize: '12px',
                      resize: 'none'
                    }}
                  />
                </div>

                <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', marginBottom: '14px' }}>
                  GPS: {gpsCoords ? `${gpsCoords.lat.toFixed(4)}, ${gpsCoords.lng.toFixed(4)}` : 'N/A'} | Target: {cluePayload?.pathSummary?.[cluePayload?.step - 1]?.locationName || 'Current Clue'}
                </div>

                <button
                  type="submit"
                  disabled={reportSubmitting}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '8px',
                    background: systemState.testDevMode ? '#ffaa00' : '#00e5ff',
                    color: '#000',
                    fontWeight: 'bold',
                    border: 'none',
                    fontFamily: 'inherit',
                    cursor: reportSubmitting ? 'not-allowed' : 'pointer'
                  }}
                >
                  {reportSubmitting ? 'TRANSMITTING REPORT...' : 'SUBMIT REPORT TO ADMIN'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════ DIRECT IN-HUD SCANNER OVERLAY ═══════════════ */}
      {isScanning && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          background: 'var(--color-bg, #002729)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          <div className="hazard-bar" />
          <ScanComponent
            API_BASE={API_BASE}
            token={token}
            onAbort={() => {
              setIsScanning(false);
              fetchCurrentClue();
              if (window.location.hash === '#scan') {
                window.location.hash = '#hud';
              }
            }}
          />
        </div>
      )}

    </div>
  );
};

export default HUD;
