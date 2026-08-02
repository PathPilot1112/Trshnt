import React, { useState, useEffect } from 'react';
import Welcome from './pages/Welcome';
import HUD from './pages/HUD';
import Scan from './pages/Scan';
import AdminDashboard from './pages/AdminDashboard';
import ScanlineOverlay from './components/ScanlineOverlay';
import BackgroundCanvas from './components/BackgroundCanvas';

const API_BASE = import.meta.env.VITE_API_BASE || '/api';

function App() {
  const [operatorName, setOperatorName] = useState('');
  const [teamInfo, setTeamInfo] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('stalker_token') || '');
  const [currentRoute, setCurrentRoute] = useState('welcome');
  const [isLoading, setIsLoading] = useState(true);

  // Parse initial route from URL hash
  useEffect(() => {
    const parseRoute = () => {
      const hash = window.location.hash;
      if (hash === '#admin' || hash === '#admin-login') {
        setCurrentRoute('admin');
      } else if (hash === '#hud') {
        setCurrentRoute('hud');
      } else if (hash === '#scan') {
        setCurrentRoute('scan');
      } else {
        setCurrentRoute('welcome');
      }
    };

    parseRoute();
    window.addEventListener('hashchange', parseRoute);
    return () => window.removeEventListener('hashchange', parseRoute);
  }, []);

  // Persist session if token exists
  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setIsLoading(false);
        if (!window.location.hash.startsWith('#admin')) {
          window.location.hash = '#welcome';
        }
        return;
      }

      try {
        const response = await fetch(`${API_BASE}/teams/me`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
          const data = await response.json();
          setOperatorName(data.user.name);
          setTeamInfo(data.team);
          if (window.location.hash === '#welcome' || window.location.hash === '') {
            window.location.hash = '#hud';
          }
        } else {
          handleLogout();
        }
      } catch (err) {
        console.error("Error verifying token:", err);
      } finally {
        setIsLoading(false);
      }
    };

    verifyToken();
  }, [token]);

  const handleLogin = async (name) => {
    try {
      const response = await fetch(`${API_BASE}/teams/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operatorName: name })
      });

      if (response.ok) {
        const data = await response.json();
        setToken(data.token);
        setOperatorName(data.user.name);
        setTeamInfo(data.team);
        localStorage.setItem('stalker_token', data.token);
        window.location.hash = '#hud';
      } else {
        const errData = await response.json();
        alert(`Authentication Error: ${errData.message}`);
      }
    } catch (err) {
      console.error("Login request failed:", err);
      alert("Failed to contact STALKER Net. Check if backend is running.");
    }
  };

  const handleQrLogin = async (qrData) => {
    const response = await fetch(`${API_BASE}/teams/scan-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ qrData })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'QR login failed');
    }

    setToken(data.token);
    setOperatorName(data.user.name);
    setTeamInfo(data.team);
    localStorage.setItem('stalker_token', data.token);
    window.location.hash = '#hud';
  };

  const handleRefreshProfile = async () => {
    if (!token) return;
    try {
      const response = await fetch(`${API_BASE}/teams/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setTeamInfo(data.team);
      }
    } catch (err) {
      console.error("Failed to refresh team status:", err);
    }
  };

  const handleLogout = async () => {
    if (token) {
      try {
        await fetch(`${API_BASE}/teams/logout`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
      } catch (err) {
        console.error("Failed to release session lock:", err);
      }
    }
    setToken('');
    setOperatorName('');
    setTeamInfo(null);
    localStorage.removeItem('stalker_token');
    window.location.hash = '#welcome';
  };

  const handleNavigation = (route) => {
    window.location.hash = `#${route}`;
  };

  // Admin page — full screen, no PDA frame
  if (currentRoute === 'admin') {
    return (
      <AdminDashboard API_BASE={API_BASE} />
    );
  }

  // Scan page — full screen camera view
  if (currentRoute === 'scan') {
    return (
      <div style={{
        position: 'relative',
        height: '100vh',
        width: '100vw',
        background: 'var(--color-bg)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* Atmospheric layers behind scan UI */}
        <BackgroundCanvas />
        <div className="noise-overlay" />

        {/* Scan content */}
        <div style={{ position: 'relative', zIndex: 10, height: '100%', display: 'flex', flexDirection: 'column' }}>
          <div className="hazard-bar" />
          <Scan
            API_BASE={API_BASE}
            token={token}
            onAbort={() => {
              handleRefreshProfile();
              handleNavigation('hud');
            }}
          />
        </div>
      </div>
    );
  }

  // Main PDA view — Welcome + HUD
  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
      {/* === Full-screen atmospheric background layers === */}
      <BackgroundCanvas />
      <div className="noise-overlay" />
      <div className="scanlines" />

      {/* === PDA Device Frame === */}
      <div className="pda-wrapper" style={{ zIndex: 10 }}>
        <div className="crt-screen">
          <ScanlineOverlay />

          {isLoading ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              height: '100%',
              gap: '16px',
              padding: '20px',
            }}>
              {/* Hazard decoration at top */}
              <div style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '9px',
                color: 'var(--color-accent)',
                letterSpacing: '2px',
                marginBottom: '8px',
              }}>
                ZONE_ACCESS_PROTOCOL
              </div>

              <div className="glitch-text" data-text="STALKER_NET" style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '20px',
                fontWeight: 700,
                letterSpacing: '4px',
                color: 'var(--color-accent)',
                textTransform: 'uppercase',
              }}>
                STALKER_NET
              </div>

              <div className="flicker" style={{
                fontFamily: 'var(--font-mono)',
                color: 'var(--color-neon-green)',
                fontSize: '12px',
                fontWeight: 'bold',
                letterSpacing: '2px',
                textShadow: '0 0 8px var(--color-green-glow)',
              }}>
                CONNECTING_TO_ZONE...
              </div>

              <div className="telemetry-bar-container" style={{ width: '60%' }}>
                <div className="telemetry-bar-fill" style={{ width: '100%', animation: 'radar-sweep 2s infinite linear' }} />
              </div>

              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '8px', color: 'rgba(155,168,168,0.4)', marginTop: '8px' }}>
                RAD_LVL: 3.6R/hr // SECTOR: PRIPYAT
              </div>
            </div>
          ) : (
            <>
              {currentRoute === 'welcome' && (
                <Welcome onQrLogin={handleQrLogin} />
              )}

              {currentRoute === 'hud' && (
                <HUD
                  operatorName={operatorName}
                  teamInfo={teamInfo}
                  token={token}
                  API_BASE={API_BASE}
                  onNavigate={handleNavigation}
                  onLogout={handleLogout}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
