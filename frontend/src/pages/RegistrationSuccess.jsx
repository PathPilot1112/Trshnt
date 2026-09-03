import React, { useRef, useEffect } from 'react';

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

const RegistrationSuccess = ({ team, onDone }) => {
  if (!team) return null;

  return (
    <div className="registration-success-wrapper" style={{
      padding: '2rem 1.5rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '1.5rem',
      maxWidth: '650px',
      margin: '0 auto',
      alignItems: 'center',
      position: 'relative',
      height: '100%',
      overflowY: 'auto'
    }}>
      <h2 style={{ fontSize: '1.8rem', color: 'var(--color-neon-green)', fontFamily: 'var(--font-serif)', textAlign: 'center', margin: 0, textShadow: '0 0 10px var(--color-green-glow)' }}>
        REGISTRATION COMPLETE
      </h2>

      <div style={{ color: 'var(--color-text)', fontSize: '0.9rem', lineHeight: '1.6', width: '100%', textAlign: 'center' }}>
        Your unit has been successfully cleared for deployment into the exclusion zone. Anomaly tracking is active.
      </div>

      <div style={{
        display: 'flex',
        justifyContent: 'space-around',
        width: '100%',
        borderTop: '1px solid rgba(155, 168, 168, 0.3)',
        borderBottom: '1px solid rgba(155, 168, 168, 0.3)',
        padding: '1rem 0'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--color-accent)', marginBottom: '0.2rem' }}>UNIT DESIGNATION</div>
          <div style={{ fontSize: '1.2rem', fontWeight: 'bold', letterSpacing: '1px' }}>{team.teamName || team.name}</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--color-accent)', marginBottom: '0.2rem' }}>CLEARANCE ID</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--color-neon-green)' }}>{team.teamNumber}</div>
        </div>
      </div>

      {/* Squad Roster */}
      <div style={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.8rem',
        maxHeight: '200px',
        overflowY: 'auto',
        paddingRight: '4px'
      }}>
        {team.members && team.members.map((member, index) => {
          const role = ROLES[index] || '[OPERATIVE]';
          return (
            <div key={index} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              padding: '0.4rem',
              border: '1px solid rgba(57, 255, 20, 0.15)',
              background: 'rgba(0, 39, 41, 0.3)'
            }}>
              <PlayerAvatarCanvas role={role} />
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ color: 'var(--color-text)', fontSize: '0.95rem', fontWeight: 'bold' }}>
                  {member.name ? member.name.toUpperCase() : ''}
                </span>
                <span style={{ color: 'var(--color-accent)', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
                  {role} - {member.registerNumber}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{
        width: '100%',
        border: '1px solid var(--color-red)',
        background: 'rgba(204, 0, 0, 0.15)',
        padding: '0.8rem 1rem',
        fontSize: '0.8rem',
        lineHeight: '1.4',
        fontFamily: 'var(--font-mono)'
      }}>
        <strong style={{ color: 'var(--color-red)' }}>⚠ PROTOCOL: </strong>
        ALL OPERATIVES MUST READ THE ZONE DIRECTIVES BEFORE PROCEEDING. UNAUTHORIZED MOVEMENTS WILL TRIGGER SECURITY OVERRIDE.
      </div>

      <button 
        onClick={onDone}
        className="cyber-btn striped"
        style={{
          width: '100%',
          padding: '0.8rem',
          fontSize: '1rem',
          textTransform: 'uppercase',
          letterSpacing: '2px',
          borderColor: 'var(--color-neon-green)',
          color: 'var(--color-bg)',
          background: 'var(--color-neon-green)',
          fontWeight: 'bold',
          cursor: 'pointer'
        }}
      >
        [ ENTER PDA INTERFACE ]
      </button>
    </div>
  );
};

export default RegistrationSuccess;
