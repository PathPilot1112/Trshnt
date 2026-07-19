import React, { useEffect, useMemo, useState } from 'react';
import QRCode from 'react-qr-code';
import { Activity, Eye, Map, Play, Power, QrCode, RefreshCw, Shield, SkipForward, Users } from 'lucide-react';
import { CircleMarker, MapContainer, Popup, TileLayer } from 'react-leaflet';
import { getSocket } from '../socket';

const API_BASE = import.meta.env.VITE_API_BASE;

const DEFAULT_CENTER = [13.0827, 80.2707];

const formatElapsed = (ms = 0) => {
  const totalSeconds = Math.floor(ms / 1000);
  const seconds = totalSeconds % 60;
  const minutes = Math.floor(totalSeconds / 60) % 60;
  const hours = Math.floor(totalSeconds / 3600);
  return [hours, minutes, seconds].map((value) => String(value).padStart(2, '0')).join(':');
};

const AdminDashboard = ({ API_BASE }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [adminToken, setAdminToken] = useState(() => localStorage.getItem('stalker_admin_token') || '');
  const [isAdmin, setIsAdmin] = useState(Boolean(localStorage.getItem('stalker_admin_token')));
  const [teams, setTeams] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [activeTab, setActiveTab] = useState('teams');
  const [selectedQR, setSelectedQR] = useState(null);

  const clearAdminSession = () => {
    localStorage.removeItem('stalker_admin_token');
    setAdminToken('');
    setIsAdmin(false);
  };

  const fetchDashboardData = async () => {
    const headers = { Authorization: `Bearer ${adminToken}` };
    const [teamsRes, submissionsRes, leaderboardRes] = await Promise.all([
      fetch(`${API_BASE}/admin/teams`, { headers }),
      fetch(`${API_BASE}/admin/submissions`, { headers }),
      fetch(`${API_BASE}/admin/leaderboard/live`, { headers }),
    ]);

    if ([teamsRes, submissionsRes, leaderboardRes].some((res) => res.status === 401)) {
      clearAdminSession();
      return;
    }

    if (teamsRes.ok) {
      const data = await teamsRes.json();
      setTeams(data.teams);
    }

    if (submissionsRes.ok) {
      const data = await submissionsRes.json();
      setSubmissions(data.submissions);
    }

    if (leaderboardRes.ok) {
      const data = await leaderboardRes.json();
      setLeaderboard(data.teams);
    }
  };

  useEffect(() => {
    if (!adminToken) {
      setIsAdmin(false);
      return;
    }

    setIsAdmin(true);
    fetchDashboardData().catch(() => {});

    const socket = getSocket(API_BASE);

    const handleSnapshot = (payload) => setLeaderboard(payload);
    const handleTeamsSnapshot = (payload) => {
      setTeams((prev) =>
        prev.map((team) => {
          const live = payload.find((entry) => String(entry.teamId) === String(team._id));
          return live
            ? {
                ...team,
                score: live.score,
                status: live.status,
                currentClueIndex: live.currentClueIndex,
                timerRunning: live.timerRunning,
                timerStartedAt: live.timerStartedAt,
                timerAccumulatedMs: live.timerAccumulatedMs,
                location: live.location || team.location,
              }
            : team;
        })
      );
    };

    socket.on('leaderboard:snapshot', handleSnapshot);
    socket.on('teams:snapshot', handleTeamsSnapshot);

    return () => {
      socket.off('leaderboard:snapshot', handleSnapshot);
      socket.off('teams:snapshot', handleTeamsSnapshot);
    };
  }, [API_BASE, adminToken]);

  const mergedTeams = useMemo(
    () =>
      teams.map((team) => {
        const live = leaderboard.find((entry) => String(entry.teamId) === String(team._id));
        return live ? { ...team, ...live } : team;
      }),
    [leaderboard, teams]
  );

  const mapCenter = useMemo(() => {
    const firstLocated = mergedTeams.find((team) => team.location?.lat && team.location?.lng);
    return firstLocated ? [firstLocated.location.lat, firstLocated.location.lng] : DEFAULT_CENTER;
  }, [mergedTeams]);

  const authedFetch = async (url, options = {}) => {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...(options.headers || {}),
        Authorization: `Bearer ${adminToken}`,
      },
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.message || 'Request failed');
    }

    return response.json().catch(() => ({}));
  };

  const handleAdminLogin = async (event) => {
    event.preventDefault();
    const response = await fetch(`${API_BASE}/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();
    if (!response.ok) {
      alert(data.message || 'Login failed');
      return;
    }

    localStorage.setItem('stalker_admin_token', data.token);
    setAdminToken(data.token);
    setIsAdmin(true);
  };

  const handleLogout = () => {
    clearAdminSession();
  };

  const runAction = async (path) => {
    await authedFetch(`${API_BASE}${path}`, { method: 'POST' });
    await fetchDashboardData();
  };

  if (!isAdmin) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#03080a' }}>
        <form onSubmit={handleAdminLogin} style={{ width: '100%', maxWidth: '420px', padding: '24px', border: '1px solid var(--cyan-primary)', background: '#010608' }}>
          <div style={{ textAlign: 'center', fontSize: '18px', marginBottom: '20px', color: 'var(--cyan-primary)' }}>
            STALKER_NET // ADMIN_GATE
          </div>
          <div style={{ display: 'grid', gap: '14px' }}>
            <input className="id-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@stalker.net" required />
            <input className="id-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="password" required />
            <button className="cyber-btn striped" type="submit" style={{ color: 'var(--bg-darkest)' }}>
              <Shield size={14} /> AUTHORIZE ACCESS
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#020709', color: 'var(--cyan-primary)', padding: '20px', fontFamily: "'Share Tech Mono', monospace" }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', gap: '12px', flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: '22px', color: '#fff' }}>ADMIN DASHBOARD</div>
          <div style={{ fontSize: '11px', color: 'rgba(0,240,255,0.6)' }}>Live QR onboarding, sockets, timers, map telemetry</div>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button className="cyber-btn-outline" onClick={fetchDashboardData}>
            <RefreshCw size={14} /> REFRESH
          </button>
          <button className="cyber-btn-outline" onClick={handleLogout}>
            <Power size={14} /> LOGOUT
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <button className={`cyber-btn-outline ${activeTab === 'teams' ? 'glow-text' : ''}`} onClick={() => setActiveTab('teams')}>
          <Users size={14} /> Teams
        </button>
        <button className={`cyber-btn-outline ${activeTab === 'map' ? 'glow-text' : ''}`} onClick={() => setActiveTab('map')}>
          <Map size={14} /> Map
        </button>
        <button className={`cyber-btn-outline ${activeTab === 'submissions' ? 'glow-text' : ''}`} onClick={() => setActiveTab('submissions')}>
          <Activity size={14} /> Submissions
        </button>
      </div>

      {activeTab === 'teams' && (
        <div style={{ display: 'grid', gap: '14px' }}>
          {mergedTeams.map((team, index) => (
            <div key={team._id} style={{ border: '1px solid rgba(0,240,255,0.2)', background: 'rgba(3,12,15,0.75)', padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                <div>
                  <div style={{ color: '#fff', fontSize: '16px' }}>{index + 1}. {team.name}</div>
                  <div style={{ fontSize: '11px', marginTop: '6px' }}>
                    STATUS: {team.status} | SCORE: {team.score || 0} | CLUE: {(team.currentClueIndex || 0) + 1}
                  </div>
                  <div style={{ fontSize: '11px', marginTop: '6px' }}>
                    TIMER: {formatElapsed(team.elapsedMs || team.timerAccumulatedMs || 0)} {team.timerRunning ? '(RUNNING)' : '(STOPPED)'}
                  </div>
                  <div style={{ fontSize: '11px', marginTop: '6px' }}>
                    GPS: {team.location?.lat ? `${team.location.lat.toFixed(5)}, ${team.location.lng.toFixed(5)}` : 'No live coordinates yet'}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '8px', minWidth: '320px' }}>
                  <button className="cyber-btn-outline" onClick={() => setSelectedQR(team)}>
                    <QrCode size={14} /> VIEW QR
                  </button>
                  <button className="cyber-btn striped" onClick={() => runAction(`/admin/teams/${team._id}/start`)}>
                    <Play size={14} /> START
                  </button>
                  <button className="cyber-btn-outline" onClick={() => runAction(`/admin/teams/${team._id}/stop`)}>
                    <Power size={14} /> STOP TIMER
                  </button>
                  <button className="cyber-btn-outline" onClick={() => runAction(`/admin/teams/${team._id}/clue-override`)}>
                    <SkipForward size={14} /> SKIP CLUE
                  </button>
                  <button className="cyber-btn-outline" onClick={() => runAction(`/admin/teams/${team._id}/reset`)}>
                    <RefreshCw size={14} /> RESET
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'map' && (
        <div style={{ border: '1px solid rgba(0,240,255,0.2)', background: 'rgba(3,12,15,0.75)', padding: '16px' }}>
          <div style={{ color: '#fff', marginBottom: '12px' }}>LIVE TEAM POSITIONS / OPENSTREETMAP</div>
          <div style={{ height: '65vh', minHeight: '420px' }}>
            <MapContainer center={mapCenter} zoom={17} style={{ height: '100%', width: '100%' }}>
              <TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              {mergedTeams
                .filter((team) => team.location?.lat && team.location?.lng)
                .map((team) => (
                  <CircleMarker
                    key={team._id}
                    center={[team.location.lat, team.location.lng]}
                    radius={10}
                    pathOptions={{ color: team.timerRunning ? '#00f0ff' : '#ffb84d', fillOpacity: 0.75 }}
                  >
                    <Popup>
                      <div>
                        <strong>{team.name}</strong>
                        <div>Status: {team.status}</div>
                        <div>Score: {team.score || 0}</div>
                        <div>Timer: {formatElapsed(team.elapsedMs || team.timerAccumulatedMs || 0)}</div>
                      </div>
                    </Popup>
                  </CircleMarker>
                ))}
            </MapContainer>
          </div>
        </div>
      )}

      {activeTab === 'submissions' && (
        <div style={{ display: 'grid', gap: '12px' }}>
          {submissions.map((submission) => (
            <div key={submission._id} style={{ border: '1px solid rgba(0,240,255,0.2)', background: 'rgba(3,12,15,0.75)', padding: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                <div>
                  <div style={{ color: '#fff' }}>{submission.team?.name || 'Unknown Team'}</div>
                  <div style={{ fontSize: '11px', marginTop: '6px' }}>
                    CLUE: {submission.clue?.title || 'Unknown'} | RESULT: {submission.isCorrect ? 'CORRECT' : 'INCORRECT'}
                  </div>
                  <div style={{ fontSize: '11px', marginTop: '6px' }}>
                    LABEL: {submission.mlResult?.predictedLabel || 'N/A'} | CONFIDENCE: {Math.round((submission.mlResult?.confidence || 0) * 100)}%
                  </div>
                </div>
                <a href={submission.photoUrl?.startsWith('http') ? submission.photoUrl : `${API_BASE.replace(/\/api\/?$/, '')}${submission.photoUrl}`} target="_blank" rel="noreferrer" className="cyber-btn-outline">
                  <Eye size={14} /> VIEW PHOTO
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedQR && (
        <div
          onClick={() => setSelectedQR(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '20px' }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ width: '100%', maxWidth: '360px', background: '#020b0d', border: '1px solid var(--cyan-primary)', padding: '24px', textAlign: 'center' }}
          >
            <div style={{ color: '#fff', marginBottom: '16px' }}>{selectedQR.name}</div>
            <div style={{ background: '#fff', padding: '18px', display: 'inline-block' }}>
              <QRCode value={JSON.stringify({ teamId: selectedQR._id, teamName: selectedQR.name })} size={220} />
            </div>
            <div style={{ marginTop: '16px', fontSize: '11px' }}>
              Scan this QR from the welcome screen or upload its image there.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
