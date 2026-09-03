import React, { useRef, useEffect } from 'react';
import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import gsap from 'gsap';

const ROLES = ['[LEAD]', '[SCOUT]', '[SUPPORT]', '[ASSAULT]', '[RECON]'];

const PlayerAvatarCanvas = ({ role }) => {
  const canvasRef = useRef();

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    canvas.width = 100;
    canvas.height = 100;

    const noiseMap = Array.from({ length: 50 }, () =>
      Array.from({ length: 50 }, () => Math.random())
    );

    let time = 0;
    const render = () => {
      time += 0.05;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#9BA8A8';

      const spacing = 4;
      const cols = Math.floor(canvas.width / spacing);
      const rowHeight = 6;
      const rows = Math.floor(canvas.height / rowHeight);

      const centerX = cols / 2;
      const centerY = rows / 2;

      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const x = i * spacing;
          const y = j * rowHeight;

          let shapeVal = 0;
          const distX = Math.abs(i - centerX);

          if (role === '[LEAD]' || role === '[RECON]') {
            if (j > centerY - 8 && j < centerY + 4) {
              const headDist = Math.sqrt(Math.pow(distX, 2) + Math.pow(j - centerY + 2, 2));
              if (headDist < 6) shapeVal = 1;
              if (distX < 1.5 && j > centerY - 2 && j < centerY + 5) shapeVal = 0;
              if (j === centerY - 2 && distX < 3) shapeVal = 0;
            }
            if (j >= centerY + 4 && j < centerY + 10) {
              if (distX < 8) shapeVal = 0.7;
            }
          }
          else if (role === '[SCOUT]') {
            if (j > centerY - 10 && j < centerY + 5) {
              const headDist = Math.sqrt(Math.pow(distX, 2) + Math.pow(j - centerY + 2, 2) * 1.5);
              if (headDist < 7) shapeVal = 0.9;
              if (distX < 3.5 && j > centerY && j < centerY + 5) shapeVal = 0.1;
            }
            if (j >= centerY + 5 && j < centerY + 11) {
              if (distX < 9) shapeVal = 0.8;
            }
          }
          else if (role === '[SUPPORT]') {
            if (j > centerY - 8 && j < centerY + 4) {
              const headDist = Math.sqrt(Math.pow(distX, 2) + Math.pow(j - centerY + 2, 2));
              if (headDist < 6.5) shapeVal = 1;
              if (distX < 2 && j > centerY - 2 && j < centerY + 3) shapeVal = 0;
              if (j === centerY - 2 && distX < 4) shapeVal = 0;
            }
            if (j >= centerY + 4 && j < centerY + 10) {
              if (distX < 7) shapeVal = 0.8;
              if (distX >= 7 && distX < 11 && j < centerY + 8) shapeVal = 1;
            }
          }
          else if (role === '[ASSAULT]') {
            if (j > centerY - 6 && j < centerY + 5) {
              const headDist = Math.sqrt(Math.pow(distX, 2) + Math.pow(j - centerY + 1, 2));
              if (headDist < 5) shapeVal = 1;
              if (Math.abs(distX - 2) < 1 && j === centerY) shapeVal = 0;
            }
            if (distX === 6 && j > centerY - 8 && j < centerY + 2) shapeVal = 1;
            if (j >= centerY + 5 && j < centerY + 10) {
              if (distX < 7) shapeVal = 0.7;
            }
          }

          if (shapeVal > 0) {
            const dynamicShapeVal = shapeVal * (0.8 + 0.3 * Math.sin(time + i * 0.2 + j * 0.2));
            const noise = noiseMap[i % 50][j % 50];
            const finalVal = dynamicShapeVal * 0.8 + noise * 0.2;

            if (finalVal > 0.3) {
              const thickness = Math.max(1, (finalVal - 0.3) * 4);
              const length = Math.min(rowHeight, finalVal * rowHeight * 1.1);

              ctx.globalAlpha = Math.min(1, finalVal + 0.2);
              ctx.fillRect(
                x + (spacing - thickness) / 2,
                y + (rowHeight - length) / 2,
                thickness,
                length
              );
            }
          }
        }
      }
      ctx.globalAlpha = 1.0;
      animationFrameId = requestAnimationFrame(render);
    };
    render();

    return () => cancelAnimationFrame(animationFrameId);
  }, [role]);

  return <canvas ref={canvasRef} style={{ width: '80px', height: '80px', display: 'block' }} />;
};

const RegistrationSuccess = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const containerRef = useRef();

  const team = location.state?.team;

  useEffect(() => {
    if (team) {
      gsap.fromTo('.success-reveal',
        { opacity: 0, y: 50 },
        {
          opacity: 1,
          y: 0,
          duration: 1,
          stagger: 0.2,
          ease: "power2.out"
        }
      );
    }
  }, [team]);

  if (!team) {
    return <Navigate to="/register" replace />;
  }

  return (
    <div style={{ position: 'relative', width: '100%', minHeight: '100vh', overflow: 'hidden' }}>
      
      {/* Hazard Header */}
      <div className="hazard-border-top"></div>

      <div className="story-container" ref={containerRef} style={{
        padding: '8rem 4rem',
        backgroundColor: 'transparent',
        display: 'flex',
        flexDirection: 'row',
        gap: '4rem',
        maxWidth: '1200px',
        margin: '0 auto',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'relative',
        zIndex: 100 // Above fog and vignette
      }}>

        {/* Left Column: Context */}
        <div className="success-reveal story-left" style={{ flex: '1 1 55%', minWidth: '400px', display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
          <div>
            <h2 style={{ fontSize: '3rem', color: 'var(--color-accent)', fontFamily: 'var(--font-serif)', marginBottom: '1rem', textTransform: 'uppercase' }}>
              REGISTRATION COMPLETE
            </h2>
            <div style={{ color: 'var(--color-text)', fontSize: '1.1rem', lineHeight: '1.8', fontFamily: 'var(--font-sans)', fontWeight: 300 }}>
              <p style={{ marginBottom: '1rem' }}>
                Your unit has been successfully cleared for deployment into the exclusion zone. Anomaly tracking has been activated.
              </p>
              
              <div style={{ display: 'flex', gap: '3rem', marginTop: '2rem', borderTop: '1px solid rgba(155, 168, 168, 0.3)', borderBottom: '1px solid rgba(155, 168, 168, 0.3)', padding: '1.5rem 0' }}>
                <div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', color: 'var(--color-accent)', marginBottom: '0.5rem' }}>UNIT DESIGNATION</div>
                  <div style={{ fontFamily: 'var(--font-sans)', fontSize: '1.5rem', fontWeight: 'bold', letterSpacing: '2px' }}>{team.teamName}</div>
                </div>
                <div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', color: 'var(--color-accent)', marginBottom: '0.5rem' }}>CLEARANCE ID</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.5rem', fontWeight: 'bold', color: '#39FF14' }}>{team.teamNumber}</div>
                </div>
              </div>
            </div>
          </div>

          <div style={{
            width: '100%',
            border: '1px solid #cc0000',
            background: 'rgba(204, 0, 0, 0.1)',
            padding: '2rem',
            position: 'relative',
            marginTop: '1rem'
          }}>
            <div style={{ position: 'absolute', top: '-12px', left: '20px', background: 'var(--color-bg)', padding: '0 10px', color: '#cc0000', fontFamily: 'var(--font-mono)', fontWeight: 'bold' }}>
              ⚠ MANDATORY PROTOCOL REVIEW
            </div>
            <p style={{ color: '#ffcccc', fontFamily: 'var(--font-mono)', fontSize: '1rem', lineHeight: '1.6' }}>
              ALL OPERATIVES MUST GO THROUGH EACH AND EVERY RULE PROPERLY AND READ THE RULEBOOK THOROUGHLY BEFORE STARTING THE GAME. FAILURE TO COMPLY WITH ZONE DIRECTIVES WILL RESULT IN IMMEDIATE DISQUALIFICATION AND POTENTIAL HAZARD EXPOSURE.
            </p>
          </div>

          <button 
            onClick={() => navigate('/')}
            style={{
              alignSelf: 'flex-start',
              background: 'transparent',
              color: 'var(--color-text)',
              border: '1px solid var(--color-accent)',
              padding: '1rem 2rem',
              fontFamily: 'var(--font-mono)',
              fontSize: '1rem',
              cursor: 'pointer',
              textTransform: 'uppercase',
              letterSpacing: '2px',
              transition: 'all 0.3s ease',
              marginTop: '1rem'
            }}
            onMouseEnter={(e) => { e.target.style.background = 'rgba(155, 168, 168, 0.2)'; }}
            onMouseLeave={(e) => { e.target.style.background = 'transparent'; }}
          >
            [ RETURN TO BASE ]
          </button>
        </div>

        {/* Right Column: Squad Roster */}
        <div className="success-reveal story-right" style={{
          flex: '0 0 350px',
          display: 'flex',
          flexDirection: 'column',
          gap: '2.5rem',
          borderLeft: '1px solid rgba(155, 168, 168, 0.3)',
          paddingLeft: '3rem'
        }}>
          {team.members.map((member, index) => {
            const role = ROLES[index] || '[OPERATIVE]';
            return (
              <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                {/* Avatar Canvas */}
                <PlayerAvatarCanvas role={role} />

                {/* Text labels */}
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ color: 'var(--color-text)', fontFamily: 'var(--font-sans)', letterSpacing: '2px', fontSize: '1.1rem', marginBottom: '0.2rem' }}>
                    {member.name.toUpperCase()}
                  </span>
                  <span style={{ color: 'var(--color-accent)', fontFamily: 'var(--font-mono)', letterSpacing: '1px', fontSize: '0.9rem' }}>
                    {role}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Hazard Footer */}
      <div className="hazard-border-bottom"></div>
    </div>
  );
};

export default RegistrationSuccess;
