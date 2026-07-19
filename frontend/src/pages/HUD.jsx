import React, { useEffect, useMemo, useState } from 'react';
import { FileText, LayoutGrid, LogOut, Map, MessageSquare, Radio, Scan, Trophy } from 'lucide-react';
import { getSocket } from '../socket';

const API_BASE = import.meta.env.VITE_API_BASE;

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

  useEffect(() => {
    const interval = setInterval(() => {
      setRadiation((prev) => {
        const change = (Math.random() - 0.5) * 0.02;
        return Number(Math.max(0.12, Math.min(0.18, prev + change)).toFixed(2));
      });
    }, 2000);
    return () => clearInterval(interval);
  }, []);

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
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ lat: nextLocation.lat, lng: nextLocation.lng }),
          });
        } catch {
          // ignore transient location sync failures
        }
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [API_BASE, token, localTeam?.status]);

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
      setLiveLocation({
        lat: payload.lat,
        lng: payload.lng,
        updatedAt: payload.updatedAt,
      });
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
    return [hours, minutes, seconds].map((value) => String(value).padStart(2, '0')).join(':');
  };

  const myRank = useMemo(() => {
    const teamId = localTeam?.id || localTeam?._id;
    const index = leaderboard.findIndex((entry) => String(entry.teamId) === String(teamId));
    return index >= 0 ? index + 1 : '--';
  }, [leaderboard, localTeam]);

  const isNotStarted = localTeam?.status === 'not_started';

  return (
    <div className="hud-page" style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 0 }}>
      <div className="stalker-header" style={{ padding: '16px' }}>
        <div className="net-info">
          <div className="net-name">STALKER_NET_V2.1</div>
          <div className="operator-info">OPERATOR: {operatorName} // {localTeam?.name || 'UNASSIGNED'}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div className="rank-badge">RANK: #{myRank}</div>
          <div className="header-icons">
            <MessageSquare size={16} style={{ cursor: 'pointer' }} onClick={() => setChatOpen((prev) => !prev)} />
            <LogOut size={16} style={{ cursor: 'pointer' }} onClick={onLogout} />
          </div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column' }}>
        {chatOpen && (
          <div style={{ border: '1px solid var(--cyan-primary)', padding: '10px', marginBottom: '10px', background: 'rgba(3,12,15,0.95)' }}>
            <div style={{ color: 'var(--amber-primary)', marginBottom: '6px' }}>SECURE_COMMS_LINK: ACTIVE</div>
            <div>[COMMAND]: Team QR is linked. Wait for admin start or continue current mission.</div>
          </div>
        )}

        {activeTab === 'hud' && (
          <>
            <div className="hud-telemetry" style={{ marginTop: '10px' }}>
              <div className="telemetry-card">
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span className="telemetry-label">RADIATION</span>
                  <span className="telemetry-value glow-text">{radiation} mSv/h</span>
                </div>
                <div className="telemetry-bar-container">
                  <div className="telemetry-bar-fill" style={{ width: `${(radiation / 0.3) * 100}%` }}></div>
                </div>
              </div>
            </div>

            <div className="clue-panel">
              {isNotStarted ? (
                <div style={{ padding: '20px 10px', textAlign: 'center' }}>
                  <div className="glow-text-amber" style={{ fontSize: '16px', marginBottom: '14px' }}>DEPLOYMENT_LOCKED</div>
                  <div style={{ fontSize: '12px', lineHeight: '1.6' }}>
                    Team linked successfully. The mission timer will start from 00:00:00 when an admin starts the run.
                  </div>
                </div>
              ) : clueFinished ? (
                <div style={{ padding: '20px 10px', textAlign: 'center' }}>
                  <div className="glow-text-green" style={{ fontSize: '18px', marginBottom: '12px' }}>ALL OBJECTIVES SECURED</div>
                  <div>SCORE: {localTeam?.score} PTS</div>
                </div>
              ) : isLoadingClue ? (
                <div style={{ padding: '20px 10px', textAlign: 'center' }}>RETRIEVING CLUE DATA...</div>
              ) : (
                <>
                  <button className="cyber-btn striped" style={{ marginBottom: '16px', fontSize: '11px', padding: '10px' }}>
                    <Radio size={12} /> DATA_CORE_ACTIVE // CLUE_{(localTeam?.currentClueIndex || 0) + 1}
                  </button>

                  <div className="clue-header">_ACTIVE_CLUE:</div>
                  <div className="clue-title">"{currentClue?.title}"</div>

                  <div className="clue-body-box">
                    <div className="clue-body-corners"></div>
                    {currentClue?.text}
                    {currentClue?.hint && (
                      <div style={{ fontSize: '10px', color: 'var(--amber-primary)', marginTop: '12px' }}>
                        <strong>HINT:</strong> {currentClue.hint}
                      </div>
                    )}
                  </div>
                </>
              )}

              <div className="mission-expiry-section">
                <span className="expiry-label">MISSION_TIMER</span>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                  <span style={{ fontSize: '8px', color: localTeam?.timerRunning ? 'var(--green-primary)' : 'var(--amber-primary)' }}>
                    {localTeam?.timerRunning ? 'LIVE' : 'STOPPED'}
                  </span>
                  <span className="expiry-time">{formatElapsed(elapsedMs)}</span>
                </div>
              </div>
            </div>

            <div className="telemetry-card" style={{ marginTop: '10px' }}>
              <div className="telemetry-label" style={{ marginBottom: '10px' }}>
                <Trophy size={14} style={{ marginRight: '6px' }} />
                LIVE LEADERBOARD
              </div>
              <div style={{ display: 'grid', gap: '8px' }}>
                {leaderboard.slice(0, 5).map((entry, index) => (
                  <div key={entry.teamId} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                    <span>{index + 1}. {entry.name}</span>
                    <span>{entry.score} pts / {formatElapsed(entry.elapsedMs)}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {activeTab === 'map' && (
          <div className="clue-panel" style={{ flex: 1, marginTop: '10px' }}>
            <div className="clue-header">MAP_MODULE: LIVE_POSITION</div>
            <div className="clue-title">{liveLocation ? 'LIVE GPS LOCKED' : 'WAITING FOR GPS LOCK'}</div>
            <div style={{ fontSize: '12px', lineHeight: '1.8' }}>
              <div>LAT: {liveLocation?.lat?.toFixed?.(6) || 'PENDING'}</div>
              <div>LNG: {liveLocation?.lng?.toFixed?.(6) || 'PENDING'}</div>
              <div>UPDATED: {liveLocation?.updatedAt ? new Date(liveLocation.updatedAt).toLocaleTimeString() : 'PENDING'}</div>
            </div>
          </div>
        )}

        {activeTab === 'logs' && (
          <div className="clue-panel" style={{ flex: 1, marginTop: '10px' }}>
            <div className="clue-header">SYS_LOGS: LIVE_STATE</div>
            <div style={{ display: 'grid', gap: '8px', fontSize: '11px' }}>
              <div>TEAM_STATUS: {localTeam?.status || 'UNKNOWN'}</div>
              <div>TIMER_STATE: {localTeam?.timerRunning ? 'RUNNING' : 'STOPPED'}</div>
              <div>CLUE_INDEX: {localTeam?.currentClueIndex ?? 0}</div>
              <div>SCORE: {localTeam?.score ?? 0}</div>
            </div>
          </div>
        )}
      </div>

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
