import React, { useRef, useEffect } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

const PlayerAvatarCanvas = ({ role }) => {
  const canvasRef = useRef();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
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

          if (role === '[LEAD]') {
            // Spartan helmet
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
            // Hood
            if (j > centerY - 10 && j < centerY + 5) {
              const headDist = Math.sqrt(Math.pow(distX, 2) + Math.pow(j - centerY + 2, 2) * 1.5);
              if (headDist < 7) shapeVal = 0.9;
              if (j > centerY - 1 && j < centerY + 4 && distX < 2.5) shapeVal = 0;
            }
            if (j >= centerY + 5 && j < centerY + 10) {
              if (distX < 6) shapeVal = 0.8;
            }
          }
          else if (role === '[SUPPORT]') {
            // Gasmask
            if (j > centerY - 6 && j < centerY + 4) {
              const headDist = Math.sqrt(Math.pow(distX, 2) + Math.pow(j - centerY, 2));
              if (headDist < 5.5) shapeVal = 1;
              if (j > centerY - 4 && j < centerY - 1 && distX < 4) shapeVal = 0;
            }
            if (j >= centerY + 2 && j < centerY + 7 && distX < 3) {
              shapeVal = 1;
            }
            if (j >= centerY + 4 && j < centerY + 10) {
              if (distX < 9) shapeVal = 0.7;
            }
          }
          else {
            // Assault
            if (j > centerY - 7 && j < centerY + 5) {
              const headDist = Math.max(distX * 1.1, Math.abs(j - centerY));
              if (headDist < 5.5) shapeVal = 1;
              if (j === centerY - 1 && distX < 3.5) shapeVal = 0;
            }
            if (j >= centerY + 5 && j < centerY + 10) {
              if (distX < 8) shapeVal = 0.8;
            }
          }

          if (shapeVal > 0) {
            const noise = noiseMap[i % 50][j % 50];
            const dynamicVal = Math.sin(time + i * 0.2 + j * 0.3) * 0.2;
            const finalAlpha = Math.min(1, Math.max(0.1, shapeVal * 0.8 + dynamicVal + noise * 0.2));

            ctx.globalAlpha = finalAlpha;
            ctx.fillRect(x, y, spacing - 1, rowHeight - 1);
          }
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [role]);

  return (
    <canvas 
      ref={canvasRef} 
      style={{ 
        width: '60px', 
        height: '60px', 
        backgroundColor: '#001516', 
        border: '1px solid rgba(155, 168, 168, 0.4)',
        borderRadius: '4px',
        flexShrink: 0
      }} 
    />
  );
};

const StorySection = () => {
  const container = useRef();

  useGSAP(() => {
    gsap.from('.story-reveal', {
      scrollTrigger: {
        trigger: container.current,
        start: 'top 80%',
      },
      y: 40,
      opacity: 0,
      duration: 0.8,
      stagger: 0.2,
      ease: 'power3.out'
    });
  }, { scope: container });

  const players = [
    { title: 'PLAYER_01', role: '[LEAD]' },
    { title: 'PLAYER_02', role: '[SCOUT]' },
    { title: 'PLAYER_03', role: '[SUPPORT]' },
    { title: 'PLAYER_04', role: '[ASSAULT]' }
  ];

  return (
    <section id="story" className="story-container" ref={container}>
      <style>{`
        .story-container {
          padding: clamp(3rem, 6vw, 6rem) clamp(1rem, 4vw, 3rem);
          background-color: transparent;
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 100%;
          max-width: 1200px;
          margin: 0 auto;
          box-sizing: border-box;
        }

        .story-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: clamp(2rem, 5vw, 4rem);
          width: 100%;
          align-items: center;
          box-sizing: border-box;
        }

        .story-left {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          min-width: 0;
        }

        .story-right {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1.2rem;
          min-width: 0;
        }

        @media (max-width: 860px) {
          .story-grid {
            grid-template-columns: 1fr !important;
            gap: 2.5rem !important;
          }
        }

        @media (max-width: 480px) {
          .story-right {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      <div className="story-grid">
        {/* Left Column: Context */}
        <div className="story-reveal story-left">
          <div>
            <h2 style={{ 
              fontSize: 'clamp(1.6rem, 5.5vw, 2.8rem)', 
              color: 'var(--color-accent)', 
              fontFamily: 'var(--font-serif)', 
              marginBottom: '0.8rem',
              lineHeight: 1.15,
              letterSpacing: 'clamp(1px, 0.4vw, 3px)',
              wordBreak: 'break-word',
              overflowWrap: 'break-word'
            }}>
              THE INCIDENT
            </h2>
            <p style={{ 
              color: 'var(--color-text)', 
              fontSize: 'clamp(0.85rem, 2.8vw, 1.05rem)', 
              lineHeight: 1.65, 
              fontFamily: 'var(--font-sans)', 
              fontWeight: 300,
              margin: 0,
              wordBreak: 'normal',
              overflowWrap: 'break-word'
            }}>
              Decades after the catastrophic failure of Reactor 4, the exclusion zone remains sealed. But anomalies have begun to shift, revealing pathways to secure bunkers containing invaluable artifacts. You and your squad have been briefed. Your mission: infiltrate, secure the payload, and extract before the radiation consumes you.
            </p>
          </div>
        </div>

        {/* Right Column: Squad Roster */}
        <div className="story-reveal story-right">
          {players.map((p, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(0,25,28,0.5)', padding: '8px 12px', border: '1px solid rgba(155,168,168,0.15)', borderRadius: '4px' }}>
              <PlayerAvatarCanvas role={p.role} />
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ color: 'var(--color-text)', fontFamily: 'var(--font-sans)', letterSpacing: '1px', fontSize: '0.95rem', fontWeight: 600 }}>{p.title}</span>
                <span style={{ color: '#39FF14', fontFamily: 'var(--font-mono)', letterSpacing: '1px', fontSize: '0.8rem' }}>{p.role}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StorySection;
