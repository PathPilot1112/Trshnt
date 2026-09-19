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
  const videoRef = useRef();
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [isMuted, setIsMuted] = React.useState(true);

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

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          video.muted = true;
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      },
      { threshold: 0.2 }
    );

    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().catch(() => {});
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = (e) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

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
          flex-direction: row;
          gap: 3rem;
          max-width: 1200px;
          margin: 0 auto;
          align-items: flex-start;
          justify-content: space-between;
          box-sizing: border-box;
          width: 100%;
          overflow: hidden;
        }

        .story-left {
          flex: 1 1 60%;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          width: 100%;
        }

        .story-right {
          flex: 0 0 320px;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          border-left: 1px solid rgba(155, 168, 168, 0.3);
          padding-left: 2rem;
          box-sizing: border-box;
        }

        @media (max-width: 860px) {
          .story-container {
            flex-direction: column !important;
            gap: 2rem !important;
            padding: 2.2rem 1rem !important;
            width: 100% !important;
            max-width: 100% !important;
          }

          .story-left {
            width: 100% !important;
            max-width: 100% !important;
          }

          .story-right {
            width: 100% !important;
            max-width: 100% !important;
            flex: 1 1 auto !important;
            border-left: none !important;
            border-top: 1px solid rgba(155, 168, 168, 0.3) !important;
            padding-left: 0 !important;
            padding-top: 1.5rem !important;
            display: grid !important;
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 0.8rem !important;
          }
        }

        @media (max-width: 480px) {
          .story-right {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      {/* Left Column: Context & Video */}
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

        {/* Video Player */}
        <div
          onClick={togglePlay}
          style={{ width: '100%', position: 'relative', cursor: 'pointer', background: '#000', lineHeight: 0, borderRadius: '4px', overflow: 'hidden' }}
        >
          <video
            ref={videoRef}
            src="/Jumanji Open World - Official Trailer - Only In Cinemas This Christmas.mp4"
            loop
            playsInline
            preload="metadata"
            style={{ display: 'block', width: '100%', height: 'auto', maxHeight: '420px', objectFit: 'cover' }}
          />

          {/* Control bar */}
          <div style={{
            position: 'absolute',
            bottom: '12px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 4,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <button
              onClick={(e) => { e.stopPropagation(); togglePlay(); }}
              title={isPlaying ? 'Pause' : 'Play'}
              style={{
                width: '38px', height: '38px',
                borderRadius: '50%',
                background: 'rgba(0,0,0,0.6)',
                border: '1.5px solid rgba(255,255,255,0.75)',
                color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              {isPlaying ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
                  <rect x="5" y="3" width="4" height="18" rx="1"/>
                  <rect x="15" y="3" width="4" height="18" rx="1"/>
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="white" style={{ marginLeft: '2px' }}>
                  <polygon points="5,3 19,12 5,21"/>
                </svg>
              )}
            </button>

            <button
              onClick={toggleMute}
              title={isMuted ? 'Unmute' : 'Mute'}
              style={{
                width: '38px', height: '38px',
                borderRadius: '50%',
                background: isMuted ? 'rgba(204,0,0,0.7)' : 'rgba(0,0,0,0.6)',
                border: isMuted ? '1.5px solid rgba(255,80,80,0.9)' : '1.5px solid rgba(255,255,255,0.75)',
                color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              {isMuted ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
                  <path d="M11 5L6 9H2v6h4l5 4V5z"/>
                  <line x1="23" y1="9" x2="17" y2="15" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                  <line x1="17" y1="9" x2="23" y2="15" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                  <path d="M11 5L6 9H2v6h4l5 4V5z" fill="white" stroke="none"/>
                  <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
                </svg>
              )}
            </button>
          </div>
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
    </section>
  );
};

export default StorySection;
