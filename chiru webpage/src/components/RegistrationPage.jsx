import React from 'react';
import QRCode from 'react-qr-code';
import { useNavigate } from 'react-router-dom';

const RegistrationPage = () => {
  const navigate = useNavigate();
  
  // Dynamically resolve target PWA URL:
  // If Vite runs landing page on port 5174, replacement points to port 5173 where the PWA runs.
  const pwaUrl = import.meta.env.VITE_PWA_URL || 
    (window.location.origin.includes(':5174') 
      ? window.location.origin.replace(':5174', ':5173') 
      : window.location.origin);

  return (
    <div className="registration-wrapper">
      {/* Back to Base button */}
      <button onClick={() => navigate('/')} className="back-btn-doc">
        &lt; RETURN TO BASE
      </button>

      <div className="document-container">
        {/* Hazard Header */}
        <div className="hazard-bar"></div>
        
        {/* Document Header */}
        <div className="doc-header">
          <div className="doc-meta">SYS.BOOT // TRANS-LINK PROTOCOL // MOBILE_ACCESS_ONLY</div>
          <h2 className="doc-title">TACTICAL TERMINAL ENCRYPTION</h2>
          <div className="red-stamp">RESTRICTED</div>
        </div>

        <div className="qr-content-wrapper fade-in" style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '2rem 3rem',
          textAlign: 'center',
          color: '#1a1a1a'
        }}>
          <h3 style={{
            fontFamily: 'Times New Roman, Times, serif',
            fontSize: '1.6rem',
            fontWeight: 'bold',
            marginBottom: '1rem',
            borderBottom: '2px solid #1a1a1a',
            width: '100%',
            paddingBottom: '0.5rem'
          }}>
            MOBILE UPLINK REQUIRED
          </h3>

          <p style={{
            fontFamily: 'Courier New, Courier, monospace',
            fontSize: '0.95rem',
            lineHeight: '1.6',
            color: '#333',
            marginBottom: '2rem',
            maxWidth: '550px'
          }}>
            STALKER_NET Tactical Interface and bio-hazard trackers can only run on dedicated mobile terminals as a Progressive Web App (PWA). Scan the QR code below with your mobile camera to establish secure connection, download the app, and join the mission.
          </p>

          {/* QR Code Container */}
          <div style={{
            background: '#ffffff',
            padding: '1.5rem',
            border: '2px solid #1a1a1a',
            boxShadow: '4px 4px 0px #1a1a1a',
            marginBottom: '2rem',
            display: 'inline-block'
          }}>
            <QRCode value={pwaUrl} size={200} />
          </div>

          <div style={{
            fontFamily: 'Courier New, Courier, monospace',
            fontSize: '0.8rem',
            fontWeight: 'bold',
            color: '#666',
            borderTop: '1px dashed #ccc',
            width: '100%',
            paddingTop: '1.5rem'
          }}>
            UPLINK DESTINATION: <span style={{ color: '#cc0000' }}>{pwaUrl}</span>
          </div>

          {/* Device Specific Tips */}
          <div style={{
            marginTop: '2rem',
            width: '100%',
            background: '#f0ede6',
            border: '1px solid #ccc',
            padding: '1rem',
            textAlign: 'left',
            fontFamily: 'Courier New, Courier, monospace',
            fontSize: '0.85rem'
          }}>
            <div style={{ fontWeight: 'bold', marginBottom: '0.5rem', color: '#cc0000' }}>[INSTALLATION PROCEDURE]</div>
            <ul style={{ paddingLeft: '1.2rem', margin: 0, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <li><strong>iOS Safari:</strong> Tap share button &rarr; "Add to Home Screen"</li>
              <li><strong>Android Chrome:</strong> Tap three dots &rarr; "Install App" or "Add to Home Screen"</li>
            </ul>
          </div>
        </div>

        <div className="hazard-bar" style={{ marginTop: '2rem' }}></div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .fade-in {
          animation: fadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .registration-wrapper {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 2rem;
          position: relative;
          z-index: 100;
        }

        .back-btn-doc {
          position: absolute;
          top: 2rem;
          left: 2rem;
          background: transparent;
          border: none;
          color: rgba(255, 255, 255, 0.7);
          font-family: 'Courier New', Courier, monospace;
          font-size: 1rem;
          font-weight: bold;
          cursor: pointer;
          text-transform: uppercase;
          transition: color 0.3s ease;
        }

        .back-btn-doc:hover {
          color: #ff3333;
        }

        .document-container {
          width: 100%;
          max-width: 700px;
          background-color: #fdfbf7;
          background-image: radial-gradient(#e0dcd3 1px, transparent 1px);
          background-size: 20px 20px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
          position: relative;
          color: #1a1a1a;
          overflow: hidden;
          padding-bottom: 1rem;
          border: 1px solid #1a1a1a;
        }

        .hazard-bar {
          width: 100%;
          height: 15px;
          background: repeating-linear-gradient(
            45deg,
            #ffcc00,
            #ffcc00 15px,
            #000000 15px,
            #000000 30px
          );
        }

        .doc-header {
          padding: 2.5rem 3rem 0.5rem 3rem;
          position: relative;
          border-bottom: 3px double #1a1a1a;
          margin-bottom: 1rem;
        }

        .doc-meta {
          font-family: 'Courier New', Courier, monospace;
          font-weight: bold;
          font-size: 0.85rem;
          margin-bottom: 0.8rem;
          color: #444;
        }

        .doc-title {
          font-family: 'Times New Roman', Times, serif;
          font-size: 2rem;
          font-weight: 900;
          letter-spacing: 1px;
          margin: 0;
          text-transform: uppercase;
        }

        .red-stamp {
          position: absolute;
          top: 1.5rem;
          right: 2rem;
          color: #cc0000;
          font-family: 'Courier New', Courier, monospace;
          font-size: 1.3rem;
          font-weight: 900;
          border: 3px solid #cc0000;
          padding: 0.1rem 0.4rem;
          transform: rotate(-12deg);
          opacity: 0.85;
          border-radius: 4px;
        }

        @media (max-width: 768px) {
          .registration-wrapper { padding: 1rem; }
          .back-btn-doc { 
            position: relative; 
            top: 0; 
            left: 0; 
            margin-bottom: 1rem; 
            align-self: flex-start; 
            font-size: 0.85rem;
          }
          .doc-header { padding: 1.5rem 1rem 0.5rem 1rem; }
          .doc-title { font-size: 1.4rem; }
          .doc-meta { font-size: 0.75rem; }
          .red-stamp { 
            top: 0.5rem; 
            right: 0.5rem; 
            font-size: 0.95rem; 
            border-width: 2px; 
            padding: 0.1rem 0.3rem;
          }
          .qr-content-wrapper { padding: 1rem !important; }
        }
      `}</style>
    </div>
  );
};

export default RegistrationPage;
