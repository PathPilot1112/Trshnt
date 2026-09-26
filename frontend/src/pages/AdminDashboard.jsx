import React, { useEffect, useMemo, useState } from 'react';
import QRCode from 'react-qr-code';
import { Activity, Clock, Edit3, Map, Play, Power, QrCode, RefreshCw, Shield, SkipForward, Trash2, Trophy, Users, X } from 'lucide-react';
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
  const [accessCode, setAccessCode] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [adminToken, setAdminToken] = useState(() => localStorage.getItem('chernobyl_admin_token') || '');
  const [isAdmin, setIsAdmin] = useState(Boolean(localStorage.getItem('chernobyl_admin_token')));
  const [teams, setTeams] = useState([]);
  const [totalParticipants, setTotalParticipants] = useState(0);
  const [submissions, setSubmissions] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [activeTab, setActiveTab] = useState('teams');
  const [selectedQR, setSelectedQR] = useState(null);
  const [clueLocations, setClueLocations] = useState([]);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [selectedTeamFilter, setSelectedTeamFilter] = useState('all');
  const [expandedTeams, setExpandedTeams] = useState({});
  const [expandedSubmissions, setExpandedSubmissions] = useState({});
  const [mlStatus, setMlStatus] = useState('red');
  const [isWaking, setIsWaking] = useState(false);
  const [banner, setBanner] = useState(null);
  const [actionStatus, setActionStatus] = useState({});
  const [clearSubmissionsLoading, setClearSubmissionsLoading] = useState(false);
  const [allRoutes, setAllRoutes] = useState([]);
  const [teamRoutes, setTeamRoutes] = useState({});
  const [systemState, setSystemState] = useState({ testDevMode: false, coordMappingEnabled: false, coordRadiusMeters: 35 });
  const [reports, setReports] = useState([]);
  const [now, setNow] = useState(Date.now());
  const [teamSortMode, setTeamSortMode] = useState('time');
  const [editingTeam, setEditingTeam] = useState(null);
  const [editForm, setEditForm] = useState({
    name: '',
    status: 'not_started',
    score: 0,
    currentClueIndex: 0,
    assignedRouteId: '',
  });

  const showBanner = (title, message = '', type = 'success') => {
    setBanner({ title, message, type });
    window.clearTimeout(window.__bannerTimer);
    window.__bannerTimer = window.setTimeout(() => setBanner(null), 2500);
  };

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getTeamElapsed = (team) => {
    const base = team.timerAccumulatedMs || 0;
    if (!team.timerRunning || !team.timerStartedAt) return team.elapsedMs || base;
    return base + Math.max(0, now - new Date(team.timerStartedAt).getTime());
  };

  const checkMLStatus = async () => {
    try {
      const url = API_BASE ? `${API_BASE}/ml-health` : '/ml-health';
      const res = await fetch(url);
      if (res.ok) {
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = await res.json();
          setMlStatus(data.status || 'red');
          if (data.status === 'green') {
            setIsWaking(false);
          }
        } else {
          const text = await res.text();
          if (text.includes("APi working")) {
            setMlStatus('orange');
          } else {
            setMlStatus('red');
          }
        }
      } else {
        setMlStatus('red');
      }
    } catch (err) {
      setMlStatus('red');
    }
  };

  const handleWakeupML = async () => {
    setIsWaking(true);
    setMlStatus('orange');
    try {
      const url = API_BASE ? `${API_BASE}/ml-health?action=wakeup` : '/ml-health?action=wakeup';
      const res = await fetch(url);
      if (res.ok) {
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = await res.json();
          setMlStatus(data.status || 'orange');
          showBanner('ML Core', 'Wake request sent.', 'info');
        }
      }
    } catch (err) {
      showBanner('ML Core', err.message, 'error');
    }
  };

  useEffect(() => {
    if (!isAdmin) return;
    checkMLStatus();
    const interval = setInterval(checkMLStatus, 10000);
    return () => clearInterval(interval);
  }, [API_BASE, isAdmin]);

  const toggleTeam = (teamId) => {
    setExpandedTeams((prev) => ({
      ...prev,
      [teamId]: !prev[teamId]
    }));
  };

  const toggleSubmission = (subId) => {
    setExpandedSubmissions((prev) => ({
      ...prev,
      [subId]: !prev[subId]
    }));
  };

  const getFullPhotoUrl = (photoUrl) => {
    if (!photoUrl) return '';
    if (photoUrl.startsWith('http://') || photoUrl.startsWith('https://') || photoUrl.startsWith('data:')) {
      return photoUrl;
    }
    const base = API_BASE ? API_BASE.replace(/\/+$/, '') : '';
    return `${base}${photoUrl.startsWith('/') ? '' : '/'}${photoUrl}`;
  };

  const handleToggleSubmissionAccepted = async (sub) => {
    const nextVal = !sub.isCorrect;
    try {
      await authedFetch(`${API_BASE}/admin/submissions/${sub._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isCorrect: nextVal }),
      });
      setSubmissions((prev) => prev.map((s) => (s._id === sub._id ? { ...s, isCorrect: nextVal } : s)));
      showBanner('Submission Updated', `Marked as ${nextVal ? 'ACCEPTED (Team Advanced ✓)' : 'REJECTED'}`);
      fetchDashboardData().catch(() => {});
    } catch (err) {
      showBanner('Update Failed', err.message, 'error');
    }
  };


  const handleDeleteSubmission = async (subId) => {
    if (!window.confirm('Are you sure you want to delete this submission?')) return;
    try {
      await authedFetch(`${API_BASE}/admin/submissions/${subId}`, {
        method: 'DELETE',
      });
      setSubmissions((prev) => prev.filter((s) => s._id !== subId));
      showBanner('Submission Deleted');
    } catch (err) {
      showBanner('Delete Failed', err.message, 'error');
    }
  };

  const getClueText = (clue) => {
    if (typeof clue === 'object' && clue?.text) return clue.text;
    const cid = typeof clue === 'object' ? (clue?.clueId || clue?.order) : clue;
    if (!cid) return 'N/A';
    const found = clueLocations.find((loc) => String(loc.clueid) === String(cid) || String(loc.order) === String(cid));
    return found ? (found['clue text'] || found.clue_text || found.text) : 'N/A';
  };

  const getClueLocationText = (clue) => {
    if (typeof clue === 'object' && (clue?.title || clue?.targetLabel || clue?.location)) {
      return clue.title || clue.targetLabel || clue.location;
    }
    const cid = typeof clue === 'object' ? (clue?.clueId || clue?.order) : clue;
    if (!cid) return 'Unknown Location';
    const found = clueLocations.find((loc) => String(loc.clueid) === String(cid) || String(loc.order) === String(cid));
    return found ? (found.title || found.targetLabel || found.location || 'Unknown Location') : 'Unknown Location';
  };

  const clearAdminSession = () => {
    localStorage.removeItem('chernobyl_admin_token');
    localStorage.removeItem('treasure_admin_token');
    setAdminToken('');
    setIsAdmin(false);
  };

  const downloadCSV = (data, filename) => {
    if (!data || !data.length) return;
    const headers = Object.keys(data[0]);
    const csvRows = [];
    csvRows.push(headers.join(','));

    for (const row of data) {
      const values = headers.map(header => {
        const val = row[header];
        if (val === null || val === undefined) return '""';
        const escaped = String(val).replace(/"/g, '""');
        return `"${escaped}"`;
      });
      csvRows.push(values.join(','));
    }

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadTeamsCSV = () => {
    if (!teams || !teams.length) {
      showBanner('No Teams', 'No team data available to export.', 'warning');
      return;
    }
    const exportData = teams.map((t) => ({
      'Team Name': t.name || '',
      'Team Number': t.teamNumber || '',
      'Status': t.status || 'not_started',
      'Score': t.score || 0,
      'Current Clue Index': t.currentClueIndex || 0,
      'Payment Verified': t.paymentVerified ? 'YES' : 'NO',
      'Payment Screenshot URL': t.paymentScreenshotUrl || 'N/A',
      'Members Count': t.members?.length || 0,
      'Member Names': t.members?.map(m => typeof m === 'object' ? m.name : m).join('; ') || '',
      'Member Emails': t.members?.map(m => typeof m === 'object' ? m.email : '').filter(Boolean).join('; ') || '',
      'Member Phones': t.members?.map(m => typeof m === 'object' ? m.contactNumber : '').filter(Boolean).join('; ') || '',
      'Member Reg Numbers': t.members?.map(m => typeof m === 'object' ? m.registerNumber : '').filter(Boolean).join('; ') || '',
      'Assigned Route ID': t.assignedRouteId || 'N/A',
      'Created At': t.createdAt ? new Date(t.createdAt).toLocaleString() : ''
    }));
    downloadCSV(exportData, `teams_export_${Date.now()}.csv`);
    showBanner('CSV Downloaded', 'Teams CSV exported successfully!');
  };

  const handleDownloadSubmissionsCSV = () => {
    if (!submissions || !submissions.length) {
      showBanner('No Submissions', 'No submission data available to export.', 'warning');
      return;
    }
    const exportData = submissions.map((s) => ({
      'Submission ID': s._id,
      'Team Name': s.team?.name || 'Unknown Team',
      'Clue Order': s.clue?.order || 'N/A',
      'Clue Title': s.clue?.title || 'N/A',
      'Photo URL': s.photoUrl || '',
      'ML Predicted Label': s.mlResult?.predictedLabel || 'N/A',
      'ML Confidence (%)': s.mlResult?.confidence ? Math.round(s.mlResult.confidence * 100) + '%' : 'N/A',
      'Verified Status': s.isCorrect ? 'ACCEPTED' : 'REJECTED',
      'Submitted At': s.createdAt ? new Date(s.createdAt).toLocaleString() : ''
    }));
    downloadCSV(exportData, `submissions_export_${Date.now()}.csv`);
    showBanner('CSV Downloaded', 'Submissions CSV exported successfully!');
  };

  const handleToggleVerifyPayment = async (team) => {
    const nextVal = !team.paymentVerified;
    try {
      await authedFetch(`${API_BASE}/admin/teams/${team._id}/verify-payment`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentVerified: nextVal }),
      });
      setTeams((prev) => prev.map((t) => (t._id === team._id ? { ...t, paymentVerified: nextVal } : t)));
      showBanner('Payment Updated', `Team "${team.name}" payment marked as ${nextVal ? 'VERIFIED ✓' : 'UNVERIFIED'}`);
    } catch (err) {
      showBanner('Update Failed', err.message, 'error');
    }
  };

  const fetchDashboardData = async () => {

    const headers = { Authorization: `Bearer ${adminToken}` };
    const [teamsRes, submissionsRes, leaderboardRes, clueLocationsRes, routesRes, sysRes, repRes] = await Promise.all([
      fetch(`${API_BASE}/admin/teams`, { headers }),
      fetch(`${API_BASE}/admin/submissions`, { headers }),
      fetch(`${API_BASE}/admin/leaderboard/live`, { headers }),
      fetch(`${API_BASE}/admin/clue-locations`, { headers }),
      fetch(`${API_BASE}/admin/routes`, { headers }),
      fetch(`${API_BASE}/admin/system-state`, { headers }),
      fetch(`${API_BASE}/admin/reports`, { headers }),
    ]);

    if (teamsRes.ok) {
      const data = await teamsRes.json();
      setTeams(data.teams || []);
      if (typeof data.totalParticipants === 'number') {
        setTotalParticipants(data.totalParticipants);
      }
    }
    if (submissionsRes.ok) {
      const data = await submissionsRes.json();
      setSubmissions(data.submissions || []);
    }
    if (leaderboardRes.ok) {
      const data = await leaderboardRes.json();
      setLeaderboard(data.leaderboard || []);
    }
    if (clueLocationsRes.ok) {
      const data = await clueLocationsRes.json();
      setClueLocations(data.locations || []);
    }
    if (routesRes.ok) {
      const data = await routesRes.json();
      setAllRoutes(data.routes || []);
    }
    if (sysRes.ok) {
      const data = await sysRes.json();
      setSystemState(data || { testDevMode: false, coordMappingEnabled: false, coordRadiusMeters: 3.5 });
    }
    if (repRes.ok) {
      const data = await repRes.json();
      setReports(data.reports || []);
    }
  };

  const handleToggleTestDevMode = async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/toggle-test-mode`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({ enabled: !systemState.testDevMode }),
      });
      if (res.ok) {
        const data = await res.json();
        setSystemState(data.state);
        showBanner('TEST DEV MODE', data.message, data.state.testDevMode ? 'warning' : 'info');
        const routesRes = await fetch(`${API_BASE}/admin/routes`, { headers: { Authorization: `Bearer ${adminToken}` } });
        if (routesRes.ok) {
          const rData = await routesRes.json();
          setAllRoutes(rData.routes || []);
        }
      }
    } catch (err) {
      showBanner('SYSTEM ERROR', err.message, 'error');
    }
  };

  const handleToggleCoordMapping = async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/toggle-coord-mapping`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({ enabled: !systemState.coordMappingEnabled }),
      });
      if (res.ok) {
        const data = await res.json();
        setSystemState(data.state);
        showBanner('GPS GEOFENCING', data.message, data.state.coordMappingEnabled ? 'success' : 'info');
      }
    } catch (err) {
      showBanner('SYSTEM ERROR', err.message, 'error');
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
    const handleSystemState = (newState) => {
      setSystemState(newState);
      fetch(`${API_BASE}/admin/routes`, { headers: { Authorization: `Bearer ${adminToken}` } })
        .then(r => r.json())
        .then(data => setAllRoutes(data.routes || []))
        .catch(() => {});
    };
    const handleNewReport = (newRep) => {
      setReports((prev) => [newRep, ...prev]);
      showBanner('NEW ISSUE REPORT', `${newRep.teamName}: ${newRep.category}`, 'warning');
    };

    socket.on('system:state', handleSystemState);
    socket.on('report:created', handleNewReport);
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

      showBanner(
        'NEW SUBMISSION',
        `${newSub.team?.name || 'Team'} — ${newSub.isCorrect ? 'ACCEPTED' : 'REJECTED'}`,
        newSub.isCorrect ? 'success' : 'warning'
      );
    };

    const handleSubmissionsCleared = () => {
      setSubmissions([]);
    };

    const handleReportDeleted = (payload) => {
      setReports((prev) => prev.filter((r) => r._id !== payload.reportId));
    };

    const handleReportsCleared = () => {
      setReports([]);
    };

    const handleTeamDeleted = (payload) => {
      setTeams((prev) => prev.filter((t) => t._id !== payload.teamId));
      fetchDashboardData().catch(() => {});
    };

    socket.on('leaderboard:snapshot', handleSnapshot);
    socket.on('teams:snapshot', handleTeamsSnapshot);
    socket.on('submission:created', handleNewSubmission);
    socket.on('submissions:cleared', handleSubmissionsCleared);
    socket.on('report:deleted', handleReportDeleted);
    socket.on('reports:cleared', handleReportsCleared);
    socket.on('team:deleted', handleTeamDeleted);

    return () => {
      socket.off('leaderboard:snapshot', handleSnapshot);
      socket.off('teams:snapshot', handleTeamsSnapshot);
      socket.off('submission:created', handleNewSubmission);
      socket.off('submissions:cleared', handleSubmissionsCleared);
      socket.off('report:deleted', handleReportDeleted);
      socket.off('reports:cleared', handleReportsCleared);
      socket.off('team:deleted', handleTeamDeleted);
      socket.off('system:state', handleSystemState);
      socket.off('report:created', handleNewReport);
    };
  }, [API_BASE, adminToken]);

  const totalParticipantCount = useMemo(() => {
    const fromTeams = teams.reduce((acc, t) => {
      const count = Array.isArray(t.members) ? t.members.filter(Boolean).length : 0;
      return acc + count;
    }, 0);
    return fromTeams > 0 ? fromTeams : (totalParticipants || 0);
  }, [teams, totalParticipants]);

  const mergedTeams = useMemo(() => {
    const list = teams.map((team) => {
      const live = leaderboard.find((entry) => String(entry.teamId) === String(team._id));
      return live ? { ...team, ...live } : team;
    });

    return list.sort((a, b) => {
      if (teamSortMode === 'name') {
        return (a.name || '').localeCompare(b.name || '');
      }

      const elapsedA = getTeamElapsed(a);
      const elapsedB = getTeamElapsed(b);

      if (teamSortMode === 'time') {
        // Priority 1: Finished teams ranked by lowest elapsed time
        const aFin = a.status === 'finished';
        const bFin = b.status === 'finished';
        if (aFin && !bFin) return -1;
        if (!aFin && bFin) return 1;
        if (aFin && bFin) return elapsedA - elapsedB;

        // Priority 2: In-progress teams ranked by clues completed descending, then least elapsed time
        const aIn = a.status === 'in_progress';
        const bIn = b.status === 'in_progress';
        if (aIn && !bIn) return -1;
        if (!aIn && bIn) return 1;
        if (aIn && bIn) {
          const clueDiff = (b.currentClueIndex || 0) - (a.currentClueIndex || 0);
          if (clueDiff !== 0) return clueDiff;
          return elapsedA - elapsedB;
        }

        // Priority 3: Not started or other
        return 0;
      }

      if (teamSortMode === 'pure_time') {
        return elapsedA - elapsedB;
      }

      return 0;
    });
  }, [leaderboard, teams, teamSortMode, now]);

  const mapCenter = useMemo(() => {
    const firstLocated = mergedTeams.find((team) => team.location?.lat && team.location?.lng);
    return firstLocated ? [firstLocated.location.lat, firstLocated.location.lng] : DEFAULT_CENTER;
  }, [mergedTeams]);

  const filteredSubmissions = useMemo(() => {
    if (!Array.isArray(submissions)) return [];
    if (selectedTeamFilter === 'all') return submissions;
    return submissions.filter((sub) => {
      const teamId = sub.team?._id || sub.team;
      return String(teamId) === String(selectedTeamFilter);
    });
  }, [submissions, selectedTeamFilter]);

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
    setLoginLoading(true);
    setLoginError('');
    try {
      const response = await fetch(`${API_BASE}/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessCode, password: accessCode, pin: accessCode }),
      });

      const data = await response.json();
      if (!response.ok) {
        setLoginError(data.message || 'Check your access code.');
        return;
      }

      localStorage.setItem('chernobyl_admin_token', data.token);
      localStorage.setItem('treasure_admin_token', data.token);
      setAdminToken(data.token);
      setIsAdmin(true);
    } catch (err) {
      setLoginError('Authentication error: ' + err.message);
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    clearAdminSession();
  };

  const runAction = async (actionKey, path, successTitle, body = null) => {
    setActionStatus((prev) => ({ ...prev, [actionKey]: 'loading' }));
    try {
      const options = { method: 'POST' };
      if (body) {
        options.headers = { 'Content-Type': 'application/json' };
        options.body = JSON.stringify(body);
      }
      await authedFetch(`${API_BASE}${path}`, options);

      // If resetting session, optimistically clear session lock & lastIp for that team
      if (path.includes('/reset-session')) {
        const teamId = path.split('/teams/')[1]?.split('/')[0];
        if (teamId) {
          setTeams((prev) =>
            prev.map((t) => (t._id === teamId ? { ...t, activeSessionToken: null, lastIp: null } : t))
          );
        }
      }

      await fetchDashboardData();
      setActionStatus((prev) => ({ ...prev, [actionKey]: 'success' }));
      if (successTitle) showBanner(successTitle, '', 'success');
      window.setTimeout(() => {
        setActionStatus((prev) => {
          const next = { ...prev };
          delete next[actionKey];
          return next;
        });
      }, 1200);
    } catch (err) {
      setActionStatus((prev) => ({ ...prev, [actionKey]: 'error' }));
      showBanner('Action Failed', err.message, 'error');
      window.setTimeout(() => {
        setActionStatus((prev) => {
          const next = { ...prev };
          delete next[actionKey];
          return next;
        });
      }, 2000);
    }
  };

  const handleClearSubmissions = async () => {
    if (!window.confirm("WARNING: This will permanently delete all photo submissions and Supabase images. Team clue progress, scores, and timer states will NOT be affected. Are you sure?")) {
      return;
    }
    setClearSubmissionsLoading(true);
    try {
      await authedFetch(`${API_BASE}/admin/submissions/clear`, { method: 'POST' });
      setSubmissions([]);
      showBanner('Submissions Cleared', 'Submissions removed. Team progress preserved.', 'success');
    } catch (err) {
      showBanner('Reset failed', err.message, 'error');
    } finally {
      setClearSubmissionsLoading(false);
    }
  };

  const handleOpenEditTeam = (team) => {
    setEditingTeam(team);
    setEditForm({
      name: team.name || '',
      status: team.status || 'not_started',
      score: team.score || 0,
      currentClueIndex: team.currentClueIndex || 0,
      assignedRouteId: team.assignedRouteId || '',
    });
  };

  const handleSaveTeamEdit = async (e) => {
    e.preventDefault();
    if (!editingTeam) return;
    try {
      await authedFetch(`${API_BASE}/admin/teams/${editingTeam._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });
      showBanner('Team Updated', `Team "${editForm.name}" updated successfully.`);
      setEditingTeam(null);
      fetchDashboardData().catch(() => {});
    } catch (err) {
      showBanner('Update Failed', err.message, 'error');
    }
  };

  const handleDeleteTeam = async (team) => {
    if (!window.confirm(`⚠️ DANGER: Are you sure you want to permanently delete team "${team.name}"?\n\nThis will delete their submissions, reports, and unassign all members.`)) {
      return;
    }
    try {
      await authedFetch(`${API_BASE}/admin/teams/${team._id}`, {
        method: 'DELETE',
      });
      showBanner('Team Deleted', `Team "${team.name}" was permanently removed.`);
      setTeams((prev) => prev.filter((t) => t._id !== team._id));
      fetchDashboardData().catch(() => {});
    } catch (err) {
      showBanner('Delete Failed', err.message, 'error');
    }
  };

  const handleDeleteReport = async (reportId) => {
    if (!window.confirm('Delete this issue report?')) return;
    try {
      await authedFetch(`${API_BASE}/admin/reports/${reportId}`, {
        method: 'DELETE',
      });
      setReports((prev) => prev.filter((r) => r._id !== reportId));
      showBanner('Report Deleted', 'Issue report removed.');
    } catch (err) {
      showBanner('Delete Failed', err.message, 'error');
    }
  };

  const handleClearAllReports = async () => {
    if (!window.confirm('⚠️ Are you sure you want to delete ALL feedback and discrepancy reports? This action cannot be undone.')) {
      return;
    }
    try {
      await authedFetch(`${API_BASE}/admin/reports/clear`, {
        method: 'DELETE',
      });
      setReports([]);
      showBanner('Reports Cleared', 'All feedback reports have been removed.');
    } catch (err) {
      showBanner('Clear Failed', err.message, 'error');
    }
  };

  const handleToggleReportStatus = async (rep) => {
    const nextStatus = rep.status === 'resolved' ? 'pending' : 'resolved';
    try {
      await authedFetch(`${API_BASE}/admin/reports/${rep._id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      setReports((prev) => prev.map((r) => (r._id === rep._id ? { ...r, status: nextStatus } : r)));
      showBanner('Report Status', `Marked as ${nextStatus.toUpperCase()}`);
    } catch (err) {
      showBanner('Status Update Failed', err.message, 'error');
    }
  };

  if (!isAdmin) {
    return (
      <div
        className="green-theme admin-dashboard"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          background: '#020709',
          padding: '20px',
          boxSizing: 'border-box',
          fontFamily: "'Share Tech Mono', monospace"
        }}
      >
        <form
          onSubmit={handleAdminLogin}
          className="cyber-panel"
          style={{
            width: '100%',
            maxWidth: '420px',
            padding: '36px 28px',
            border: '1px solid rgba(57, 255, 20, 0.4)',
            background: 'rgba(3, 14, 18, 0.95)',
            boxShadow: '0 0 30px rgba(57, 255, 20, 0.1)',
            textAlign: 'center'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
            <img 
              src="/logo1.png" 
              alt="Fundaz Logo" 
              style={{ 
                height: '36px', 
                width: '36px', 
                objectFit: 'contain',
                borderRadius: '50%',
                background: '#ffffff',
                padding: '2px',
                boxShadow: '0 0 10px rgba(255, 255, 255, 0.4)'
              }} 
            />
            <img 
              src="/aaruush_logo_clean.png" 
              alt="Aaruush '26 Logo" 
              style={{ 
                height: '32px', 
                width: 'auto', 
                objectFit: 'contain',
                filter: 'drop-shadow(0 0 8px rgba(255, 120, 0, 0.35))'
              }} 
            />
          </div>
          <div style={{ fontSize: '11px', letterSpacing: '3px', color: 'rgba(46, 229, 64, 0.8)', marginBottom: '8px' }}>
            THE PRIPYAT EXODUS — ADMIN CONSOLE
          </div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#fff', letterSpacing: '2px', marginBottom: '24px' }}>
            COMMAND ACCESS
          </div>

          <div style={{ marginBottom: '20px', textAlign: 'left' }}>
            <label
              htmlFor="admin-access-code"
              style={{
                display: 'block',
                fontSize: '11px',
                color: 'rgba(0, 229, 255, 0.85)',
                letterSpacing: '1.5px',
                marginBottom: '10px',
                textAlign: 'center'
              }}
            >
              ENTER ACCESS CODE
            </label>
            <input
              id="admin-access-code"
              type="password"
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value)}
              placeholder="••••••••"
              autoFocus
              required
              style={{
                width: '100%',
                boxSizing: 'border-box',
                background: '#01090c',
                border: '2px solid #39ff14',
                borderRadius: '6px',
                padding: '14px 16px',
                fontSize: '22px',
                color: '#39ff14',
                textAlign: 'center',
                letterSpacing: '6px',
                fontFamily: "'Share Tech Mono', monospace",
                outline: 'none',
                boxShadow: '0 0 15px rgba(57, 255, 20, 0.2)'
              }}
            />
          </div>

          {loginError && (
            <div
              style={{
                background: 'rgba(255, 77, 77, 0.15)',
                border: '1px solid #ff4d4d',
                color: '#ff6b6b',
                padding: '8px 12px',
                fontSize: '12px',
                marginBottom: '16px',
                borderRadius: '4px'
              }}
            >
              {loginError}
            </div>
          )}

          <button
            className={`cyber-btn striped ${loginLoading ? 'is-active-loading' : ''}`}
            type="submit"
            disabled={loginLoading}
            style={{
              width: '100%',
              padding: '12px',
              fontSize: '14px',
              letterSpacing: '2px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              cursor: loginLoading ? 'not-allowed' : 'pointer'
            }}
          >
            <Shield size={16} /> {loginLoading ? 'AUTHENTICATING...' : 'ENTER COMMAND CENTER'}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="green-theme admin-dashboard" style={{ minHeight: '100vh', background: '#020709', color: 'var(--green-primary)', padding: '20px', fontFamily: "'Share Tech Mono', monospace", overflowY: 'auto', overflowX: 'hidden', height: 'auto', maxWidth: '100vw', boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', gap: '16px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <img 
              src="/logo1.png" 
              alt="Fundaz Logo" 
              style={{ 
                height: '42px', 
                width: '42px', 
                objectFit: 'contain',
                borderRadius: '50%',
                background: '#ffffff',
                padding: '2px',
                boxShadow: '0 0 10px rgba(255, 255, 255, 0.4)',
                flexShrink: 0
              }} 
            />
            <img 
              src="/aaruush_logo_clean.png" 
              alt="Aaruush '26 Logo" 
              style={{ 
                height: '38px', 
                maxWidth: '190px', 
                objectFit: 'contain',
                filter: 'drop-shadow(0 0 8px rgba(255, 120, 0, 0.35))',
                flexShrink: 0
              }} 
            />
          </div>
          <div style={{ borderLeft: '1px solid rgba(57, 255, 20, 0.3)', paddingLeft: '14px' }}>
            <div style={{ fontSize: '22px', color: '#fff', fontWeight: 'bold', letterSpacing: '1px' }}>ADMIN DASHBOARD</div>
            <div style={{ fontSize: '11px', color: 'rgba(0,240,255,0.6)' }}>Live QR onboarding, sockets, timers, map telemetry</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Total Participants & Teams Header Badge */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            background: 'linear-gradient(135deg, rgba(2, 24, 30, 0.85), rgba(1, 14, 18, 0.9))',
            border: '1px solid rgba(0, 240, 255, 0.45)',
            padding: '6px 14px',
            fontFamily: "'Share Tech Mono', monospace",
            fontSize: '11px',
            boxShadow: '0 0 12px rgba(0, 240, 255, 0.15)',
            borderRadius: '4px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
              <Users size={15} color="#00f0ff" />
              <span style={{ color: 'rgba(0, 240, 255, 0.85)', letterSpacing: '0.5px' }}>TOTAL PARTICIPANTS:</span>
              <span style={{
                fontWeight: 'bold',
                color: '#00f0ff',
                fontSize: '15px',
                textShadow: '0 0 10px rgba(0, 240, 255, 0.7)'
              }}>
                {totalParticipantCount}
              </span>
            </div>
            <span style={{ color: 'rgba(255, 255, 255, 0.25)', userSelect: 'none' }}>|</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
              <span style={{ color: 'rgba(57, 255, 20, 0.85)', letterSpacing: '0.5px' }}>TEAMS:</span>
              <span style={{
                fontWeight: 'bold',
                color: '#39ff14',
                fontSize: '15px',
                textShadow: '0 0 10px rgba(57, 255, 20, 0.7)'
              }}>
                {teams.length}
              </span>
            </div>
          </div>

          {/* ML Core status indicator */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(2, 20, 24, 0.6)',
            border: '1px solid rgba(57, 255, 20, 0.25)',
            padding: '6px 12px',
            fontFamily: "'Share Tech Mono', monospace",
            fontSize: '11px',
            color: 'var(--green-primary)',
            boxShadow: '0 0 10px rgba(57, 255, 20, 0.05)',
            marginRight: '10px'
          }}>
            <span>ML_CORE_STATUS:</span>
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: mlStatus === 'green' ? '#39ff14' : mlStatus === 'orange' ? '#ffaa00' : '#ff3333',
              boxShadow: mlStatus === 'green'
                ? '0 0 8px #39ff14'
                : mlStatus === 'orange'
                ? '0 0 8px #ffaa00'
                : '0 0 8px #ff3333',
              animation: mlStatus === 'orange' ? 'ml-status-pulse 1s infinite alternate' : 'none'
            }} />
            <span style={{
              fontWeight: 'bold',
              color: mlStatus === 'green' ? '#39ff14' : mlStatus === 'orange' ? '#ffaa00' : '#ff3333'
            }}>
              {mlStatus.toUpperCase()}
            </span>
            {mlStatus !== 'green' && (
              <button
                className="cyber-btn-outline"
                onClick={handleWakeupML}
                disabled={mlStatus === 'orange' || isWaking}
                style={{
                  padding: '2px 8px',
                  fontSize: '9px',
                  borderColor: mlStatus === 'orange' ? '#ffaa00' : 'var(--green-primary)',
                  color: mlStatus === 'orange' ? '#ffaa00' : 'var(--green-primary)',
                  marginLeft: '10px',
                  cursor: (mlStatus === 'orange' || isWaking) ? 'not-allowed' : 'pointer'
                }}
              >
                {mlStatus === 'orange' ? 'WAKING...' : 'WAKE UP ML'}
              </button>
            )}
          </div>

          <style>{`
            @keyframes ml-status-pulse {
              from { opacity: 0.3; }
              to { opacity: 1; }
            }
          `}</style>

          <button className="cyber-btn-outline" onClick={fetchDashboardData}>
            <RefreshCw size={14} /> REFRESH
          </button>
          <button className="cyber-btn-outline" onClick={handleLogout}>
            <Power size={14} /> LOGOUT
          </button>
        </div>
      </div>

      {/* System State Toggles & Test Dev Mode Banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(3, 20, 26, 0.9), rgba(1, 10, 15, 0.95))',
        border: '1px solid rgba(0, 240, 255, 0.3)',
        borderRadius: '10px',
        padding: '14px 18px',
        marginBottom: '20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '16px',
        flexWrap: 'wrap',
        boxShadow: '0 0 15px rgba(0, 240, 255, 0.1)'
      }}>
        <div style={{ display: 'flex', gap: '24px', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Toggle 1: Test Dev Mode */}
          <div
            onClick={handleToggleTestDevMode}
            role="button"
            tabIndex={0}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              cursor: 'pointer',
              userSelect: 'none',
              padding: '4px 8px',
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.03)',
              border: `1px solid ${systemState.testDevMode ? 'rgba(255, 170, 0, 0.4)' : 'rgba(255, 255, 255, 0.08)'}`,
              transition: 'all 0.2s ease'
            }}
          >
            <div
              style={{
                width: '46px',
                height: '24px',
                borderRadius: '12px',
                background: systemState.testDevMode ? 'rgba(255, 170, 0, 0.3)' : 'rgba(255, 255, 255, 0.1)',
                border: `1px solid ${systemState.testDevMode ? '#ffaa00' : 'rgba(255, 255, 255, 0.2)'}`,
                position: 'relative',
                transition: 'all 0.3s ease',
                flexShrink: 0
              }}
            >
              <div style={{
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                background: systemState.testDevMode ? '#ffaa00' : 'rgba(255, 255, 255, 0.5)',
                position: 'absolute',
                top: '2px',
                left: systemState.testDevMode ? '24px' : '3px',
                transition: 'all 0.3s ease',
                boxShadow: systemState.testDevMode ? '0 0 8px #ffaa00' : 'none'
              }} />
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 'bold', color: systemState.testDevMode ? '#ffaa00' : '#fff' }}>
                TEST DEV MODE SLIDER
              </div>
              <div style={{ fontSize: '10px', color: systemState.testDevMode ? '#ffaa00' : 'rgba(255,255,255,0.4)' }}>
                {systemState.testDevMode ? '[ ACTIVE: DEV MODE ENABLED ]' : '[ INACTIVE: PRODUCTION MODE ]'}
              </div>
            </div>
          </div>

          {/* Toggle 2: GPS Coordinate Mapping */}
          <div
            onClick={handleToggleCoordMapping}
            role="button"
            tabIndex={0}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              cursor: 'pointer',
              userSelect: 'none',
              padding: '4px 8px',
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.03)',
              border: `1px solid ${systemState.coordMappingEnabled ? 'rgba(57, 255, 20, 0.4)' : 'rgba(255, 255, 255, 0.08)'}`,
              transition: 'all 0.2s ease'
            }}
          >
            <div
              style={{
                width: '46px',
                height: '24px',
                borderRadius: '12px',
                background: systemState.coordMappingEnabled ? 'rgba(57, 255, 20, 0.3)' : 'rgba(255, 255, 255, 0.1)',
                border: `1px solid ${systemState.coordMappingEnabled ? '#39ff14' : 'rgba(255, 255, 255, 0.2)'}`,
                position: 'relative',
                transition: 'all 0.3s ease',
                flexShrink: 0
              }}
            >
              <div style={{
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                background: systemState.coordMappingEnabled ? '#39ff14' : 'rgba(255, 255, 255, 0.5)',
                position: 'absolute',
                top: '2px',
                left: systemState.coordMappingEnabled ? '24px' : '3px',
                transition: 'all 0.3s ease',
                boxShadow: systemState.coordMappingEnabled ? '0 0 8px #39ff14' : 'none'
              }} />
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 'bold', color: systemState.coordMappingEnabled ? '#39ff14' : '#fff' }}>
                GPS COORDINATE MAPPING TOGGLE
              </div>
              <div style={{ fontSize: '10px', color: systemState.coordMappingEnabled ? '#39ff14' : 'rgba(255,255,255,0.4)' }}>
                {systemState.coordMappingEnabled ? '[ ACTIVE: ML VERIFICATION + TARGET GPS MAPPING REQUIRED ]' : '[ INACTIVE: STANDARD OPTIC ML VERIFICATION ONLY ]'}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <button className={`cyber-btn-outline ${activeTab === 'teams' ? 'glow-text' : ''}`} onClick={() => setActiveTab('teams')}>
          <Users size={14} /> Teams ({teams.length})
        </button>
        <button className={`cyber-btn-outline ${activeTab === 'payments' ? 'glow-text' : ''}`} onClick={() => setActiveTab('payments')} style={{ borderColor: 'rgba(57,255,20,0.5)', color: '#39ff14' }}>
          <Shield size={14} /> Payment Verification ({teams.filter(t => t.paymentVerified).length}/{teams.length})
        </button>
        <button className={`cyber-btn-outline ${activeTab === 'map' ? 'glow-text' : ''}`} onClick={() => setActiveTab('map')}>
          <Map size={14} /> Map
        </button>
        <button className={`cyber-btn-outline ${activeTab === 'submissions' ? 'glow-text' : ''}`} onClick={() => setActiveTab('submissions')}>
          <Activity size={14} /> Submissions
        </button>
        <button className={`cyber-btn-outline ${activeTab === 'reports' ? 'glow-text' : ''}`} onClick={() => setActiveTab('reports')} style={{ borderColor: reports.length > 0 ? '#ffaa00' : 'rgba(57,255,20,0.4)' }}>
          <Shield size={14} /> Test Reports ({reports.length})
        </button>
      </div>

      {activeTab === 'submissions' && (
        <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
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
              className="cyber-btn-outline"
              style={{ borderColor: '#00e5ff', color: '#00e5ff', padding: '6px 14px', fontSize: '11px', cursor: 'pointer' }}
              onClick={handleDownloadSubmissionsCSV}
            >
              📥 DOWNLOAD SUBMISSIONS CSV
            </button>
          </div>

          <button 
            className={`cyber-btn ${clearSubmissionsLoading ? 'is-active-loading' : ''}`} 
            style={{ background: '#7f1d1d', border: '1px solid #ef4444', color: '#fca5a5', padding: '8px 16px', fontSize: '11px', cursor: clearSubmissionsLoading ? 'wait' : 'pointer' }} 
            onClick={handleClearSubmissions}
            disabled={clearSubmissionsLoading}
          >
            {clearSubmissionsLoading ? 'CLEARING SUBMISSIONS...' : 'CLEAR ALL SUBMISSIONS (PRESERVE TEAMS)'}
          </button>
        </div>
      )}

      {activeTab === 'teams' && (
        <div style={{ display: 'grid', gap: '14px' }}>
          {/* Leaderboard & Time Rankings Controls */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'rgba(3,12,15,0.85)',
            border: '1px solid rgba(255,215,0,0.3)',
            padding: '12px 18px',
            borderRadius: '8px',
            flexWrap: 'wrap',
            gap: '12px',
            backdropFilter: 'blur(10px)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Trophy size={18} color="#ffd700" />
                <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#ffd700', letterSpacing: '1px' }}>
                  LIVE LEADERBOARD & TIME RANKINGS ({mergedTeams.length} TEAMS • {totalParticipantCount} PARTICIPANTS)
                </span>
              </div>
              <button
                className="cyber-btn-outline"
                style={{ borderColor: '#39ff14', color: '#39ff14', padding: '6px 14px', fontSize: '11px', cursor: 'pointer' }}
                onClick={handleDownloadTeamsCSV}
              >
                📥 DOWNLOAD TEAMS CSV
              </button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)' }}>SORT / RANK BY:</span>
              <select
                value={teamSortMode}
                onChange={(e) => setTeamSortMode(e.target.value)}
                style={{
                  background: '#020b0d',
                  color: '#ffd700',
                  border: '1px solid #ffd700',
                  padding: '6px 12px',
                  fontSize: '11px',
                  fontFamily: "'Share Tech Mono', monospace",
                  outline: 'none',
                  cursor: 'pointer',
                  borderRadius: '4px'
                }}
              >
                <option value="time">FASTEST TIME & COMPLETION (DEFAULT)</option>
                <option value="pure_time">PURE TIME SPENT (LEAST TO MOST)</option>
                <option value="name">TEAM NAME (A - Z)</option>
              </select>
            </div>
          </div>


          {mergedTeams.map((team, index) => {
            const isExpanded = !!expandedTeams[team._id];
            const currentElapsed = getTeamElapsed(team);
            const rankLabel = index === 0 ? '🏆 RANK #1' : index === 1 ? '🥈 RANK #2' : index === 2 ? '🥉 RANK #3' : `RANK #${index + 1}`;
            const rankColor = index === 0 ? '#ffd700' : index === 1 ? '#e2e8f0' : index === 2 ? '#cd7f32' : 'rgba(255,255,255,0.7)';
            const rankBg = index === 0 ? 'rgba(255,215,0,0.18)' : index === 1 ? 'rgba(226,232,240,0.12)' : index === 2 ? 'rgba(205,127,50,0.15)' : 'rgba(255,255,255,0.06)';
            const rankBorder = index === 0 ? '#ffd700' : index === 1 ? '#cbd5e1' : index === 2 ? '#cd7f32' : 'rgba(255,255,255,0.2)';

            return (
              <div
                key={team._id}
                style={{
                  border: `1px solid ${team.timerRunning ? 'rgba(57,255,20,0.45)' : 'rgba(57,255,20,0.2)'}`,
                  background: team.timerRunning ? 'rgba(3, 16, 18, 0.85)' : 'rgba(3,12,15,0.75)',
                  padding: '16px',
                  borderRadius: '8px',
                  backdropFilter: 'blur(12px)',
                  boxShadow: team.timerRunning ? '0 0 16px rgba(57,255,20,0.12)' : 'none',
                  transition: 'all 0.2s ease'
                }}
              >
                <div 
                  onClick={() => toggleTeam(team._id)}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', userSelect: 'none', flexWrap: 'wrap', gap: '12px' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                    <span style={{
                      fontSize: '12px',
                      fontWeight: 'bold',
                      padding: '4px 10px',
                      borderRadius: '4px',
                      background: rankBg,
                      color: rankColor,
                      border: `1px solid ${rankBorder}`,
                      letterSpacing: '1px'
                    }}>
                      {rankLabel}
                    </span>
                    <span style={{ color: '#fff', fontSize: '18px', fontWeight: 'bold' }}>{team.name}</span>
                    <span style={{
                      fontSize: '10px',
                      fontWeight: 'bold',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      background: team.status === 'finished' ? 'rgba(0,229,255,0.2)' : team.status === 'in_progress' ? 'rgba(57,255,20,0.2)' : 'rgba(255,255,255,0.1)',
                      color: team.status === 'finished' ? '#00e5ff' : team.status === 'in_progress' ? '#39ff14' : '#fff',
                      border: `1px solid ${team.status === 'finished' ? '#00e5ff' : team.status === 'in_progress' ? '#39ff14' : 'rgba(255,255,255,0.3)'}`
                    }}>
                      {team.status.toUpperCase()}
                    </span>
                    <span style={{ fontSize: '11px', color: 'rgba(57,255,20,0.8)' }}>
                      SCORE: <strong>{team.score || 0}</strong> | CLUE: <strong>{(team.currentClueIndex || 0) + 1}</strong>
                    </span>
                    <span style={{ fontSize: '11px', color: '#00e5ff', fontWeight: 'bold' }}>
                      ROUTE: {team.assignedRouteName ? `${team.assignedRouteName} (#${team.assignedRouteId})` : 'Auto'}
                    </span>
                  </div>

                  {/* PROMINENT DIGITAL TIMER BADGE IN CARD HEADER */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      background: team.timerRunning ? 'rgba(57, 255, 20, 0.12)' : 'rgba(0, 0, 0, 0.55)',
                      border: `1px solid ${team.timerRunning ? '#39ff14' : team.status === 'finished' ? '#00e5ff' : 'rgba(255, 170, 0, 0.5)'}`,
                      borderRadius: '6px',
                      padding: '6px 14px',
                      boxShadow: team.timerRunning ? '0 0 12px rgba(57, 255, 20, 0.3)' : 'none'
                    }}>
                      <Clock size={16} color={team.timerRunning ? '#39ff14' : team.status === 'finished' ? '#00e5ff' : '#ffaa00'} />
                      <span style={{
                        fontSize: '20px',
                        fontWeight: 'bold',
                        fontFamily: "'Share Tech Mono', monospace",
                        color: team.timerRunning ? '#39ff14' : team.status === 'finished' ? '#00e5ff' : '#fff',
                        letterSpacing: '1.5px',
                        textShadow: team.timerRunning ? '0 0 10px rgba(57, 255, 20, 0.7)' : 'none'
                      }}>
                        {formatElapsed(currentElapsed)}
                      </span>
                      <span style={{
                        fontSize: '9px',
                        fontWeight: 'bold',
                        padding: '2px 6px',
                        borderRadius: '3px',
                        background: team.timerRunning ? 'rgba(57, 255, 20, 0.25)' : 'rgba(255, 255, 255, 0.1)',
                        color: team.timerRunning ? '#39ff14' : team.status === 'finished' ? '#00e5ff' : '#ffaa00',
                        border: `1px solid ${team.timerRunning ? '#39ff14' : 'rgba(255,255,255,0.2)'}`
                      }}>
                        {team.timerRunning ? 'LIVE' : team.status === 'finished' ? 'DONE' : 'STOP'}
                      </span>
                    </div>

                    <div style={{ fontSize: '11px', color: 'var(--green-primary)' }}>
                      {isExpanded ? '[- COLLAPSE]' : '[+ EXPAND]'}
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="admin-team-card-content" style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(57,255,20,0.1)' }}>
                    <div className="admin-team-info-col">
                      {/* Large HUD Mission Timer Box in Expanded View */}
                      <div style={{
                        padding: '12px 16px',
                        background: 'rgba(0, 0, 0, 0.45)',
                        border: `1px solid ${team.timerRunning ? '#39ff14' : 'rgba(255, 255, 255, 0.2)'}`,
                        borderRadius: '6px',
                        marginBottom: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '10px'
                      }}>
                        <div>
                          <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', letterSpacing: '1px' }}>
                            OFFICIAL MISSION TIMER:
                          </div>
                          <div style={{
                            fontSize: '24px',
                            fontWeight: 'bold',
                            fontFamily: "'Share Tech Mono', monospace",
                            color: team.timerRunning ? '#39ff14' : team.status === 'finished' ? '#00e5ff' : '#ffaa00',
                            textShadow: team.timerRunning ? '0 0 12px rgba(57,255,20,0.6)' : 'none'
                          }}>
                            ⏱️ {formatElapsed(currentElapsed)}
                          </div>
                        </div>
                        <span style={{
                          fontSize: '11px',
                          padding: '4px 10px',
                          borderRadius: '4px',
                          fontWeight: 'bold',
                          border: `1px solid ${team.timerRunning ? '#39ff14' : 'rgba(255,255,255,0.3)'}`,
                          background: team.timerRunning ? 'rgba(57,255,20,0.15)' : 'rgba(255,255,255,0.05)',
                          color: team.timerRunning ? '#39ff14' : 'rgba(255,255,255,0.7)'
                        }}>
                          {team.timerRunning ? '● LIVE TICKING' : team.status === 'finished' ? '✔ COMPLETED' : '■ TIMER STOPPED'}
                        </span>
                      </div>

                      {/* IP and Session Status Badge */}
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', marginTop: '6px', marginBottom: '8px' }}>
                        <span style={{
                          fontSize: '11px',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          fontWeight: 'bold',
                          border: `1px solid ${team.activeSessionToken ? '#39ff14' : '#64748b'}`,
                          background: team.activeSessionToken ? 'rgba(57,255,20,0.15)' : 'rgba(100,116,139,0.15)',
                          color: team.activeSessionToken ? '#39ff14' : '#94a3b8',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px'
                        }}>
                          {team.activeSessionToken ? '🔒 DEVICE / SESSION LOCKED' : '🔓 SESSION RESET / UNLOCKED'}
                        </span>

                        <span style={{
                          fontSize: '11px',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          border: team.lastIp ? '1px solid rgba(0, 229, 255, 0.4)' : '1px solid rgba(255, 255, 255, 0.15)',
                          background: team.lastIp ? 'rgba(0, 229, 255, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                          color: team.lastIp ? '#00e5ff' : 'rgba(255, 255, 255, 0.5)',
                          fontFamily: "'Share Tech Mono', monospace"
                        }}>
                          {team.lastIp ? `IP: ${team.lastIp}` : 'IP: UNBOUND'}
                        </span>

                        {/* Payment Verification Status Badge & Toggle */}
                        <span style={{
                          fontSize: '11px',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          fontWeight: 'bold',
                          border: `1px solid ${team.paymentVerified ? '#39ff14' : '#ffaa00'}`,
                          background: team.paymentVerified ? 'rgba(57,255,20,0.15)' : 'rgba(255,170,0,0.15)',
                          color: team.paymentVerified ? '#39ff14' : '#ffaa00',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          cursor: 'pointer'
                        }}
                        onClick={(e) => { e.stopPropagation(); handleToggleVerifyPayment(team); }}
                        title="Click to toggle payment verification"
                        >
                          {team.paymentVerified ? '💳 PAYMENT VERIFIED ✓' : '💳 PAYMENT PENDING ⏳'}
                        </span>
                      </div>

                      {team.paymentScreenshotUrl && (
                        <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)' }}>PAYMENT PROOF:</span>
                          <img 
                            src={getFullPhotoUrl(team.paymentScreenshotUrl)} 
                            alt="Payment Proof"
                            onClick={(e) => { e.stopPropagation(); setSelectedPhoto(getFullPhotoUrl(team.paymentScreenshotUrl)); }}
                            style={{ width: '45px', height: '45px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #39ff14', cursor: 'zoom-in' }}
                          />
                        </div>
                      )}

                      <div style={{ fontSize: '11px', marginTop: '6px' }}>
                        GPS: {team.location?.lat ? `${team.location.lat.toFixed(5)}, ${team.location.lng.toFixed(5)}` : 'No live coordinates yet'}
                      </div>
                      <div style={{ fontSize: '11px', marginTop: '6px', color: '#fff' }}>
                        MEMBERS: {team.members?.map(m => typeof m === 'object' ? m.name : m).join(', ') || 'None'}
                      </div>


                      {/* Route Selection Dropdown */}
                      <div style={{ marginTop: '12px', padding: '10px', background: 'rgba(0,0,0,0.3)', border: `1px solid ${systemState.testDevMode ? '#ffaa00' : 'rgba(0,229,255,0.25)'}`, borderRadius: '6px' }}>
                        <div style={{ fontSize: '10px', color: systemState.testDevMode ? '#ffaa00' : '#00e5ff', fontWeight: 'bold', marginBottom: '6px', letterSpacing: '1px' }}>
                          ASSIGN TACTICAL ROUTE:
                        </div>
                        <div className="admin-route-select-row">
                          <select
                            value={teamRoutes[team._id] !== undefined ? teamRoutes[team._id] : (team.assignedRouteId || '')}
                            onChange={(e) => setTeamRoutes((prev) => ({ ...prev, [team._id]: e.target.value }))}
                            style={{
                              background: '#020d10',
                              color: '#39ff14',
                              border: '1px solid rgba(57,255,20,0.4)',
                              padding: '6px 10px',
                              fontSize: '11px',
                              fontFamily: "'Share Tech Mono', monospace",
                              outline: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              flex: '1',
                              width: '100%',
                              minWidth: '0'
                            }}
                          >
                            <option value="">-- SELECT ROUTE --</option>
                            {allRoutes.map((r) => (
                              <option key={r.routeId} value={r.routeId}>
                                Route {r.routeId} ({r.distance}) — {r.locations.slice(0, 3).join(', ')}...
                              </option>
                            ))}
                          </select>

                          <button
                            className={`cyber-btn-outline ${actionStatus[`route-${team._id}`] === 'loading' ? 'is-active-loading' : ''} ${actionStatus[`route-${team._id}`] === 'success' ? 'is-active-success' : ''}`}
                            style={{ padding: '6px 12px', fontSize: '10px', borderColor: '#00e5ff', color: '#00e5ff' }}
                            disabled={actionStatus[`route-${team._id}`] === 'loading'}
                            onClick={(e) => {
                              e.stopPropagation();
                              const selectedRId = teamRoutes[team._id] !== undefined ? teamRoutes[team._id] : team.assignedRouteId;
                              runAction(`route-${team._id}`, `/admin/teams/${team._id}/assign-route`, `Route assigned`, { routeId: selectedRId });
                            }}
                          >
                            {actionStatus[`route-${team._id}`] === 'loading' ? 'SAVING...' : actionStatus[`route-${team._id}`] === 'success' ? '✓ SAVED' : 'SAVE ROUTE'}
                          </button>
                        </div>
                      </div>

                      {team.completedClues && team.completedClues.length > 0 && (
                        <div style={{ marginTop: '10px' }}>
                          <div style={{ fontSize: '11px', color: 'rgba(57,255,20,0.6)', fontWeight: 'bold' }}>COMPLETED CLUES:</div>
                          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '4px' }}>
                            {team.completedClues.map((c, i) => (
                              <span key={i} style={{ fontSize: '9px', padding: '2px 6px', background: 'rgba(57,255,20,0.1)', border: '1px solid rgba(57,255,20,0.3)', color: '#fff' }}>
                                CLUE {i+1}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="admin-team-btn-grid">
                      <button
                        className="cyber-btn-outline"
                        onClick={(e) => { e.stopPropagation(); setSelectedQR(team); }}
                      >
                        <QrCode size={14} /> VIEW QR
                      </button>

                      <button
                        className={`cyber-btn striped ${actionStatus[`start-${team._id}`] === 'loading' ? 'is-active-loading' : ''} ${actionStatus[`start-${team._id}`] === 'success' ? 'is-active-success' : ''}`}
                        disabled={actionStatus[`start-${team._id}`] === 'loading'}
                        onClick={(e) => {
                          e.stopPropagation();
                          runAction(`start-${team._id}`, `/admin/teams/${team._id}/start`, 'Mission started', { routeId: teamRoutes[team._id] || team.assignedRouteId });
                        }}
                      >
                        <Play size={14} /> {actionStatus[`start-${team._id}`] === 'loading' ? 'STARTING...' : actionStatus[`start-${team._id}`] === 'success' ? '✓ STARTED' : 'START'}
                      </button>

                      <button
                        className={`cyber-btn-outline ${actionStatus[`stop-${team._id}`] === 'loading' ? 'is-active-loading' : ''} ${actionStatus[`stop-${team._id}`] === 'success' ? 'is-active-success' : ''}`}
                        disabled={actionStatus[`stop-${team._id}`] === 'loading'}
                        onClick={(e) => {
                          e.stopPropagation();
                          runAction(`stop-${team._id}`, `/admin/teams/${team._id}/stop`, 'Timer stopped');
                        }}
                      >
                        <Power size={14} /> {actionStatus[`stop-${team._id}`] === 'loading' ? 'STOPPING...' : actionStatus[`stop-${team._id}`] === 'success' ? '✓ STOPPED' : 'STOP TIMER'}
                      </button>

                      <button
                        className={`cyber-btn-outline ${actionStatus[`skip-${team._id}`] === 'loading' ? 'is-active-loading' : ''} ${actionStatus[`skip-${team._id}`] === 'success' ? 'is-active-success' : ''}`}
                        disabled={actionStatus[`skip-${team._id}`] === 'loading'}
                        onClick={(e) => {
                          e.stopPropagation();
                          runAction(`skip-${team._id}`, `/admin/teams/${team._id}/clue-override`, 'Clue skipped');
                        }}
                      >
                        <SkipForward size={14} /> {actionStatus[`skip-${team._id}`] === 'loading' ? 'SKIPPING...' : actionStatus[`skip-${team._id}`] === 'success' ? '✓ SKIPPED' : 'SKIP CLUE'}
                      </button>

                      <button
                        className={`cyber-btn-outline ${actionStatus[`reset-m-${team._id}`] === 'loading' ? 'is-active-loading' : ''} ${actionStatus[`reset-m-${team._id}`] === 'success' ? 'is-active-success' : ''}`}
                        disabled={actionStatus[`reset-m-${team._id}`] === 'loading'}
                        onClick={(e) => {
                          e.stopPropagation();
                          runAction(`reset-m-${team._id}`, `/admin/teams/${team._id}/reset`, 'Mission reset');
                        }}
                      >
                        <RefreshCw size={14} /> {actionStatus[`reset-m-${team._id}`] === 'loading' ? 'RESETTING...' : actionStatus[`reset-m-${team._id}`] === 'success' ? '✓ RESET' : 'RESET MISSION'}
                      </button>

                      <button
                        className={`cyber-btn-outline ${actionStatus[`reset-s-${team._id}`] === 'loading' ? 'is-active-loading' : ''} ${actionStatus[`reset-s-${team._id}`] === 'success' ? 'is-active-success' : ''}`}
                        disabled={actionStatus[`reset-s-${team._id}`] === 'loading'}
                        style={{ borderColor: '#f59e0b', color: '#fbbf24' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          runAction(`reset-s-${team._id}`, `/admin/teams/${team._id}/reset-session`, 'Session reset');
                        }}
                      >
                        <RefreshCw size={14} /> {actionStatus[`reset-s-${team._id}`] === 'loading' ? 'RESETTING...' : actionStatus[`reset-s-${team._id}`] === 'success' ? '✓ IP RESET' : 'RESET IP/SESSION'}
                      </button>

                      <button
                        className="cyber-btn-outline"
                        style={{ borderColor: '#00e5ff', color: '#00e5ff' }}
                        onClick={(e) => { e.stopPropagation(); handleOpenEditTeam(team); }}
                      >
                        <Edit3 size={14} /> EDIT TEAM
                      </button>

                      <button
                        className="cyber-btn-outline"
                        style={{ borderColor: '#ef4444', color: '#f87171' }}
                        onClick={(e) => { e.stopPropagation(); handleDeleteTeam(team); }}
                      >
                        <Trash2 size={14} /> DELETE TEAM
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {activeTab === 'payments' && (
        <div style={{ display: 'grid', gap: '14px', maxHeight: '72vh', overflowY: 'auto', paddingRight: '6px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(3,12,15,0.85)', padding: '12px 18px', border: '1px solid rgba(57,255,20,0.3)', borderRadius: '8px', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ color: '#39ff14', fontWeight: 'bold', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Shield size={16} /> REGISTRATION PAYMENT VERIFICATION LOG ({teams.length} TOTAL TEAMS)
            </div>
            <div style={{ display: 'flex', gap: '12px', fontSize: '11px' }}>
              <span style={{ color: '#39ff14', background: 'rgba(57,255,20,0.1)', padding: '4px 10px', border: '1px solid #39ff14', borderRadius: '4px' }}>
                VERIFIED: {teams.filter(t => t.paymentVerified).length}
              </span>
              <span style={{ color: '#ffaa00', background: 'rgba(255,170,0,0.1)', padding: '4px 10px', border: '1px solid #ffaa00', borderRadius: '4px' }}>
                PENDING: {teams.filter(t => !t.paymentVerified).length}
              </span>
            </div>
          </div>

          {teams.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.4)', border: '1px dashed rgba(57,255,20,0.2)', background: 'rgba(4,18,23,0.4)' }}>
              NO TEAMS REGISTERED YET
            </div>
          ) : (
            teams.map((team) => {
              const photoUrl = getFullPhotoUrl(team.paymentScreenshotUrl);
              return (
                <div
                  key={team._id}
                  style={{
                    background: 'rgba(4, 18, 23, 0.85)',
                    border: `1px solid ${team.paymentVerified ? 'rgba(57,255,20,0.4)' : 'rgba(255,170,0,0.4)'}`,
                    padding: '16px',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '20px',
                    flexWrap: 'wrap',
                    boxShadow: team.paymentVerified ? '0 0 10px rgba(57,255,20,0.05)' : '0 0 10px rgba(255,170,0,0.05)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                    {/* Payment Screenshot Thumbnail */}
                    {photoUrl ? (
                      <div
                        onClick={() => setSelectedPhoto(photoUrl)}
                        style={{
                          width: '90px',
                          height: '90px',
                          cursor: 'zoom-in',
                          overflow: 'hidden',
                          border: `2px solid ${team.paymentVerified ? '#39ff14' : '#ffaa00'}`,
                          borderRadius: '6px',
                          position: 'relative'
                        }}
                      >
                        <img
                          src={photoUrl}
                          alt="Payment Screenshot"
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </div>
                    ) : (
                      <div style={{
                        width: '90px',
                        height: '90px',
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px dashed rgba(255,255,255,0.2)',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '9px',
                        color: 'rgba(255,255,255,0.4)',
                        textAlign: 'center',
                        padding: '4px'
                      }}>
                        NO SCREENSHOT
                      </div>
                    )}

                    {/* Details */}
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#fff' }}>{team.name}</span>
                        <span style={{ fontSize: '11px', color: 'rgba(0,240,255,0.8)', fontFamily: 'Courier New, monospace' }}>
                          [{team.teamNumber || 'N/A'}]
                        </span>
                      </div>
                      <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', marginTop: '4px' }}>
                        MEMBERS ({team.members?.length || 0}): {team.members?.map(m => typeof m === 'object' ? m.name : m).join(', ') || 'None'}
                      </div>
                      <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', marginTop: '4px' }}>
                        REGISTERED: {team.createdAt ? new Date(team.createdAt).toLocaleString() : 'N/A'}
                      </div>
                    </div>
                  </div>

                  {/* Right Status & Toggle Button */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{
                      fontSize: '10px',
                      fontWeight: 'bold',
                      padding: '4px 10px',
                      borderRadius: '4px',
                      letterSpacing: '1px',
                      background: team.paymentVerified ? 'rgba(57,255,20,0.15)' : 'rgba(255,170,0,0.15)',
                      color: team.paymentVerified ? '#39ff14' : '#ffaa00',
                      border: `1px solid ${team.paymentVerified ? '#39ff14' : '#ffaa00'}`
                    }}>
                      {team.paymentVerified ? 'VERIFIED ✓' : 'PENDING ⏳'}
                    </span>

                    <button
                      onClick={() => handleToggleVerifyPayment(team)}
                      style={{
                        padding: '8px 16px',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        fontFamily: "'Share Tech Mono', monospace",
                        background: team.paymentVerified ? 'rgba(255,170,0,0.2)' : 'rgba(57,255,20,0.2)',
                        color: team.paymentVerified ? '#ffaa00' : '#39ff14',
                        border: `1px solid ${team.paymentVerified ? '#ffaa00' : '#39ff14'}`,
                        borderRadius: '4px'
                      }}
                    >
                      {team.paymentVerified ? 'MARK AS UNVERIFIED' : 'ACCEPT & VERIFY PAYMENT'}
                    </button>
                  </div>
                </div>
              );
            })
          )}
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
                    pathOptions={{ color: team.timerRunning ? '#39ff14' : '#ffb84d', fillOpacity: 0.75 }}
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
        <div style={{ display: 'grid', gap: '14px', maxHeight: '68vh', overflowY: 'auto', paddingRight: '6px' }}>
          {filteredSubmissions.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '40px 20px',
              color: 'rgba(255,255,255,0.4)',
              fontFamily: 'var(--font-mono, monospace)',
              border: '1px dashed rgba(57,255,20,0.2)',
              background: 'rgba(4, 18, 23, 0.4)'
            }}>
              NO SUBMISSIONS RECORDED YET {selectedTeamFilter !== 'all' ? 'FOR THIS TEAM' : ''}
            </div>
          ) : (
            filteredSubmissions.map((submission) => {
              const isExpanded = !!expandedSubmissions[submission._id];
              const photoUrl = getFullPhotoUrl(submission.photoUrl);
              const matchLocation = getClueLocationText(submission.clue);
              const clueText = getClueText(submission.clue);

              return (
                <div
                  key={submission._id}
                  style={{
                    border: `1px solid ${submission.isCorrect ? 'rgba(57,255,20,0.3)' : 'rgba(255,100,0,0.3)'}`,
                    background: 'rgba(4, 18, 23, 0.85)',
                    padding: '16px',
                    boxShadow: submission.isCorrect ? '0 0 10px rgba(57,255,20,0.05)' : '0 0 10px rgba(255,100,0,0.05)',
                    transition: 'all 0.3s ease'
                  }}
                >
                  <div
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', userSelect: 'none', gap: '12px', flexWrap: 'wrap' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }} onClick={() => toggleSubmission(submission._id)}>
                      {/* Photo Thumbnail in header */}
                      {photoUrl ? (
                        <img 
                          src={photoUrl} 
                          alt="Submission Photo" 
                          onClick={(e) => { e.stopPropagation(); setSelectedPhoto(photoUrl); }}
                          style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '4px', border: `1px solid ${submission.isCorrect ? '#39ff14' : '#ffaa00'}`, cursor: 'zoom-in' }}
                        />
                      ) : null}

                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ color: '#fff', fontSize: '15px', fontWeight: 'bold' }}>{submission.team?.name || 'Unknown Team'}</span>
                          <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>
                            ({new Date(submission.createdAt).toLocaleTimeString()})
                          </span>
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--green-primary)', marginTop: '2px' }}>
                          CLUE {submission.clue?.order || '?'}: {submission.clue?.title || 'Unknown'}
                        </div>
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                      <span
                        style={{
                          fontSize: '9px',
                          letterSpacing: '1px',
                          fontWeight: 'bold',
                          padding: '2px 8px',
                          background: submission.isCorrect ? 'rgba(57,255,20,0.15)' : 'rgba(255,100,0,0.15)',
                          color: submission.isCorrect ? '#39FF14' : '#FF6400',
                          border: `1px solid ${submission.isCorrect ? '#39FF14' : '#FF6400'}`,
                        }}
                      >
                        {submission.isCorrect ? 'VERIFIED ✓' : 'REJECTED ✗'}
                      </span>

                      {/* Explicit Accept / Reject button with photo */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleSubmissionAccepted(submission);
                        }}
                        style={{
                          padding: '5px 12px',
                          fontSize: '11px',
                          fontWeight: 'bold',
                          background: submission.isCorrect ? 'rgba(255,100,0,0.2)' : 'rgba(57,255,20,0.25)',
                          color: submission.isCorrect ? '#ffaa00' : '#39ff14',
                          border: `1px solid ${submission.isCorrect ? '#ffaa00' : '#39ff14'}`,
                          cursor: 'pointer',
                          fontFamily: 'inherit',
                          borderRadius: '4px'
                        }}
                      >
                        {submission.isCorrect ? '✗ REJECT' : '✓ ACCEPT SUBMISSION'}
                      </button>

                      <span style={{ fontSize: '11px', color: 'var(--green-primary)' }} onClick={() => toggleSubmission(submission._id)}>
                        {isExpanded ? '[- COLLAPSE]' : '[+ EXPAND]'}
                      </span>
                    </div>
                  </div>

                  {isExpanded && (
                    <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(57,255,20,0.1)', display: 'flex', gap: '20px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                      {/* Left Side: Thumbnail with Click to Zoom */}
                      <div
                        onClick={() => setSelectedPhoto(photoUrl)}
                        style={{
                          width: '140px',
                          height: '140px',
                          cursor: 'zoom-in',
                          overflow: 'hidden',
                          border: `2px solid ${submission.isCorrect ? 'rgba(57,255,20,0.8)' : 'rgba(255,100,0,0.8)'}`,
                          boxShadow: '0 0 8px rgba(57,255,20,0.15)',
                          position: 'relative',
                          borderRadius: '6px'
                        }}
                      >
                        <img
                          src={photoUrl}
                          alt="Submission Snapshot"
                          loading="lazy"
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
                        <div style={{ fontSize: '12px', color: '#cbd5e1', fontStyle: 'italic', background: 'rgba(0,0,0,0.3)', padding: '6px 10px', borderLeft: '2px solid var(--green-primary)' }}>
                          &ldquo;{clueText}&rdquo;
                        </div>

                        <div style={{ fontSize: '11px', marginTop: '8px', display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '4px 12px' }}>
                          <span style={{ color: 'rgba(57,255,20,0.5)' }}>TARGET LOC:</span>
                          <span style={{ color: '#ffb84d' }}>{matchLocation}</span>

                          <span style={{ color: 'rgba(57,255,20,0.5)' }}>ML PREDICT:</span>
                          <span>{submission.mlResult?.predictedLabel || 'N/A'}</span>

                          <span style={{ color: 'rgba(57,255,20,0.5)' }}>CONFIDENCE:</span>
                          <span>{Math.round((submission.mlResult?.confidence || 0) * 100)}%</span>
                        </div>

                        <div style={{ display: 'flex', gap: '10px', marginTop: '14px', flexWrap: 'wrap' }}>
                          <button
                            onClick={() => handleToggleSubmissionAccepted(submission)}
                            style={{
                              padding: '6px 14px',
                              fontSize: '11px',
                              fontWeight: 'bold',
                              background: submission.isCorrect ? 'rgba(255,100,0,0.2)' : 'rgba(57,255,20,0.25)',
                              color: submission.isCorrect ? '#ffaa00' : '#39ff14',
                              border: `1px solid ${submission.isCorrect ? '#ffaa00' : '#39ff14'}`,
                              cursor: 'pointer',
                              fontFamily: 'inherit',
                              borderRadius: '4px'
                            }}
                          >
                            {submission.isCorrect ? 'OVERRIDE: MARK REJECTED' : '✓ ACCEPT SUBMISSION WITH PHOTO'}
                          </button>
                          <button
                            onClick={() => handleDeleteSubmission(submission._id)}
                            style={{
                              padding: '6px 14px',
                              fontSize: '11px',
                              background: 'rgba(239,68,68,0.2)',
                              color: '#f87171',
                              border: '1px solid #ef4444',
                              cursor: 'pointer',
                              fontFamily: 'inherit',
                              borderRadius: '4px'
                            }}
                          >
                            DELETE SUBMISSION
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}


      {activeTab === 'reports' && (
        <div style={{ display: 'grid', gap: '12px', maxHeight: '68vh', overflowY: 'auto', paddingRight: '6px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ fontSize: '14px', color: '#ffaa00', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Shield size={16} /> SUBMITTED FEEDBACK & DISCREPANCY REPORTS ({reports.length})
            </div>
            {reports.length > 0 && (
              <button
                className="cyber-btn"
                style={{ background: '#7f1d1d', border: '1px solid #ef4444', color: '#fca5a5', padding: '6px 14px', fontSize: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                onClick={handleClearAllReports}
              >
                <Trash2 size={13} /> CLEAR ALL REPORTS
              </button>
            )}
          </div>

          {reports.length === 0 ? (
            <div style={{ padding: '30px', textAlign: 'center', background: 'rgba(3,12,15,0.75)', border: '1px dashed rgba(57,255,20,0.3)', color: 'rgba(255,255,255,0.5)' }}>
              No feedback or issue reports submitted yet.
            </div>
          ) : (
            reports.map((rep) => (
              <div key={rep._id} style={{
                background: 'rgba(4, 18, 23, 0.85)',
                border: `1px solid ${rep.status === 'resolved' ? '#39ff14' : '#ffaa00'}`,
                padding: '14px 18px',
                borderRadius: '8px',
                boxShadow: rep.status === 'resolved' ? '0 0 10px rgba(57,255,20,0.05)' : '0 0 10px rgba(255,170,0,0.05)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ color: '#fff', fontSize: '15px', fontWeight: 'bold' }}>{rep.teamName}</span>
                    <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '4px', background: 'rgba(255,170,0,0.2)', color: '#ffaa00', border: '1px solid #ffaa00', textTransform: 'uppercase' }}>
                      {rep.category}
                    </span>
                    <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>
                      {new Date(rep.createdAt).toLocaleTimeString()}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      className="cyber-btn-outline"
                      style={{
                        fontSize: '10px',
                        fontWeight: 'bold',
                        padding: '3px 8px',
                        color: rep.status === 'resolved' ? '#39ff14' : '#ffaa00',
                        border: `1px solid ${rep.status === 'resolved' ? '#39ff14' : '#ffaa00'}`,
                        background: rep.status === 'resolved' ? 'rgba(57,255,20,0.1)' : 'rgba(255,170,0,0.1)',
                        cursor: 'pointer'
                      }}
                      onClick={() => handleToggleReportStatus(rep)}
                      title="Click to toggle between Pending and Resolved"
                    >
                      STATUS: {rep.status?.toUpperCase() || 'PENDING'} ↻
                    </button>

                    <button
                      className="cyber-btn-outline"
                      style={{ borderColor: '#ef4444', color: '#f87171', padding: '3px 8px', fontSize: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                      onClick={() => handleDeleteReport(rep._id)}
                    >
                      <Trash2 size={11} /> DELETE
                    </button>
                  </div>
                </div>

                <div style={{ fontSize: '13px', color: '#e2e8f0', marginBottom: '8px', lineHeight: '1.4' }}>
                  {rep.message}
                </div>

                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                  <span>TARGET CLUE: <strong style={{ color: '#00e5ff' }}>{rep.clueTitle}</strong></span>
                  {rep.coords?.lat && (
                    <span>GPS: <strong style={{ color: '#39ff14' }}>{rep.coords.lat.toFixed(5)}, {rep.coords.lng.toFixed(5)}</strong></span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Edit Team Modal */}
      {editingTeam && (
        <div
          onClick={() => setEditingTeam(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px',
            backdropFilter: 'blur(6px)'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '480px',
              background: '#041217',
              border: '1px solid #00e5ff',
              boxShadow: '0 0 25px rgba(0, 229, 255, 0.3)',
              borderRadius: '8px',
              padding: '24px',
              fontFamily: "'Share Tech Mono', monospace"
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid rgba(0,229,255,0.2)', paddingBottom: '10px' }}>
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#00e5ff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Edit3 size={18} /> EDIT TEAM: {editingTeam.name}
              </div>
              <button
                onClick={() => setEditingTeam(null)}
                style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '18px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveTeamEdit} style={{ display: 'grid', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)', display: 'block', marginBottom: '4px' }}>
                  TEAM NAME:
                </label>
                <input
                  type="text"
                  className="id-input"
                  value={editForm.name}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
                  required
                  style={{ width: '100%', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)', display: 'block', marginBottom: '4px' }}>
                    STATUS:
                  </label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, status: e.target.value }))}
                    style={{
                      width: '100%',
                      background: '#020b0d',
                      color: '#39ff14',
                      border: '1px solid rgba(57,255,20,0.4)',
                      padding: '8px 10px',
                      borderRadius: '4px',
                      fontFamily: "'Share Tech Mono', monospace",
                      boxSizing: 'border-box'
                    }}
                  >
                    <option value="not_started">NOT STARTED</option>
                    <option value="in_progress">IN PROGRESS</option>
                    <option value="finished">FINISHED</option>
                    <option value="disqualified">DISQUALIFIED</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)', display: 'block', marginBottom: '4px' }}>
                    SCORE:
                  </label>
                  <input
                    type="number"
                    className="id-input"
                    value={editForm.score}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, score: e.target.value }))}
                    style={{ width: '100%', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)', display: 'block', marginBottom: '4px' }}>
                    CURRENT CLUE (1-INDEXED):
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    className="id-input"
                    value={Number(editForm.currentClueIndex || 0) + 1}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, currentClueIndex: Math.max(0, parseInt(e.target.value, 10) - 1) }))}
                    style={{ width: '100%', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)', display: 'block', marginBottom: '4px' }}>
                    ASSIGNED ROUTE:
                  </label>
                  <select
                    value={editForm.assignedRouteId || ''}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, assignedRouteId: e.target.value ? Number(e.target.value) : null }))}
                    style={{
                      width: '100%',
                      background: '#020b0d',
                      color: '#00e5ff',
                      border: '1px solid rgba(0,229,255,0.4)',
                      padding: '8px 10px',
                      borderRadius: '4px',
                      fontFamily: "'Share Tech Mono', monospace",
                      boxSizing: 'border-box'
                    }}
                  >
                    <option value="">AUTO / DEFAULT</option>
                    {allRoutes.map((r) => (
                      <option key={r.routeId} value={r.routeId}>
                        Route {r.routeId} ({r.distance})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '16px' }}>
                <button
                  type="button"
                  className="cyber-btn-outline"
                  onClick={() => setEditingTeam(null)}
                  style={{ padding: '8px 16px' }}
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="cyber-btn"
                  style={{ padding: '8px 20px', background: '#00e5ff', color: '#020b0d', fontWeight: 'bold' }}
                >
                  SAVE CHANGES
                </button>
              </div>
            </form>
          </div>
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
                fontFamily: 'var(--font-sans)'
              }}
            >
              CLOSE [X]
            </button>
          </div>
        </div>
      )}

      {/* Instant, non-laggy status banner */}
      {banner && (
        <div
          style={{
            position: 'fixed',
            top: '16px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 99999,
            padding: '10px 20px',
            borderRadius: '6px',
            background:
              banner.type === 'error'
                ? 'rgba(45, 12, 12, 0.95)'
                : banner.type === 'warning'
                ? 'rgba(45, 30, 10, 0.95)'
                : 'rgba(8, 28, 16, 0.95)',
            border: `1px solid ${
              banner.type === 'error' ? '#ff4d4d' : banner.type === 'warning' ? '#f59e0b' : '#39ff14'
            }`,
            color: '#fff',
            fontSize: '12px',
            fontFamily: "'Share Tech Mono', monospace",
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            boxShadow: '0 6px 24px rgba(0,0,0,0.6)',
            pointerEvents: 'none'
          }}
        >
          <span
            style={{
              fontWeight: 'bold',
              color: banner.type === 'error' ? '#ff4d4d' : banner.type === 'warning' ? '#f59e0b' : '#39ff14'
            }}
          >
            {banner.title}
          </span>
          {banner.message && <span style={{ opacity: 0.9 }}>{banner.message}</span>}
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
