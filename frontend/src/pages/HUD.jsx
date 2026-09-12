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
  ChevronRight,
  Zap,
  Coffee,
  Shield,
  Key,
  Gift,
  MapPin,
  X,
  Info,
  Award,
  Layers
} from 'lucide-react';
import { getSocket } from '../socket';

const HUD = ({ API_BASE, operatorName, teamInfo, token, onNavigate, onLogout }) => {
  const [cluePayload, setCluePayload] = useState(null);
  const [clueFinished, setClueFinished] = useState(false);
  const [isLoadingClue, setIsLoadingClue] = useState(true);
  const [localTeam, setLocalTeam] = useState(teamInfo);
  const [elapsedMs, setElapsedMs] = useState(teamInfo?.timerAccumulatedMs || 0);
  const [selectedItemModal, setSelectedItemModal] = useState(null);
  const [showInventoryDrawer, setShowInventoryDrawer] = useState(false);

  useEffect(() => {
    setLocalTeam(teamInfo);
  }, [teamInfo]);

  // Fetch full clue payload (includes 5-quest path summary & inventory)
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
        setCluePayload(data);
        if (data.finished) {
          setClueFinished(true);
        } else {
          setClueFinished(false);
        }
      } catch (err) {
        console.error("Error loading clue payload:", err);
      } finally {
        setIsLoadingClue(false);
      }
    };

    fetchCurrentClue();
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

  // Geolocation updates
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

  const pathSummary = cluePayload?.pathSummary || [];
  const inventory = cluePayload?.inventory || [];
  const currentStepNum = cluePayload?.step || (localTeam?.currentClueIndex || 0) + 1;
  const totalStepsNum = cluePayload?.total || 5;

  return (
    <div className="hud-shell" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      
      {/* Dynamic Header: Operator & Squad Status */}
      <header className="hud-top" style={{ flexShrink: 0 }}>
        <div>
          <div className="hud-kicker" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{
              width: '8px', height: '8px', borderRadius: '50%',
              background: localTeam?.timerRunning ? '#39ff14' : '#ffb700',
              boxShadow: localTeam?.timerRunning ? '0 0 10px #39ff14' : '0 0 10px #ffb700'
            }} />
            <span style={{ fontSize: '10px', letterSpacing: '1px', fontWeight: 'bold' }}>
              {localTeam?.timerRunning ? 'TACTICAL UPLINK' : 'STANDBY MODE'}
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
            title="Squad Inventory"
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

      {/* Gamified Top Stats Bar (Timer, Food, Hope, Score) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '6px',
        padding: '8px 12px',
        background: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        flexShrink: 0
      }}>
        {/* Stat 1: Timer */}
        <div style={{
          background: 'rgba(0, 0, 0, 0.35)',
          borderRadius: '8px',
          padding: '6px',
          textAlign: 'center',
          border: '1px solid rgba(57, 255, 20, 0.2)'
        }}>
          <div style={{ fontSize: '8px', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            ⏰ Clock
          </div>
          <div style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--color-neon-green)', fontFamily: 'var(--font-mono)' }}>
            {formatElapsed(elapsedMs)}
          </div>
        </div>

        {/* Stat 2: Route Name / Route ID */}
        <div style={{
          background: 'rgba(0, 0, 0, 0.35)',
          borderRadius: '8px',
          padding: '6px',
          textAlign: 'center',
          border: '1px solid rgba(255, 183, 0, 0.2)'
        }}>
          <div style={{ fontSize: '8px', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            🗺️ Route
          </div>
          <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#ffb700', fontFamily: 'var(--font-mono)' }}>
            {cluePayload?.routeName ? cluePayload.routeName : localTeam?.assignedRouteName || 'Route 1'}
          </div>
        </div>

        {/* Stat 3: Resources Inventory Count */}
        <div
          onClick={() => setShowInventoryDrawer(true)}
          style={{
            background: 'rgba(0, 0, 0, 0.35)',
            borderRadius: '8px',
            padding: '6px',
            textAlign: 'center',
            border: '1px solid rgba(0, 229, 255, 0.2)',
            cursor: 'pointer'
          }}
        >
          <div style={{ fontSize: '8px', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            🎒 Items
          </div>
          <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#00e5ff', fontFamily: 'var(--font-mono)' }}>
            {inventory.length} / 5
          </div>
        </div>

        {/* Stat 4: Points */}
        <div style={{
          background: 'rgba(0, 0, 0, 0.35)',
          borderRadius: '8px',
          padding: '6px',
          textAlign: 'center',
          border: '1px solid rgba(255, 0, 128, 0.2)'
        }}>
          <div style={{ fontSize: '8px', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            🏆 Score
          </div>
          <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#ff0080', fontFamily: 'var(--font-mono)' }}>
            {localTeam?.score || 0} pts
          </div>
        </div>
      </div>

      {/* Main Content Area: Gamified Route Map & Clue View */}
      <div className="hud-scroll" style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>

        {/* Sector Quest Ascent Map Section (Inspired by Duolingo Ascent + Isometric Road Nodes) */}
        <section style={{
          background: 'radial-gradient(circle at 50% 0%, rgba(30, 41, 59, 0.8), rgba(15, 23, 42, 0.95))',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          padding: '16px 12px',
          marginBottom: '14px',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)'
        }}>
          {/* Background Ambient Glow */}
          <div style={{
            position: 'absolute',
            top: '-40px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '180px',
            height: '180px',
            background: 'radial-gradient(circle, rgba(57, 255, 20, 0.15), transparent 70%)',
            pointerEvents: 'none'
          }} />

          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '14px',
            paddingBottom: '8px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Sparkles size={14} color="var(--color-neon-green)" />
              <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#fff', letterSpacing: '1px', textTransform: 'uppercase' }}>
                THE ASCENT PATH
              </span>
            </div>
            <span style={{ fontSize: '10px', color: 'var(--color-accent)', fontFamily: 'var(--font-mono)' }}>
              {isNotStarted ? '0 OF 5' : clueFinished ? '5 OF 5 CLEARED' : `QUEST ${currentStepNum} OF ${totalStepsNum}`}
            </span>
          </div>

          {/* Connected Path Nodes (5 Stops) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', position: 'relative' }}>
            
            {/* Connected Vertical Glow Line */}
            <div style={{
              position: 'absolute',
              top: '20px',
              bottom: '20px',
              left: '23px',
              width: '3px',
              background: 'linear-gradient(to bottom, #39ff14, #00e5ff, rgba(255,255,255,0.1))',
              zIndex: 1,
              borderRadius: '2px',
              boxShadow: '0 0 8px rgba(57, 255, 20, 0.4)'
            }} />

            {/* Render 5 Quest Nodes */}
            {(pathSummary.length > 0 ? pathSummary : Array.from({ length: 5 }).map((_, i) => ({
              stepIndex: i + 1,
              locationName: `Stop ${i + 1}`,
              status: i === 0 && !isNotStarted ? 'active' : 'locked',
              rewardItem: { name: 'Item', icon: '🎁', description: '' }
            }))).map((node, idx) => {
              const isCleared = node.status === 'cleared';
              const isActive = node.status === 'active' && !isNotStarted;
              const isLocked = node.status === 'locked' || isNotStarted;

              return (
                <div
                  key={idx}
                  onClick={() => isCleared && setSelectedItemModal(node.rewardItem)}
                  style={{
                    position: 'relative',
                    zIndex: 2,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '10px 12px',
                    borderRadius: '12px',
                    background: isCleared
                      ? 'rgba(57, 255, 20, 0.08)'
                      : isActive
                      ? 'rgba(255, 183, 0, 0.12)'
                      : 'rgba(255, 255, 255, 0.02)',
                    border: isCleared
                      ? '1px solid rgba(57, 255, 20, 0.35)'
                      : isActive
                      ? '1px solid rgba(255, 183, 0, 0.5)'
                      : '1px solid rgba(255, 255, 255, 0.06)',
                    backdropFilter: 'blur(10px)',
                    transition: 'all 0.3s ease',
                    boxShadow: isActive ? '0 0 16px rgba(255, 183, 0, 0.25)' : isCleared ? '0 0 10px rgba(57, 255, 20, 0.15)' : 'none',
                    cursor: isCleared ? 'pointer' : 'default'
                  }}
                >
                  {/* Node Badge Icon */}
                  <div style={{
                    width: '26px',
                    height: '26px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    fontSize: '12px',
                    fontWeight: 'bold',
                    background: isCleared ? '#39ff14' : isActive ? '#ffb700' : 'rgba(255, 255, 255, 0.1)',
                    color: isCleared ? '#000' : isActive ? '#000' : '#888',
                    boxShadow: isCleared ? '0 0 10px #39ff14' : isActive ? '0 0 12px #ffb700' : 'none'
                  }}>
                    {isCleared ? (
                      <CheckCircle2 size={16} color="#000" />
                    ) : isActive ? (
                      <Sparkles size={14} color="#000" className="flicker" />
                    ) : (
                      <Lock size={12} color="#666" />
                    )}
                  </div>

                  {/* Node Text Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: '9px',
                      fontFamily: 'var(--font-mono)',
                      color: isCleared ? '#39ff14' : isActive ? '#ffb700' : 'rgba(255,255,255,0.4)',
                      letterSpacing: '1px',
                      textTransform: 'uppercase'
                    }}>
                      {isCleared ? 'CLEARED OBJECTIVE' : isActive ? 'TARGET LOCATION' : `LOCKED SECTOR ${idx + 1}`}
                    </div>
                    <div style={{
                      fontSize: '13px',
                      fontWeight: '700',
                      color: isCleared ? '#fff' : isActive ? '#fff' : 'rgba(255,255,255,0.5)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {node.locationName}
                    </div>
                  </div>

                  {/* Reward Item Badge */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '4px 8px',
                    borderRadius: '16px',
                    background: isCleared ? 'rgba(57, 255, 20, 0.2)' : 'rgba(255,255,255,0.05)',
                    border: isCleared ? '1px solid rgba(57, 255, 20, 0.4)' : '1px solid rgba(255,255,255,0.08)',
                    fontSize: '11px'
                  }}>
                    <span>{node.rewardItem?.icon || '🎒'}</span>
                    <span style={{
                      fontSize: '9px',
                      color: isCleared ? '#39ff14' : 'rgba(255,255,255,0.4)',
                      fontWeight: isCleared ? 'bold' : 'normal'
                    }}>
                      {isCleared ? node.rewardItem?.name : 'Reward'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Main Tactical Clue Display Card */}
        <section className="hud-clue-card" style={{ marginBottom: '12px' }}>
          <div className="hazard-bar" style={{ height: '6px' }} />

          <div className="hud-clue-card-header">
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--color-accent)', letterSpacing: '1.5px' }}>
              CURRENT MISSION CLUE
            </div>
            <div className="hud-clue-badge">
              {isNotStarted ? 'WAITING' : clueFinished ? 'COMPLETED' : `STEP ${currentStepNum} OF ${totalStepsNum}`}
            </div>
          </div>

          <div className="hud-clue-body">
            <div className="clue-body-corners" />

            {isNotStarted ? (
              <div style={{ textAlign: 'center', padding: '12px 0' }}>
                <ShieldAlert size={36} color="var(--color-amber)" style={{ marginBottom: '10px' }} />
                <h4 style={{ color: '#fff', fontSize: '15px', marginBottom: '6px', fontWeight: 600 }}>
                  AWAITING MISSION START
                </h4>
                <p className="hud-copy" style={{ fontSize: '12px' }}>
                  Your team is connected to Chernobyl Command. Admin control will broadcast your assigned route once the game begins.
                </p>
              </div>
            ) : clueFinished ? (
              <div style={{ textAlign: 'center', padding: '12px 0' }}>
                <CheckCircle2 size={40} color="var(--color-neon-green)" style={{ marginBottom: '10px', filter: 'drop-shadow(0 0 10px var(--color-neon-green))' }} />
                <h4 style={{ color: 'var(--color-neon-green)', fontSize: '17px', marginBottom: '6px', fontWeight: 700 }}>
                  ALL 5 OBJECTIVES CLEARED!
                </h4>
                <p className="hud-copy" style={{ fontSize: '12px' }}>
                  Outstanding work, Operator! You have completed all 5 route locations and collected all sector supplies. Return to command for debriefing.
                </p>
              </div>
            ) : isLoadingClue ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div className="telemetry-bar-container" style={{ width: '50%', margin: '0 auto 10px auto' }}>
                  <div className="telemetry-bar-fill" style={{ width: '100%', animation: 'radar-sweep 1.5s infinite linear' }} />
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--color-neon-green)', letterSpacing: '1px' }}>
                  DECRYPTING TACTICAL CLUE...
                </div>
              </div>
            ) : (
              <div style={{ position: 'relative' }}>
                <div style={{
                  position: 'absolute',
                  top: '-16px',
                  left: '-4px',
                  fontSize: '44px',
                  fontFamily: 'serif',
                  color: 'rgba(57, 255, 20, 0.08)',
                  pointerEvents: 'none',
                  userSelect: 'none'
                }}>
                  “
                </div>

                <p className="hud-clue-text" style={{ fontSize: '14px', lineHeight: '1.5' }}>
                  {cluePayload?.text}
                </p>

                {/* Target Reward Preview Box */}
                {cluePayload?.rewardItem && (
                  <div style={{
                    marginTop: '12px',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    background: 'rgba(0, 229, 255, 0.08)',
                    border: '1px solid rgba(0, 229, 255, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                  }}>
                    <span style={{ fontSize: '20px' }}>{cluePayload.rewardItem.icon}</span>
                    <div>
                      <div style={{ fontSize: '9px', color: '#00e5ff', fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>
                        REWARD UPON CLEARING LOCATION:
                      </div>
                      <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#fff' }}>
                        {cluePayload.rewardItem.name}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Primary Action Button: Open Camera Scanner */}
      <div style={{ padding: '10px 12px', flexShrink: 0, background: 'rgba(15, 23, 42, 0.9)', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <button
          type="button"
          className="hud-scan-btn"
          disabled={!canScan}
          onClick={() => canScan && onNavigate('scan')}
          style={{ margin: 0, width: '100%' }}
        >
          <Scan size={20} />
          {canScan ? '[ INITIATE OPTIC SCAN ]' : '[ OPTIC SCAN LOCKED ]'}
        </button>
      </div>

      {/* Item Detail Modal */}
      {selectedItemModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 100,
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.95), rgba(15, 23, 42, 0.98))',
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
            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)', marginBottom: '16px', lineHeight: '1.4' }}>
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
                No items collected yet. Clear campus locations to collect squad items & resources!
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

    </div>
  );
};

export default HUD;
