import React, { useEffect, useState } from 'react';
import { LogOut, Scan, Clock, ShieldAlert, Award, Compass, CheckCircle2 } from 'lucide-react';
import { getSocket } from '../socket';

const HUD = ({ API_BASE, operatorName, teamInfo, token, onNavigate, onLogout }) => {
  const [currentClue, setCurrentClue] = useState(null);
  const [clueFinished, setClueFinished] = useState(false);
  const [isLoadingClue, setIsLoadingClue] = useState(true);
  const [localTeam, setLocalTeam] = useState(teamInfo);
  const [elapsedMs, setElapsedMs] = useState(teamInfo?.timerAccumulatedMs || 0);

  useEffect(() => {
    setLocalTeam(teamInfo);
  }, [teamInfo]);

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
        try {
          await fetch(`${API_BASE}/teams/location`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ lat: position.coords.latitude, lng: position.coords.longitude }),
          });
        } catch { /* ignore */ }
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

    socket.on('team:status', handleStatus);
    socket.on('team:timer', handleTimer);
    socket.on('leaderboard:snapshot', handleLeaderboard);

    return () => {
      socket.off('team:status', handleStatus);
      socket.off('team:timer', handleTimer);
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

  const isNotStarted = localTeam?.status === 'not_started';
  const canScan = !isNotStarted && !clueFinished;

  const currentStep = currentClue?.step || (localTeam?.currentClueIndex || 0) + 1;
  const totalSteps = currentClue?.total || 10;
  const progressPercent = Math.min(100, Math.max(0, (currentStep / Math.max(1, totalSteps)) * 100));

  return (
    <div className="hud-shell">
      {/* Top Bar: Squad Operator Profile */}
      <header className="hud-top">
        <div>
          <div className="hud-kicker">
            <span style={{
              width: '7px', height: '7px', borderRadius: '50%',
              background: localTeam?.timerRunning ? '#39ff14' : '#ffb700',
              boxShadow: localTeam?.timerRunning ? '0 0 8px #39ff14' : '0 0 8px #ffb700'
            }} />
            {localTeam?.timerRunning ? 'LIVE_UPLINK' : 'STANDBY_MODE'} // CHERNOBYL-NET
          </div>
          <div className="hud-operator">
            {operatorName} <span style={{ color: 'var(--color-accent)', fontWeight: '400' }}>({localTeam?.name || 'Unassigned Squad'})</span>
          </div>
        </div>

        <button type="button" className="hud-icon-btn" onClick={onLogout} aria-label="Sign out" title="Abort Session">
          <LogOut size={16} />
        </button>
      </header>

      {/* Telemetry Scroll Container */}
      <div className="hud-scroll">
        
        {/* Telemetry Stats Grid */}
        <div className="hud-telemetry-grid">
          {/* Mission Timer Widget */}
          <div className="hud-timer-card">
            <div className="hud-widget-label">
              <Clock size={12} color="var(--color-neon-green)" /> Mission Clock
            </div>
            <div className="hud-widget-val">
              {formatElapsed(elapsedMs)}
            </div>
            <div style={{ fontSize: '9px', color: 'rgba(155, 168, 168, 0.6)', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>
              {localTeam?.timerRunning ? 'STATUS: TICKING' : 'STATUS: PAUSED'}
            </div>
          </div>

          {/* Mission Progress Widget */}
          <div className="hud-progress-card">
            <div className="hud-widget-label">
              <Compass size={12} color="var(--color-neon-green)" /> Clue Progress
            </div>
            <div className="hud-widget-val">
              {isNotStarted ? '0%' : clueFinished ? '100%' : `${Math.round(progressPercent)}%`}
            </div>
            <div className="telemetry-bar-container" style={{ marginTop: '6px' }}>
              <div className="telemetry-bar-fill" style={{ width: isNotStarted ? '0%' : clueFinished ? '100%' : `${progressPercent}%` }} />
            </div>
          </div>
        </div>

        {/* Main Tactical Clue Display Card */}
        <section className="hud-clue-card">
          <div className="hazard-bar" style={{ height: '8px' }} />

          <div className="hud-clue-card-header">
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--color-accent)', letterSpacing: '1.5px' }}>
              CLEARANCE LEVEL: OMEGA
            </div>
            <div className="hud-clue-badge">
              {isNotStarted ? 'WAITING' : clueFinished ? 'COMPLETED' : `CLUE ${currentStep} OF ${totalSteps}`}
            </div>
          </div>

          <div className="hud-clue-body">
            {/* Background reticle corners */}
            <div className="clue-body-corners" />

            {isNotStarted ? (
              <div style={{ textAlign: 'center', padding: '12px 0' }}>
                <ShieldAlert size={36} color="var(--color-amber)" style={{ marginBottom: '12px' }} />
                <h4 style={{ color: '#fff', fontSize: '16px', marginBottom: '8px', fontFamily: 'var(--font-sans)', fontWeight: 600 }}>
                  AWAITING MISSION START
                </h4>
                <p className="hud-copy" style={{ fontSize: '13px' }}>
                  Your research unit is linked to Chernobyl Command. The tactical clue stream will activate as soon as admin control initiates the operation.
                </p>
              </div>
            ) : clueFinished ? (
              <div style={{ textAlign: 'center', padding: '12px 0' }}>
                <CheckCircle2 size={40} color="var(--color-neon-green)" style={{ marginBottom: '12px', filter: 'drop-shadow(0 0 10px var(--color-neon-green))' }} />
                <h4 style={{ color: 'var(--color-neon-green)', fontSize: '18px', marginBottom: '8px', fontFamily: 'var(--font-sans)', fontWeight: 700 }}>
                  ALL OBJECTIVES CLEARED!
                </h4>
                <p className="hud-copy" style={{ fontSize: '13px' }}>
                  Congratulations, Operator. All sector anomalies located and submitted. Return to base terminal for debriefing and final rank evaluation.
                </p>
              </div>
            ) : isLoadingClue ? (
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <div className="telemetry-bar-container" style={{ width: '50%', margin: '0 auto 12px auto' }}>
                  <div className="telemetry-bar-fill" style={{ width: '100%', animation: 'radar-sweep 1.5s infinite linear' }} />
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--color-neon-green)', letterSpacing: '1px' }}>
                  DECRYPTING CLUE STREAM...
                </div>
              </div>
            ) : (
              <div style={{ position: 'relative' }}>
                {/* Quotation Icon Overlay */}
                <div style={{
                  position: 'absolute',
                  top: '-16px',
                  left: '-4px',
                  fontSize: '48px',
                  fontFamily: 'serif',
                  color: 'rgba(57, 255, 20, 0.08)',
                  pointerEvents: 'none',
                  userSelect: 'none'
                }}>
                  “
                </div>

                <p className="hud-clue-text">
                  {currentClue?.text}
                </p>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Primary Action Button: Open Scanner */}
      <button
        type="button"
        className="hud-scan-btn"
        disabled={!canScan}
        onClick={() => canScan && onNavigate('scan')}
      >
        <Scan size={20} />
        {canScan ? '[ INITIATE TACTICAL OPTIC SCAN ]' : '[ SCAN LOCKED ]'}
      </button>
    </div>
  );
};

export default HUD;

