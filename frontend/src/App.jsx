import React, { useState, useEffect } from 'react';
import Welcome from './pages/Welcome';
import HUD from './pages/HUD';
import Scan from './pages/Scan';
import AdminDashboard from './pages/AdminDashboard';
import ScanlineOverlay from './components/ScanlineOverlay';

const API_BASE = 'http://localhost:8080/api';

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
        // If they are on an admin route, stay there, otherwise go to welcome
        if (!window.location.hash.startsWith('#admin')) {
          window.location.hash = '#welcome';
        }
        return;
      }

      try {
        const response = await fetch(`${API_BASE}/teams/me`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setOperatorName(data.user.name);
          setTeamInfo(data.team);
          
          // Redirect to HUD if they were on Welcome page
          if (window.location.hash === '#welcome' || window.location.hash === '') {
            window.location.hash = '#hud';
          }
        } else {
          // Token is invalid/expired
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
        headers: {
          'Content-Type': 'application/json'
        },
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

  const handleRefreshProfile = async () => {
    if (!token) return;
    try {
      const response = await fetch(`${API_BASE}/teams/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setTeamInfo(data.team);
      }
    } catch (err) {
      console.error("Failed to refresh team status:", err);
    }
  };

  const handleLogout = () => {
    setToken('');
    setOperatorName('');
    setTeamInfo(null);
    localStorage.removeItem('stalker_token');
    window.location.hash = '#welcome';
  };

  const handleNavigation = (route) => {
    window.location.hash = `#${route}`;
  };

  // Render Admin page separately (without standard PDA device frame to support full desktop/mobile sizes)
  if (currentRoute === 'admin') {
    return <AdminDashboard API_BASE={API_BASE} />;
  }

  return (
    <div className="pda-wrapper">
      <div className="crt-screen">
        <ScanlineOverlay />
        
        {isLoading ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100%',
            gap: '12px'
          }}>
            <div className="flicker" style={{ color: 'var(--cyan-primary)', fontSize: '18px', fontWeight: 'bold' }}>
              CONNECTING_TO_STALKER_NET...
            </div>
            <div className="telemetry-bar-container" style={{ width: '50%' }}>
              <div className="telemetry-bar-fill" style={{ width: '100%', animation: 'radar-sweep 2s infinite linear' }}></div>
            </div>
          </div>
        ) : (
          <>
            {currentRoute === 'welcome' && (
              <Welcome onLogin={handleLogin} />
            )}
            
            {currentRoute === 'hud' && (
              <HUD 
                operatorName={operatorName} 
                teamInfo={teamInfo}
                token={token}
                onNavigate={handleNavigation} 
                onLogout={handleLogout}
                onRefresh={handleRefreshProfile}
              />
            )}
            
            {currentRoute === 'scan' && (
              <Scan 
                token={token}
                onAbort={() => {
                  handleRefreshProfile();
                  handleNavigation('hud');
                }} 
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default App;
