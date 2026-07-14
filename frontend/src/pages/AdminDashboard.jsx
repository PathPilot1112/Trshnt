import React, { useState, useEffect, useRef } from 'react';
import { Shield, Users, Radio, LayoutGrid, Map, FileText, Send, RefreshCw, Eye, Check, X, QrCode, Power, Activity, Terminal } from 'lucide-react';

const AdminDashboard = ({ API_BASE }) => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [adminToken, setAdminToken] = useState(() => localStorage.getItem('stalker_admin_token') || '');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1000);
  const [teams, setTeams] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [logs, setLogs] = useState([
    'LOG_EVT: Command uplink established',
    'SIG_EVT: Quantum link synchronized',
    'LOG_EVT: Telemetry server online'
  ]);
  const [activeTab, setActiveTab] = useState('Mission_Log'); // Sidebar tabs
  const [systemTime, setSystemTime] = useState(new Date().toLocaleTimeString());
  const [selectedPic, setSelectedPic] = useState(null); // Modal popup image
  const [selectedQR, setSelectedQR] = useState(null); // Modal popup team QR
  const [overrideMessage, setOverrideMessage] = useState('');
  const [selectedTeamForClue, setSelectedTeamForClue] = useState(null);

  // Resize listener
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1000);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // System time ticker
  useEffect(() => {
    const timer = setInterval(() => {
      setSystemTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch admin profile and verify session
  useEffect(() => {
    if (adminToken) {
      setIsAdmin(true);
      fetchDashboardData();
      const interval = setInterval(fetchDashboardData, 5000); // Poll dashboard data every 5s
      return () => clearInterval(interval);
    } else {
      setIsAdmin(false);
    }
  }, [adminToken]);

  const fetchDashboardData = async () => {
    try {
      // Fetch teams
      const teamsRes = await fetch(`${API_BASE}/admin/teams`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      if (teamsRes.ok) {
        const teamsData = await teamsRes.json();
        setTeams(teamsData.teams);
      }

      // Fetch photo submissions
      const subRes = await fetch(`${API_BASE}/admin/submissions`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      if (subRes.ok) {
        const subData = await subRes.json();
        setSubmissions(subData.submissions);
      }
    } catch (err) {
      console.error("Error polling admin data:", err);
    }
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (res.ok) {
        const data = await res.json();
        setAdminToken(data.token);
        localStorage.setItem('stalker_admin_token', data.token);
        setIsAdmin(true);
        setLogs(prev => [...prev, `LOG_EVT: Admin login authenticated [${data.user.name}]`]);
      } else {
        const err = await res.json();
        alert(`Login failed: ${err.message}`);
      }
    } catch (err) {
      console.error("Login failed:", err);
      alert("Failed to connect to backend server.");
    }
  };

  const handleAdminLogout = () => {
    setAdminToken('');
    localStorage.removeItem('stalker_admin_token');
    setIsAdmin(false);
  };

  const handleStartMission = async (teamId, teamName) => {
    try {
      const res = await fetch(`${API_BASE}/admin/teams/${teamId}/start`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      if (res.ok) {
        setLogs(prev => [...prev, `LOG_EVT: Mission started for ${teamName}`]);
        fetchDashboardData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleResetMission = async (teamId, teamName) => {
    if (!window.confirm(`Are you sure you want to reset all progress for ${teamName}?`)) return;
    try {
      const res = await fetch(`${API_BASE}/admin/teams/${teamId}/reset`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      if (res.ok) {
        setLogs(prev => [...prev, `LOG_EVT: Reset progress details for ${teamName}`]);
        fetchDashboardData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleClueOverride = async (teamId, teamName) => {
    try {
      const res = await fetch(`${API_BASE}/admin/teams/${teamId}/clue-override`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      if (res.ok) {
        setLogs(prev => [...prev, `SIG_EVT: Clue skipped/overridden for ${teamName}`]);
        fetchDashboardData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateMockTeam = async (e) => {
    e.preventDefault();
    const teamIdInput = e.target.team_id.value.trim();
    if (!teamIdInput) return;
    
    try {
      // Simulating registering a new team
      const res = await fetch(`${API_BASE}/teams/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operatorName: teamIdInput })
      });
      if (res.ok) {
        setLogs(prev => [...prev, `LOG_EVT: Registered new Unit ID: ${teamIdInput}`]);
        e.target.reset();
        fetchDashboardData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Helper: Format elapsed time based on startedAt
  const formatElapsedTime = (startedAt) => {
    if (!startedAt) return '--:--:--';
    const elapsedMs = Date.now() - new Date(startedAt).getTime();
    
    const sec = Math.floor((elapsedMs / 1000) % 60);
    const min = Math.floor((elapsedMs / (1000 * 60)) % 60);
    const hr = Math.floor(elapsedMs / (1000 * 60 * 60));
    
    const pad = (n) => String(n).padStart(2, '0');
    return `${pad(hr)}:${pad(min)}:${pad(sec)}`;
  };

  // Admin Login View
  if (!isAdmin) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: '#03080a',
        fontFamily: "'Share Tech Mono', monospace"
      }}>
        <div style={{
          width: '100%',
          maxWidth: '400px',
          border: '1px solid var(--cyan-primary)',
          backgroundColor: '#010608',
          boxShadow: '0 0 25px rgba(0, 240, 255, 0.25)',
          padding: '24px',
          borderRadius: '8px',
          position: 'relative'
        }}>
          <div className="laser-beam" style={{ height: '2px' }}></div>
          <div style={{
            fontSize: '18px',
            fontWeight: 'bold',
            textAlign: 'center',
            marginBottom: '20px',
            letterSpacing: '2px',
            color: 'var(--cyan-primary)'
          }} className="glitch-text" data-text="STALKER_NET // ADMIN_GATE">
            STALKER_NET // ADMIN_GATE
          </div>
          
          <form onSubmit={handleAdminLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '10px', color: 'rgba(0,240,255,0.6)', display: 'block', marginBottom: '6px' }}>
                ADMIN_MAIL
              </label>
              <input
                type="email"
                required
                className="id-input"
                placeholder="admin@stalker.net"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            
            <div>
              <label style={{ fontSize: '10px', color: 'rgba(0,240,255,0.6)', display: 'block', marginBottom: '6px' }}>
                PASSWORD
              </label>
              <input
                type="password"
                required
                className="id-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            
            <button type="submit" className="cyber-btn striped" style={{ width: '100%', color: 'var(--bg-darkest)' }}>
              AUTHORIZE ACCESS
            </button>
          </form>
          
          <div style={{ fontSize: '8px', color: 'rgba(0,240,255,0.3)', marginTop: '20px', textAlign: 'center' }}>
            SECURE ACCESS ONLY. IP LOGGED. COBALT_VOID_V2.1
          </div>
        </div>
      </div>
    );
  }

  // Visual Viewport modals
  const renderModals = () => {
    return (
      <>
        {selectedPic && (
          <div style={{
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
            background: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center',
            zIndex: 100, padding: '20px'
          }} onClick={() => setSelectedPic(null)}>
            <div style={{
              background: '#020b0d', border: '2px solid var(--cyan-primary)',
              maxWidth: '600px', width: '100%', padding: '16px', position: 'relative'
            }} onClick={(e) => e.stopPropagation()}>
              <button style={{ position: 'absolute', top: '10px', right: '10px', background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }} onClick={() => setSelectedPic(null)}>
                <X size={20} />
              </button>
              <h3 style={{ color: 'var(--cyan-primary)', fontSize: '14px', marginBottom: '12px' }}>
                VISUAL_FEED: {selectedPic.teamName} // CLUE_{selectedPic.clueOrder}
              </h3>
              <img 
                src={`http://localhost:8080${selectedPic.url}`} 
                alt="Feed" 
                style={{ width: '100%', maxHeight: '450px', objectFit: 'contain', border: '1px solid rgba(0,240,255,0.2)' }} 
              />
            </div>
          </div>
        )}

        {selectedQR && (
          <div style={{
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
            background: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center',
            zIndex: 100, padding: '20px'
          }} onClick={() => setSelectedQR(null)}>
            <div style={{
              background: '#020b0d', border: '2px solid var(--cyan-primary)',
              maxWidth: '360px', width: '100%', padding: '24px', textAlign: 'center', position: 'relative'
            }} onClick={(e) => e.stopPropagation()}>
              <button style={{ position: 'absolute', top: '10px', right: '10px', background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }} onClick={() => setSelectedQR(null)}>
                <X size={20} />
              </button>
              <h3 style={{ color: 'var(--cyan-primary)', fontSize: '14px', marginBottom: '16px', letterSpacing: '1px' }}>
                ACCESS_ENCRYPTION: {selectedQR.name}
              </h3>
              
              {/* QR display block */}
              <div style={{
                background: 'rgba(0,240,255,0.05)', border: '2px dashed var(--cyan-primary)',
                padding: '24px', display: 'flex', justifyContent: 'center', marginBottom: '16px'
              }}>
                <QrCode size={180} className="glow-text" style={{ color: 'var(--cyan-primary)' }} />
              </div>
              
              <div style={{ fontSize: '11px', color: '#fff', marginBottom: '6px' }}>
                ID_HASH: {selectedQR.id.substring(18).toUpperCase()}-{selectedQR.name.substring(5).toUpperCase()}
              </div>
              <div style={{ fontSize: '9px', color: 'rgba(0,240,255,0.5)' }}>
                SCAN THIS BARCODE ON PLAYER PDA WELCOME SCREEN
              </div>
            </div>
          </div>
        )}

        {selectedTeamForClue && (
          <div style={{
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
            background: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center',
            zIndex: 100, padding: '20px'
          }} onClick={() => setSelectedTeamForClue(null)}>
            <div style={{
              background: '#020b0d', border: '2px solid var(--cyan-primary)',
              maxWidth: '400px', width: '100%', padding: '20px', position: 'relative'
            }} onClick={(e) => e.stopPropagation()}>
              <button style={{ position: 'absolute', top: '10px', right: '10px', background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }} onClick={() => setSelectedTeamForClue(null)}>
                <X size={20} />
              </button>
              <h3 style={{ color: 'var(--cyan-primary)', fontSize: '14px', marginBottom: '12px' }}>
                SEND_CLUE_ALERT: {selectedTeamForClue.name}
              </h3>
              <textarea
                className="id-input"
                style={{ width: '100%', height: '80px', fontSize: '12px', resize: 'none', marginBottom: '12px' }}
                placeholder="ENTER INSTRUCTION OVERRIDE MESSAGE..."
                value={overrideMessage}
                onChange={(e) => setOverrideMessage(e.target.value)}
              />
              <button 
                className="cyber-btn striped" 
                style={{ width: '100%', color: 'var(--bg-darkest)' }}
                onClick={() => {
                  setLogs(prev => [...prev, `LOG_EVT: Override clue alert sent to ${selectedTeamForClue.name}: "${overrideMessage}"`]);
                  setSelectedTeamForClue(null);
                  setOverrideMessage('');
                }}
              >
                TRANSMIT MESSAGE
              </button>
            </div>
          </div>
        )}
      </>
    );
  };

  // --- MOBILE ADMIN VIEW (Screenshot 2) ---
  if (isMobile) {
    return (
      <div style={{
        height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#020709',
        fontFamily: "'Share Tech Mono', monospace", color: 'var(--cyan-primary)', overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          borderBottom: '1px solid rgba(0, 240, 255, 0.2)', padding: '16px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          backgroundColor: 'rgba(3,12,15,0.85)'
        }}>
          <div style={{ fontSize: '15px', fontWeight: 'bold', letterSpacing: '1.5px' }}>
            COBALT_VOID_v2.1
          </div>
          <div style={{ fontSize: '9px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Radio size={12} className="glow-text-green flicker" />
            <span>LINK: STABLE</span>
          </div>
        </div>

        {/* Scroll Content */}
        <div style={{ flex: 1, padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Top Scanner Card */}
          <div style={{ border: '1px solid rgba(0,240,255,0.2)', background: 'rgba(3,12,15,0.6)', padding: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: 'rgba(0,240,255,0.5)', marginBottom: '8px' }}>
              <span>MODULE: SCAN_V4.0</span>
              <span>ID: 88-12-AX</span>
            </div>
            
            <div style={{
              border: '1px dashed var(--cyan-primary)', height: '70px',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(0,240,255,0.02)', gap: '4px', cursor: 'pointer'
            }} onClick={() => alert("Scanner Initialized. Ready for Barcode Input.")}>
              <QrCode size={18} className="glow-text" />
              <span className="telemetry-label" style={{ fontSize: '9px' }}>INITIALIZE_SCANNER</span>
            </div>
          </div>

          <h2 style={{ fontSize: '20px', letterSpacing: '1px', fontWeight: 'bold', color: '#fff' }}>
            ACTIVE_TEAMS
            <span style={{ float: 'right', fontSize: '11px', color: 'var(--cyan-primary)', marginTop: '8px' }}>
              Count: {teams.length}
            </span>
          </h2>

          {/* Teams List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {teams.map(team => {
              const isActive = team.status === 'in_progress';
              const isFinished = team.status === 'finished';
              
              // Colors based on status
              const borderColor = isFinished ? 'rgba(57, 255, 20, 0.4)' : isActive ? 'rgba(0, 240, 255, 0.4)' : 'rgba(255, 0, 0, 0.4)';
              const statusColor = isFinished ? 'glow-text-green' : isActive ? 'glow-text' : 'glow-text-amber';

              return (
                <div key={team._id} style={{
                  border: `1.5px solid ${borderColor}`,
                  background: 'rgba(3, 12, 15, 0.6)',
                  padding: '12px',
                  borderRadius: '4px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#fff' }}>
                      {team.name}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                      <span className="telemetry-label" style={{ fontSize: '8px' }}>TIMER</span>
                      <span className={isActive ? 'glow-text' : ''} style={{ fontSize: '16px', fontWeight: 'bold' }}>
                        {isActive ? formatElapsedTime(team.startedAt) : isFinished ? 'COMPLETED' : '00:00:00'}
                      </span>
                    </div>
                  </div>
                  
                  <div style={{ fontSize: '10px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span className={`confidence-block ${isActive || isFinished ? 'filled' : ''}`} style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: isActive ? 'var(--cyan-primary)' : isFinished ? 'var(--green-primary)' : 'var(--amber-primary)' }}></span>
                    <span className="telemetry-label">STATUS: </span>
                    <span className={statusColor}>{team.status.toUpperCase()} // CLUE_{team.currentClueIndex + 1}</span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                    <button 
                      className="cyber-btn-outline" 
                      style={{ fontSize: '9px', padding: '6px' }}
                      onClick={() => setSelectedTeamForClue(team)}
                    >
                      SEND_CLUE
                    </button>
                    
                    <button 
                      className="cyber-btn-outline" 
                      style={{ fontSize: '9px', padding: '6px' }}
                      onClick={() => {
                        const lastSub = submissions.find(s => s.team?._id === team._id);
                        if (lastSub) {
                          setSelectedPic({ teamName: team.name, url: lastSub.photoUrl, clueOrder: lastSub.clue?.order || 1 });
                        } else {
                          alert("No photo submissions recorded yet for this team.");
                        }
                      }}
                    >
                      VIEW_PIC
                    </button>

                    {team.status === 'not_started' ? (
                      <button 
                        className="cyber-btn striped" 
                        style={{ fontSize: '9px', padding: '6px', color: 'var(--bg-darkest)' }}
                        onClick={() => handleStartMission(team._id, team.name)}
                      >
                        START
                      </button>
                    ) : (
                      <button 
                        className="cyber-btn-outline" 
                        style={{ fontSize: '9px', padding: '6px', color: 'var(--amber-primary)', borderColor: 'var(--amber-primary)' }}
                        onClick={() => handleResetMission(team._id, team.name)}
                      >
                        RESET
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Telemetry log console */}
          <div style={{ border: '1px solid rgba(0,240,255,0.2)', padding: '12px', background: 'rgba(3,12,15,0.8)' }}>
            <div className="clue-header" style={{ fontSize: '10px' }}>VOID_TELEMETRY</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', margin: '8px 0' }}>
              <div>
                <div style={{ fontSize: '8px', color: 'rgba(0,240,255,0.6)' }}>AVG_STRESS [65%]</div>
                <div className="telemetry-bar-container" style={{ height: '4px' }}>
                  <div className="telemetry-bar-fill" style={{ width: '65%' }}></div>
                </div>
              </div>
              <div>
                <div style={{ fontSize: '8px', color: 'rgba(0,240,255,0.6)' }}>COBALT_LOAD [22%]</div>
                <div className="telemetry-bar-container" style={{ height: '4px' }}>
                  <div className="telemetry-bar-fill" style={{ width: '22%' }}></div>
                </div>
              </div>
            </div>
            
            <div className="ml-log-console" style={{ height: '70px', marginTop: '10px' }}>
              {logs.slice(-4).map((log, i) => (
                <div key={i} className="log-entry">&gt; {log}</div>
              ))}
            </div>
          </div>

        </div>

        {/* Mobile Tab Navbar */}
        <div className="hud-nav-bar">
          <div className="nav-tab" onClick={() => alert("Scanner online")}>
            <Scan size={18} />
            <span>SCAN</span>
          </div>
          <div className="nav-tab" onClick={() => alert("GPS maps syncing")}>
            <Map size={18} />
            <span>MAP</span>
          </div>
          <div className="nav-tab active">
            <FileText size={18} />
            <span>LOGS</span>
          </div>
          <div className="nav-tab" onClick={handleAdminLogout}>
            <Power size={18} style={{ color: 'var(--amber-primary)' }} />
            <span>LOGOUT</span>
          </div>
        </div>

        {renderModals()}
      </div>
    );
  }

  // --- DESKTOP ADMIN VIEW (Screenshot 1) ---
  return (
    <div style={{
      height: '100vh', display: 'flex', backgroundColor: '#020709',
      fontFamily: "'Share Tech Mono', monospace", color: 'var(--cyan-primary)', overflow: 'hidden'
    }}>
      {/* 1. Left Sidebar */}
      <div style={{
        width: '240px', borderRight: '1px solid rgba(0, 240, 255, 0.15)',
        display: 'flex', flexDirection: 'column', backgroundColor: '#010507', padding: '16px'
      }}>
        {/* Operator Profile */}
        <div style={{
          display: 'flex', gap: '12px', alignItems: 'center',
          borderBottom: '1px solid rgba(0, 240, 255, 0.15)', paddingBottom: '16px', marginBottom: '20px'
        }}>
          {/* Mock avatar */}
          <div style={{
            width: '40px', height: '40px', border: '1px solid var(--cyan-primary)',
            background: 'rgba(0,240,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Shield size={20} className="glow-text" />
          </div>
          <div>
            <div style={{ fontWeight: 'bold', fontSize: '13px', color: '#fff' }} className="glow-text">
              OPERATOR_082
            </div>
            <div style={{ fontSize: '8px', color: 'rgba(0,240,255,0.6)' }}>
              RAD_LVL: 0.15mSv
            </div>
          </div>
        </div>

        {/* Sidebar Menu Items */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
          {[
            { id: 'Sector_Map', label: 'Sector_Map', icon: Map },
            { id: 'Mission_Log', label: 'Mission_Log', icon: FileText },
            { id: 'Team_Comms', label: 'Team_Comms', icon: Users },
            { id: 'Terminal_Admin', label: 'Terminal_Admin', icon: Terminal }
          ].map(item => {
            const Icon = item.icon;
            const isSelected = activeTab === item.id;
            return (
              <div
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '10px', padding: '12px',
                  cursor: 'pointer', fontSize: '13px',
                  background: isSelected ? 'rgba(0,240,255,0.06)' : 'transparent',
                  borderLeft: isSelected ? '3px solid var(--cyan-primary)' : '3px solid transparent',
                  color: isSelected ? 'var(--cyan-primary)' : 'rgba(0,240,255,0.5)',
                  transition: 'all 0.2s ease'
                }}
              >
                <Icon size={16} />
                <span>{item.label}</span>
              </div>
            );
          })}
        </div>

        {/* Battery Power Cell */}
        <div style={{ borderTop: '1px solid rgba(0, 240, 255, 0.15)', paddingTop: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: 'rgba(0,240,255,0.6)', marginBottom: '4px' }}>
            <span>PWR_CELL</span>
            <span>84%</span>
          </div>
          <div className="telemetry-bar-container" style={{ height: '6px' }}>
            <div className="telemetry-bar-fill" style={{ width: '84%' }}></div>
          </div>
        </div>

        {/* Admin Logout */}
        <button 
          className="cyber-btn-outline" 
          onClick={handleAdminLogout} 
          style={{ width: '100%', marginTop: '16px', fontSize: '11px', padding: '8px', borderColor: 'var(--amber-primary)', color: 'var(--amber-primary)' }}
        >
          <Power size={12} style={{ marginRight: '6px' }} /> LOGOUT TERMINAL
        </button>
      </div>

      {/* 2. Main Dashboard Panel */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#02090b', padding: '20px', overflowY: 'auto' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid rgba(0,240,255,0.1)', paddingBottom: '12px' }}>
          <div style={{ fontSize: '18px', fontWeight: 'bold', letterSpacing: '2px' }}>
            STALKER_NET_V2.1 // COMMAND_CENTER
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '11px' }}>
            <span>SYSTEM_TIME: {systemTime}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Radio size={12} className="glow-text-green flicker" />
              <span>TUNNEL_082: SECURE</span>
            </div>
          </div>
        </div>

        {/* Center Operations overview row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,240,255,0.03)', border: '1px solid rgba(0,240,255,0.15)', padding: '16px', marginBottom: '20px' }}>
          <div>
            <h2 className="glow-text" style={{ fontSize: '18px', fontWeight: 'bold' }}>ACTIVE_OPERATIONS</h2>
            <div style={{ fontSize: '10px', color: 'rgba(0,240,255,0.6)', marginTop: '4px' }}>
              SYSTEM_TIME: {systemTime} // SECTOR: ZONE_01_NORTH
            </div>
          </div>
          
          <button 
            className="cyber-btn" 
            style={{
              background: 'repeating-linear-gradient(45deg, #ffb700, #ffb700 8px, #e0a100 8px, #e0a100 16px)',
              border: '1px solid var(--amber-primary)', color: '#000',
              fontWeight: 'bold', fontSize: '11px', boxShadow: '0 0 10px rgba(255,183,0,0.2)'
            }}
            onClick={() => {
              if (teams.length > 0) {
                const team = teams[0];
                handleClueOverride(team._id, team.name);
              } else {
                alert("No active teams for clue override.");
              }
            }}
          >
            ⚠️ GLOBAL_CLUE_OVERRIDE
          </button>
        </div>

        {/* Telemetry Table */}
        <div style={{ flex: 1, border: '1px solid rgba(0,240,255,0.15)', background: 'rgba(1, 6, 8, 0.8)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '12px', borderBottom: '1px solid rgba(0,240,255,0.15)', background: 'rgba(3,12,15,0.5)', display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
            <span>LIVE_TELEMETRY</span>
            <span style={{ color: 'rgba(0,240,255,0.5)' }}>ROWS: {teams.length}</span>
          </div>

          <div style={{ flex: 1, overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(0,240,255,0.15)', color: 'rgba(0,240,255,0.5)', fontSize: '10px' }}>
                  <th style={{ padding: '12px' }}># UNIT_ID</th>
                  <th style={{ padding: '12px' }}>STATUS</th>
                  <th style={{ padding: '12px' }}>CURRENT_OBJECTIVE</th>
                  <th style={{ padding: '12px' }}>T_ELAPSED</th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {teams.map(team => {
                  const isActive = team.status === 'in_progress';
                  const isFinished = team.status === 'finished';

                  const badgeBg = isFinished ? 'rgba(57, 255, 20, 0.1)' : isActive ? 'rgba(0, 240, 255, 0.1)' : 'rgba(255, 0, 0, 0.1)';
                  const badgeBorder = isFinished ? 'var(--green-primary)' : isActive ? 'var(--cyan-primary)' : '#ff4444';
                  const badgeText = isFinished ? 'COMPLETED' : isActive ? 'ACTIVE' : 'IDLE';

                  return (
                    <tr key={team._id} style={{ borderBottom: '1px solid rgba(0,240,255,0.05)', verticalAlign: 'middle' }}>
                      <td 
                        style={{ padding: '12px', fontWeight: 'bold', color: '#fff', cursor: 'pointer' }}
                        onClick={() => setSelectedQR({ id: team._id, name: team.name })}
                      >
                        &gt; {team.name}
                        <span style={{ display: 'block', fontSize: '8px', color: 'rgba(0,240,255,0.4)', marginTop: '2px' }}>
                          CLICK FOR QR CODE
                        </span>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <span style={{
                          border: `1px solid ${badgeBorder}`,
                          backgroundColor: badgeBg,
                          color: badgeBorder,
                          padding: '2px 6px', fontSize: '9px', fontWeight: 'bold'
                        }}>
                          {badgeText}
                        </span>
                      </td>
                      <td style={{ padding: '12px', color: 'rgba(255,255,255,0.85)' }}>
                        {team.status === 'not_started' ? 'Awaiting uplink initialization' : isFinished ? 'All objectives completed' : `SECURE CLUE_${team.currentClueIndex + 1}`}
                      </td>
                      <td style={{ padding: '12px' }}>
                        {isActive ? formatElapsedTime(team.startedAt) : isFinished ? 'COMPLETED' : '--:--:--'}
                      </td>
                      <td style={{ padding: '12px', display: 'flex', justifyContent: 'center', gap: '8px' }}>
                        <button 
                          className="cyber-btn-outline" 
                          style={{ padding: '4px 8px', fontSize: '10px' }}
                          title="View submitted image"
                          onClick={() => {
                            const lastSub = submissions.find(s => s.team?._id === team._id);
                            if (lastSub) {
                              setSelectedPic({ teamName: team.name, url: lastSub.photoUrl, clueOrder: lastSub.clue?.order || 1 });
                            } else {
                              alert("No image submissions recorded yet.");
                            }
                          }}
                        >
                          <Eye size={12} />
                        </button>
                        
                        {team.status === 'not_started' ? (
                          <button 
                            className="cyber-btn striped" 
                            style={{ padding: '4px 8px', fontSize: '10px', color: 'var(--bg-darkest)' }}
                            onClick={() => handleStartMission(team._id, team.name)}
                          >
                            START
                          </button>
                        ) : (
                          <button 
                            className="cyber-btn-outline" 
                            style={{ padding: '4px 8px', fontSize: '10px', color: 'var(--amber-primary)', borderColor: 'var(--amber-primary)' }}
                            onClick={() => handleResetMission(team._id, team.name)}
                          >
                            RESET
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer log monitor */}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: 'rgba(0,240,255,0.4)', borderTop: '1px solid rgba(0,240,255,0.1)', paddingTop: '10px', marginTop: '16px' }}>
          <span>COMMS: NOMINAL</span>
          <span>DB_LATENCY: 42ms</span>
          <span>MEM: 12GB / 32GB</span>
          <span>SYSTEM_STABLE_V2.1</span>
        </div>
      </div>

      {/* 3. Right Sidebar */}
      <div style={{
        width: '320px', borderLeft: '1px solid rgba(0, 240, 255, 0.15)',
        display: 'flex', flexDirection: 'column', backgroundColor: '#010507', padding: '16px', gap: '20px'
      }}>
        
        {/* Access Gen (Register mock unit) */}
        <div style={{ border: '1px solid rgba(0,240,255,0.15)', padding: '12px', background: 'rgba(3,12,15,0.3)' }}>
          <div className="telemetry-label" style={{ fontSize: '10px', marginBottom: '8px' }}>ACCESS_GEN // UNIT_ID</div>
          <form onSubmit={handleCreateMockTeam} style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              name="team_id"
              required
              className="id-input"
              style={{ flex: 1, padding: '6px', fontSize: '11px' }}
              placeholder="ENTER_NEW_UNIT_ID..."
            />
            <button type="submit" className="cyber-btn striped" style={{ padding: '6px 12px', fontSize: '10px', color: 'var(--bg-darkest)' }}>
              GENERATE
            </button>
          </form>
        </div>

        {/* Visual Feed */}
        <div style={{ flex: 1, border: '1px solid rgba(0,240,255,0.15)', padding: '12px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span className="telemetry-label" style={{ fontSize: '10px' }}>VISUAL_FEED</span>
            <span style={{ color: 'var(--cyan-primary)', fontSize: '8px', animation: 'pulse-amber 1s infinite alternate' }}>● LIVE</span>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {submissions.length === 0 ? (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: 'rgba(0,240,255,0.4)', textAlign: 'center' }}>
                AWAITING VISUAL TRANSFERS FROM PLAYER PDA SCANNERS...
              </div>
            ) : (
              submissions.map(sub => {
                return (
                  <div key={sub._id} style={{ border: '1px solid rgba(0,240,255,0.1)', padding: '6px', background: 'rgba(0,0,0,0.4)' }}>
                    <img 
                      src={`http://localhost:8080${sub.photoUrl}`} 
                      alt="Submission" 
                      style={{ width: '100%', height: '110px', objectFit: 'cover', border: '1px solid rgba(0,240,255,0.1)', cursor: 'pointer' }}
                      onClick={() => setSelectedPic({ teamName: sub.team?.name || 'Unit', url: sub.photoUrl, clueOrder: sub.clue?.order || 1 })}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px', fontSize: '10px' }}>
                      <span style={{ color: '#fff', fontWeight: 'bold' }}>
                        {sub.team?.name} / CLUE_0{sub.clue?.order}
                      </span>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        {sub.isCorrect ? (
                          <span style={{ color: 'var(--green-primary)', display: 'flex', alignItems: 'center', gap: '2px', fontWeight: 'bold' }}>
                            <Check size={12} /> VERIFIED
                          </span>
                        ) : (
                          <span style={{ color: '#ff4444', display: 'flex', alignItems: 'center', gap: '2px', fontWeight: 'bold' }}>
                            <X size={12} /> REJECTED
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Unit Access Encryption QR Code */}
        <div style={{ border: '1px solid rgba(0,240,255,0.15)', padding: '12px', textAlign: 'center' }}>
          <div className="telemetry-label" style={{ fontSize: '9px', marginBottom: '8px' }}>UNIT_ACCESS_ENCRYPTION</div>
          <div style={{ fontSize: '7px', color: 'rgba(0,240,255,0.5)', marginBottom: '8px' }}>SCAN TO AUTHORIZE TERMINAL</div>
          
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px', cursor: 'pointer' }} onClick={() => setSelectedQR({ id: 'admin-gate', name: 'ADMIN_GATE' })}>
            <QrCode size={110} className="glow-text" style={{ color: 'var(--cyan-primary)' }} />
          </div>
          
          <div style={{ fontSize: '9px', color: '#fff' }}>ID_HASH: 77AF-229X-L092</div>
        </div>

      </div>

      {renderModals()}
    </div>
  );
};

export default AdminDashboard;
