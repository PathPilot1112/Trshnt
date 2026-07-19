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
  const [clueLocations, setClueLocations] = useState([]);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [newSubmissionAlert, setNewSubmissionAlert] = useState(null);
  const [selectedTeamFilter, setSelectedTeamFilter] = useState('all');

  const getFullPhotoUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    
    if (API_BASE && API_BASE.startsWith('http')) {
      const origin = API_BASE.replace(/\/api\/?$/, '');
      return `${origin}${url}`;
    }
    
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return `http://localhost:8000${url}`;
    }
    
    return `${window.location.origin}${url}`;
  };

  const filteredSubmissions = useMemo(() => {
    if (selectedTeamFilter === 'all') return submissions;
    return submissions.filter((s) => String(s.team?._id) === String(selectedTeamFilter));
  }, [submissions, selectedTeamFilter]);

  const getClueLocationText = (clueId) => {
    if (!clueId) return 'N/A';
    const found = clueLocations.find((loc) => String(loc.clueid) === String(clueId));
    return found ? found.location : 'Unknown Grid coordinates';
  };

  const getClueText = (clue) => {
    if (clue?.text) return clue.text;
    if (!clue?.clueId) return 'N/A';
    const found = clueLocations.find((loc) => String(loc.clueid) === String(clue.clueId));
    return found ? found['clue text'] : 'N/A';
  };

  const clearAdminSession = () => {
    localStorage.removeItem('stalker_admin_token');
    setAdminToken('');
    setIsAdmin(false);
  };

  const fetchDashboardData = async () => {
    const headers = { Authorization: `Bearer ${adminToken}` };
    const [teamsRes, submissionsRes, leaderboardRes, clueLocationsRes] = await Promise.all([
      fetch(`${API_BASE}/admin/teams`, { headers }),
      fetch(`${API_BASE}/admin/submissions`, { headers }),
      fetch(`${API_BASE}/admin/leaderboard/live`, { headers }),
      fetch(`${API_BASE}/admin/clue-locations`, { headers }),
    ]);

    if ([teamsRes, submissionsRes, leaderboardRes, clueLocationsRes].some((res) => res.status === 401)) {
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

    if (clueLocationsRes && clueLocationsRes.ok) {
      const data = await clueLocationsRes.json();
      setClueLocations(data.clueLocations || []);
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

    const handleNewSubmission = (newSub) => {
      setSubmissions((prev) => {
        if (prev.some((s) => String(s._id) === String(newSub._id))) {
          return prev;
        }
        return [newSub, ...prev];
      });

      // Show toast alert
      setNewSubmissionAlert(newSub);
      setTimeout(() => {
        setNewSubmissionAlert((current) => (current?._id === newSub._id ? null : current));
      }, 5000);
    };

    const handleSubmissionsCleared = () => {
      setSubmissions([]);
    };

    socket.on('leaderboard:snapshot', handleSnapshot);
    socket.on('teams:snapshot', handleTeamsSnapshot);
    socket.on('submission:created', handleNewSubmission);
    socket.on('submissions:cleared', handleSubmissionsCleared);

    return () => {
      socket.off('leaderboard:snapshot', handleSnapshot);
      socket.off('teams:snapshot', handleTeamsSnapshot);
      socket.off('submission:created', handleNewSubmission);
      socket.off('submissions:cleared', handleSubmissionsCleared);
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

  const handleClearSubmissions = async () => {
    if (!window.confirm("WARNING: This will permanently delete all submissions from MongoDB, clear all uploaded images from Supabase Storage, and reset all team progress. Are you sure?")) {
      return;
    }
    try {
      await authedFetch(`${API_BASE}/admin/submissions/clear`, { method: 'POST' });
      setSubmissions([]);
      alert("All submissions cleared and teams reset successfully!");
    } catch (err) {
      alert("Failed to clear submissions: " + err.message);
    }
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

      {activeTab === 'submissions' && (
        <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', color: 'rgba(0,240,255,0.6)' }}>FILTER BY TEAM:</span>
            <select
              value={selectedTeamFilter}
              onChange={(e) => setSelectedTeamFilter(e.target.value)}
              style={{
                background: '#020b0d',
                color: 'var(--cyan-primary)',
                border: '1px solid var(--cyan-primary)',
                padding: '6px 12px',
                fontFamily: "'Share Tech Mono', monospace",
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="all">ALL TEAMS</option>
              {teams.map((t) => (
                <option key={t._id} value={t._id}>{t.name}</option>
              ))}
            </select>
          </div>

          <button 
            className="cyber-btn" 
            style={{ background: '#7f1d1d', border: '1px solid #ef4444', color: '#fca5a5', padding: '8px 16px', fontSize: '11px', cursor: 'pointer' }} 
            onClick={handleClearSubmissions}
          >
            CLEAR ALL SUBMISSIONS & RESET TEAMS
          </button>
        </div>
      )}

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
        <div style={{ display: 'grid', gap: '14px' }}>
          {filteredSubmissions.map((submission) => {
            const photoUrl = getFullPhotoUrl(submission.photoUrl);

            const matchLocation = getClueLocationText(submission.clue?.clueId);
            const clueText = getClueText(submission.clue);

            return (
              <div
                key={submission._id}
                style={{
                  border: `1px solid ${submission.isCorrect ? 'rgba(57,255,20,0.3)' : 'rgba(255,100,0,0.3)'}`,
                  background: 'rgba(4, 18, 23, 0.85)',
                  padding: '16px',
                  display: 'flex',
                  gap: '20px',
                  alignItems: 'flex-start',
                  flexWrap: 'wrap',
                  position: 'relative',
                  boxShadow: submission.isCorrect ? '0 0 10px rgba(57,255,20,0.05)' : '0 0 10px rgba(255,100,0,0.05)',
                  transition: 'all 0.3s ease'
                }}
              >
                {/* Result Indicator Badge */}
                <div
                  style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    fontSize: '9px',
                    letterSpacing: '1px',
                    fontWeight: 'bold',
                    padding: '2px 8px',
                    background: submission.isCorrect ? 'rgba(57,255,20,0.15)' : 'rgba(255,100,0,0.15)',
                    color: submission.isCorrect ? '#39FF14' : '#FF6400',
                    border: `1px solid ${submission.isCorrect ? '#39FF14' : '#FF6400'}`,
                  }}
                >
                  {submission.isCorrect ? 'VERIFIED' : 'REJECTED'}
                </div>

                {/* Left Side: Thumbnail with Click to Zoom */}
                <div
                  onClick={() => setSelectedPhoto(photoUrl)}
                  style={{
                    width: '120px',
                    height: '120px',
                    cursor: 'zoom-in',
                    overflow: 'hidden',
                    border: `1px solid ${submission.isCorrect ? 'rgba(57,255,20,0.5)' : 'rgba(255,100,0,0.5)'}`,
                    boxShadow: '0 0 5px rgba(0,240,255,0.1)',
                    position: 'relative'
                  }}
                >
                  <img
                    src={photoUrl}
                    alt="Submission Snapshot"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      transition: 'transform 0.3s ease',
                    }}
                    onMouseOver={(e) => (e.currentTarget.style.transform = 'scale(1.1)')}
                    onMouseOut={(e) => (e.currentTarget.style.transform = 'scale(1.0)')}
                  />
                </div>

                {/* Right Side: Meta details */}
                <div style={{ flex: '1', minWidth: '260px' }}>
                  <div style={{ color: '#fff', fontSize: '16px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>{submission.team?.name || 'Unknown Team'}</span>
                    <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: 'normal' }}>
                      ({new Date(submission.createdAt).toLocaleTimeString()})
                    </span>
                  </div>

                  <div style={{ fontSize: '11px', marginTop: '8px', color: 'var(--cyan-primary)', fontWeight: 'bold' }}>
                    CLUE {submission.clue?.order || '?'}: {submission.clue?.title || 'Unknown'}
                  </div>

                  <div style={{ fontSize: '12px', marginTop: '6px', color: '#cbd5e1', fontStyle: 'italic', background: 'rgba(0,0,0,0.3)', padding: '6px 10px', borderLeft: '2px solid var(--cyan-primary)' }}>
                    &ldquo;{clueText}&rdquo;
                  </div>

                  <div style={{ fontSize: '11px', marginTop: '8px', display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '4px 12px' }}>
                    <span style={{ color: 'rgba(0,240,255,0.5)' }}>TARGET LOC:</span>
                    <span style={{ color: '#ffb84d' }}>{matchLocation}</span>

                    <span style={{ color: 'rgba(0,240,255,0.5)' }}>ML PREDICT:</span>
                    <span>{submission.mlResult?.predictedLabel || 'N/A'}</span>

                    <span style={{ color: 'rgba(0,240,255,0.5)' }}>CONFIDENCE:</span>
                    <span>{Math.round((submission.mlResult?.confidence || 0) * 100)}%</span>
                  </div>
                </div>
              </div>
            );
          })}
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

      {/* Real-time Submission Toast Notification */}
      {newSubmissionAlert && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 1000,
            background: 'rgba(2, 11, 14, 0.95)',
            border: `1px solid ${newSubmissionAlert.isCorrect ? '#39FF14' : '#FF6400'}`,
            boxShadow: `0 0 20px ${newSubmissionAlert.isCorrect ? 'rgba(57,255,20,0.3)' : 'rgba(255,100,0,0.3)'}`,
            padding: '16px',
            maxWidth: '320px',
            fontFamily: "'Share Tech Mono', monospace"
          }}
        >
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div style={{ width: '50px', height: '50px', flexShrink: 0, overflow: 'hidden', border: '1px solid rgba(0,240,255,0.3)' }}>
              <img
                src={getFullPhotoUrl(newSubmissionAlert.photoUrl)}
                alt="Toast preview"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
            <div>
              <div style={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}>NEW TRANSMISSION RECEIVED</div>
              <div style={{ fontSize: '11px', color: 'var(--cyan-primary)' }}>Team: {newSubmissionAlert.team?.name}</div>
              <div style={{ fontSize: '10px', color: newSubmissionAlert.isCorrect ? '#39FF14' : '#FF6400' }}>
                RESULT: {newSubmissionAlert.isCorrect ? 'CORRECT (VERIFIED)' : 'INCORRECT'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Image Zoom Modal */}
      {selectedPhoto && (
        <div
          onClick={() => setSelectedPhoto(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.92)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            cursor: 'zoom-out',
            padding: '20px'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'relative',
              maxWidth: '90vw',
              maxHeight: '90vh',
              border: '2px solid var(--cyan-primary)',
              boxShadow: '0 0 30px rgba(0,240,255,0.4)',
              background: '#010507'
            }}
          >
            <img
              src={selectedPhoto}
              alt="Submissions High-Res View"
              style={{
                display: 'block',
                maxWidth: '100%',
                maxHeight: '85vh',
                objectFit: 'contain'
              }}
            />
            <button
              onClick={() => setSelectedPhoto(null)}
              style={{
                position: 'absolute',
                top: '-32px',
                right: '0',
                background: 'transparent',
                border: 'none',
                color: '#fff',
                fontSize: '16px',
                cursor: 'pointer',
                fontFamily: "'Share Tech Mono', monospace"
              }}
            >
              CLOSE [X]
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
