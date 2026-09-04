import React, { useEffect, useState } from 'react';
import { LogOut, Scan } from 'lucide-react';
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

  return (
    <div className="hud-shell">
      <header className="hud-top">
        <div>
          <div className="hud-kicker">Chernobyl-trshnt</div>
          <div className="hud-operator">{operatorName} · {localTeam?.name || 'Unassigned'}</div>
        </div>
        <button type="button" className="hud-icon-btn" onClick={onLogout} aria-label="Sign out">
          <LogOut size={18} />
        </button>
      </header>

      <div className="hud-scroll">
        <div className="hud-timer-row">
          <span>{localTeam?.timerRunning ? 'Live' : 'Stopped'}</span>
          <strong>{formatElapsed(elapsedMs)}</strong>
        </div>

        <section className="hud-clue-card">
          {isNotStarted ? (
            <p className="hud-copy">Your team is linked. The first clue appears when an admin starts the run.</p>
          ) : clueFinished ? (
            <p className="hud-copy">All clues complete. Return to base and wait for debrief.</p>
          ) : isLoadingClue ? (
            <p className="hud-copy muted">Loading clue…</p>
          ) : (
            <>
              <div className="hud-clue-label">
                Clue {currentClue?.step || (localTeam?.currentClueIndex || 0) + 1}
                {currentClue?.total ? ` of ${currentClue.total}` : ''}
              </div>
              <p className="hud-clue-text">{currentClue?.text}</p>
            </>
          )}
        </section>
      </div>

      <button
        type="button"
        className="hud-scan-btn"
        disabled={!canScan}
        onClick={() => canScan && onNavigate('scan')}
      >
        <Scan size={20} />
        Scan
      </button>
    </div>
  );
};

export default HUD;
