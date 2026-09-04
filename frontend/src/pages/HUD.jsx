import React, { useEffect, useMemo, useState } from 'react';
import { FileText, LayoutGrid, LogOut, Map, MessageSquare, Radio, Scan, Trophy } from 'lucide-react';
import { getSocket } from '../socket';

const HUD = ({ API_BASE, operatorName, teamInfo, token, onNavigate, onLogout }) => {
  const [radiation, setRadiation] = useState(0.15);
  const [currentClue, setCurrentClue] = useState(null);
  const [clueFinished, setClueFinished] = useState(false);
  const [isLoadingClue, setIsLoadingClue] = useState(true);
  const [activeTab, setActiveTab] = useState('hud');
  const [chatOpen, setChatOpen] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);
  const [localTeam, setLocalTeam] = useState(teamInfo);
  const [elapsedMs, setElapsedMs] = useState(teamInfo?.timerAccumulatedMs || 0);
  const [liveLocation, setLiveLocation] = useState(teamInfo?.location || null);

  useEffect(() => {
    setLocalTeam(teamInfo);
    setLiveLocation(teamInfo?.location || null);
  }, [teamInfo]);

  // Simulated radiation fluctuation
  useEffect(() => {
    const interval = setInterval(() => {
      setRadiation((prev) => {
        const change = (Math.random() - 0.5) * 0.02;
        return Number(Math.max(0.12, Math.min(0.18, prev + change)).toFixed(2));
      });
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Fetch current clue
  useEffect(() => {
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

    const fetchCurrentClue = async () => {
      setIsLoadingClue(true);
      try {
        const response = await fetch(`${API_BASE}/clues/current`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) return;
        const data = await response.json();
        if (data.finished) {
          setClueFinished(true);
          setCurrentClue(null);
        } else {
          setClueFinished(false);
          setCurrentClue(data);
        }
      } finally {
        setIsLoadingClue(false);
      }
    };

    fetchCurrentClue();
  }, [API_BASE, token, localTeam?.currentClueIndex, localTeam?.status]);

  // Timer
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

  // Geolocation reporting
  useEffect(() => {
    if (!token || !localTeam || localTeam.status !== 'in_progress' || !navigator.geolocation) return;
    const watchId = navigator.geolocation.watchPosition(
      async (position) => {
        const nextLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          updatedAt: new Date().toISOString(),
        };
        setLiveLocation(nextLocation);
        try {
          await fetch(`${API_BASE}/teams/location`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ lat: nextLocation.lat, lng: nextLocation.lng }),
          });
        } catch { /* ignore */ }
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, [API_BASE, token, localTeam?.status]);

  // Socket listeners
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
    const handleLocation = (payload) => {
      if (String(payload.teamId) !== String(teamId)) return;
      setLiveLocation({ lat: payload.lat, lng: payload.lng, updatedAt: payload.updatedAt });
    };
    const handleLeaderboard = (payload) => {
      setLeaderboard(payload);
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
          location: ownEntry.location || prev?.location,
        }));
      }
    };

    socket.on('team:status', handleStatus);
    socket.on('team:timer', handleTimer);
    socket.on('team:location', handleLocation);
    socket.on('leaderboard:snapshot', handleLeaderboard);

    return () => {
      socket.off('team:status', handleStatus);
      socket.off('team:timer', handleTimer);
      socket.off('team:location', handleLocation);
      socket.off('leaderboard:snapshot', handleLeaderboard);
    };
  }, [API_BASE, localTeam?.id, localTeam?._id]);

  const formatElapsed = (ms) => {
    const totalSeconds = Math.floor(ms / 1000);
    const seconds = totalSeconds % 60;
    const minutes = Math.floor(totalSeconds / 60) % 60;
    const hours = Math.floor(totalSeconds / 3600);
    return [hours, minutes, seconds].map((v) => String(v).padStart(2, '0')).join(':');
  };

  const myRank = useMemo(() => {
    const teamId = localTeam?.id || localTeam?._id;
    const index = leaderboard.findIndex((entry) => String(entry.teamId) === String(teamId));
    return index >= 0 ? index + 1 : '--';
  }, [leaderboard, localTeam]);

  const isNotStarted = localTeam?.status === 'not_started';

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 0 }}>
      {/* Hazard Warning Bar Top */}
      <div className="hazard-bar" />

      {/* ═══════════════════════════════════════════
          HEADER — Classified / Chernobyl style
      ═══════════════════════════════════════════ */}
      <div className="stalker-header">
        <div className="net-info">
          <div className="net-name" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>CHERNOBYL-TRSHNT V2.1</span>
            <span className="red-stamp-mini" style={{ fontSize: '0.55rem', padding: '0 0.2rem' }}>CONFIDENTIAL</span>
          </div>
          <div className="operator-info">
            OPERATOR: {operatorName} // {localTeam?.name || 'UNASSIGNED'}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div className="rank-badge">RANK: #{myRank}</div>
          <div className="header-icons">
            <MessageSquare
              size={15}
              style={{ cursor: 'pointer', color: chatOpen ? 'var(--color-neon-green)' : 'var(--color-accent)' }}
              onClick={() => setChatOpen((prev) => !prev)}
            />
            <LogOut
              size={15}
              style={{ cursor: 'pointer', color: 'var(--color-accent)' }}
              onClick={onLogout}
            />
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════
          SCROLL AREA
      ═══════════════════════════════════════════ */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px', display: 'flex', flexDirection: 'column' }}>

        {/* COMMS Panel */}
        {chatOpen && (
          <div style={{
            border: '1px solid rgba(57, 255, 20, 0.25)',
            padding: '10px 12px',
            marginBottom: '12px',
            background: 'rgba(0, 20, 22, 0.9)',
          }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--color-amber)', marginBottom: '6px', letterSpacing: '1px' }}>
              SECURE_COMMS_LINK: ACTIVE
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--color-text)', lineHeight: 1.5 }}>
              [COMMAND]: Team QR is linked. Wait for admin start or continue current mission.
            </div>
          </div>
        )}

        {/* ════ HUD TAB ════ */}
        {activeTab === 'hud' && (
          <>
            {/* Radiation Telemetry */}
            <div className="hud-telemetry" style={{ marginTop: '8px' }}>
              <div className="telemetry-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="telemetry-label">☢ RADIATION LEVEL</span>
                  <span className="telemetry-value glow-text">{radiation} mSv/h</span>
                </div>
                <div className="telemetry-bar-container">
                  <div className="telemetry-bar-fill" style={{ width: `${(radiation / 0.3) * 100}%` }} />
                </div>
              </div>
            </div>

            {/* Clue Panel */}
            <div className="clue-panel">
              {isNotStarted ? (
                <div style={{ padding: '20px 10px', textAlign: 'center' }}>
                  <div style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: '13px',
                    letterSpacing: '2px',
                    color: 'var(--color-amber)',
                    textShadow: '0 0 6px var(--color-amber-glow)',
                    marginBottom: '12px',
                    textTransform: 'uppercase',
                  }}>
                    DEPLOYMENT_LOCKED
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', lineHeight: 1.7, color: 'var(--color-text)' }}>
                    Team linked successfully. The mission timer will start from 00:00:00 when an admin starts the run.
                  </div>
                  <div style={{ marginTop: '12px', fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'rgba(155,168,168,0.4)' }}>
                    RAD_LVL: <span className="glow-text">3.6R/hr</span> // STATUS: STANDING_BY
                  </div>
                </div>
              ) : clueFinished ? (
                <div style={{ padding: '20px 10px', textAlign: 'center' }}>
                  <div style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: '16px',
                    letterSpacing: '2px',
                    color: 'var(--color-neon-green)',
                    textShadow: '0 0 10px var(--color-green-glow)',
                    marginBottom: '10px',
                    textTransform: 'uppercase',
                  }}>
                    ALL OBJECTIVES SECURED
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--color-text)' }}>
                    SCORE: <span className="glow-text">{localTeam?.score} PTS</span>
                  </div>
                </div>
              ) : isLoadingClue ? (
                <div style={{ padding: '20px 10px', textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--color-accent)' }}>
                  RETRIEVING CLUE DATA...
                </div>
              ) : (
                <>
                  <button className="cyber-btn striped" style={{ marginBottom: '14px', fontSize: '10px', padding: '9px' }}>
                    <Radio size={11} /> DATA_CORE_ACTIVE // CLUE_{(localTeam?.currentClueIndex || 0) + 1}
                  </button>

                  <div className="clue-header">_ACTIVE_CLUE:</div>
                  <div className="clue-title">"{currentClue?.title}"</div>

                  <div className="clue-body-box">
                    <div className="clue-body-corners" />
                    {currentClue?.text}
                    {currentClue?.hint && (
                      <div style={{ fontSize: '10px', color: 'var(--color-amber)', marginTop: '10px', lineHeight: 1.5 }}>
                        <strong style={{ color: 'var(--color-amber)', fontFamily: 'var(--font-serif)', letterSpacing: '1px' }}>HINT:</strong> {currentClue.hint}
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Mission Timer */}
              <div className="mission-expiry-section">
                <span className="expiry-label">MISSION_TIMER</span>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                  <span style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '8px',
                    letterSpacing: '1px',
                    color: localTeam?.timerRunning ? 'var(--color-neon-green)' : 'var(--color-amber)',
                    textShadow: localTeam?.timerRunning ? '0 0 4px var(--color-green-glow)' : 'none',
                    marginBottom: '2px',
                  }}>
                    {localTeam?.timerRunning ? '● LIVE' : '■ STOPPED'}
                  </span>
                  <span className="expiry-time">{formatElapsed(elapsedMs)}</span>
                </div>
              </div>
            </div>

            {/* Leaderboard Card */}
            <div className="telemetry-card" style={{ marginTop: '8px' }}>
              <div className="telemetry-label" style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Trophy size={12} style={{ color: 'var(--color-amber)' }} />
                LIVE LEADERBOARD
              </div>
              <div style={{ display: 'grid', gap: '6px' }}>
                {leaderboard.slice(0, 5).map((entry, index) => (
                  <div key={entry.teamId} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '10px',
                    borderBottom: '1px solid rgba(57,255,20,0.07)',
                    paddingBottom: '4px',
                  }}>
                    <span style={{ color: index === 0 ? 'var(--color-amber)' : 'var(--color-text)' }}>
                      {index + 1}. {entry.name}
                    </span>
                    <span style={{ color: 'var(--color-accent)' }}>
                      {entry.score} pts / {formatElapsed(entry.elapsedMs)}
                    </span>
                  </div>
                ))}
                {leaderboard.length === 0 && (
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'rgba(155,168,168,0.4)' }}>
                    AWAITING LEADERBOARD DATA...
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* ════ MAP TAB ════ */}
        {activeTab === 'map' && (
          <div className="clue-panel" style={{ flex: 1, marginTop: '8px' }}>
            <div className="clue-header">MAP_MODULE: LIVE_POSITION</div>
            <div className="clue-title">
              {liveLocation ? 'LIVE GPS LOCKED' : 'WAITING FOR GPS LOCK'}
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', lineHeight: '2', color: 'var(--color-text)' }}>
              <div>LAT: <span className="glow-text">{liveLocation?.lat?.toFixed?.(6) || 'PENDING'}</span></div>
              <div>LNG: <span className="glow-text">{liveLocation?.lng?.toFixed?.(6) || 'PENDING'}</span></div>
              <div style={{ color: 'var(--color-accent)' }}>
                UPDATED: {liveLocation?.updatedAt ? new Date(liveLocation.updatedAt).toLocaleTimeString() : 'PENDING'}
              </div>
            </div>
          </div>
        )}

        {/* ════ LOGS TAB ════ */}
        {activeTab === 'logs' && (
          <div className="clue-panel" style={{ flex: 1, marginTop: '8px' }}>
            <div className="clue-header">SYS_LOGS: LIVE_STATE</div>
            <div style={{ display: 'grid', gap: '8px', fontFamily: 'var(--font-mono)', fontSize: '10px' }}>
              {[
                ['TEAM_STATUS', localTeam?.status || 'UNKNOWN', localTeam?.status === 'in_progress' ? 'var(--color-neon-green)' : 'var(--color-amber)'],
                ['TIMER_STATE', localTeam?.timerRunning ? 'RUNNING' : 'STOPPED', localTeam?.timerRunning ? 'var(--color-neon-green)' : 'var(--color-amber)'],
                ['CLUE_INDEX', String(localTeam?.currentClueIndex ?? 0), 'var(--color-text)'],
                ['SCORE', `${localTeam?.score ?? 0} PTS`, 'var(--color-text)'],
              ].map(([label, value, color]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(57,255,20,0.08)', paddingBottom: '6px' }}>
                  <span style={{ color: 'var(--color-accent)' }}>{label}:</span>
                  <span style={{ color, fontWeight: 'bold' }}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════
          BOTTOM NAV BAR
      ═══════════════════════════════════════════ */}
      <div className="hud-nav-bar">
        <div
          className="nav-tab"
          onClick={() => !isNotStarted && !clueFinished && onNavigate('scan')}
          style={{ opacity: (isNotStarted || clueFinished) ? 0.3 : 1 }}
        >
          <Scan size={17} />
          <span>SCAN</span>
        </div>
        <div className={`nav-tab ${activeTab === 'map' ? 'active' : ''}`} onClick={() => setActiveTab('map')}>
          <Map size={17} />
          <span>MAP</span>
        </div>
        <div className={`nav-tab ${activeTab === 'logs' ? 'active' : ''}`} onClick={() => setActiveTab('logs')}>
          <FileText size={17} />
          <span>LOGS</span>
        </div>
        <div className={`nav-tab ${activeTab === 'hud' ? 'active' : ''}`} onClick={() => setActiveTab('hud')}>
          <LayoutGrid size={17} />
          <span>HUD</span>
        </div>
      </div>
    </div>
  );
};

export default HUD;
