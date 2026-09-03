import React, { useRef, useEffect } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

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

          if (role === '[LEAD]') {
            // Spartan helmet
            if (j > centerY - 8 && j < centerY + 4) {
              const headDist = Math.sqrt(Math.pow(distX, 2) + Math.pow(j - centerY + 2, 2));
              if (headDist < 6) shapeVal = 1;
              // Visor cutout
              if (distX < 1.5 && j > centerY - 2 && j < centerY + 5) shapeVal = 0;
              if (j === centerY - 2 && distX < 3) shapeVal = 0;
            }
            // Shoulders
            if (j >= centerY + 4 && j < centerY + 10) {
              if (distX < 8) shapeVal = 0.7;
            }
          }
          else if (role === '[SCOUT]') {
            // Hood
            if (j > centerY - 10 && j < centerY + 5) {
              const headDist = Math.sqrt(Math.pow(distX, 2) + Math.pow(j - centerY + 2, 2) * 1.5);
              if (headDist < 7) shapeVal = 0.9;
              // Face shadow
              if (distX < 3.5 && j > centerY && j < centerY + 5) shapeVal = 0.1;
            }
            if (j >= centerY + 5 && j < centerY + 11) {
              if (distX < 9) shapeVal = 0.8;
            }
          }
          else if (role === '[SUPPORT]') {
            // Heavy helmet + shoulder pads
            if (j > centerY - 8 && j < centerY + 4) {
              const headDist = Math.sqrt(Math.pow(distX, 2) + Math.pow(j - centerY + 2, 2));
              if (headDist < 6.5) shapeVal = 1;
              // T Visor cutout
              if (distX < 2 && j > centerY - 2 && j < centerY + 3) shapeVal = 0;
              if (j === centerY - 2 && distX < 4) shapeVal = 0;
            }
            if (j >= centerY + 4 && j < centerY + 10) {
              if (distX < 7) shapeVal = 0.8; // Body
              if (distX >= 7 && distX < 11 && j < centerY + 8) shapeVal = 1; // Shoulder pads
            }
          }
          else if (role === '[ASSAULT]') {
            // Robot / Antennas
            if (j > centerY - 6 && j < centerY + 5) {
              const headDist = Math.sqrt(Math.pow(distX, 2) + Math.pow(j - centerY + 1, 2));
              if (headDist < 5) shapeVal = 1;
              // Eyes
              if (Math.abs(distX - 2) < 1 && j === centerY) shapeVal = 0;
            }
            // Antennas
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

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [role]);

  return <canvas ref={canvasRef} style={{ width: '80px', height: '80px', display: 'block' }} />;
};

const StorySection = () => {
  const container = useRef();
  const videoRef = useRef();
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [isMuted,   setIsMuted]   = React.useState(true); // starts muted (browser autoplay policy)

  useGSAP(() => {
    gsap.fromTo('.story-reveal',
      { opacity: 0, y: 50 },
      {
        opacity: 1,
        y: 0,
        duration: 1,
        stagger: 0.2,
        scrollTrigger: {
          trigger: container.current,
          start: "top 70%",
        }
      }
    );
  }, { scope: container });

  // Sync isPlaying + isMuted state from native video events
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const onPlay         = () => setIsPlaying(true);
    const onPause        = () => setIsPlaying(false);
    const onVolumeChange = () => setIsMuted(video.muted);
    video.addEventListener('play',         onPlay);
    video.addEventListener('pause',        onPause);
    video.addEventListener('volumechange', onVolumeChange);
    return () => {
      video.removeEventListener('play',         onPlay);
      video.removeEventListener('pause',        onPause);
      video.removeEventListener('volumechange', onVolumeChange);
    };
  }, []);

  // Autoplay muted on scroll into view (browser policy requires muted for autoplay);
  // pause on scroll out.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          video.muted = true; // must be muted for autoplay without gesture
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      },
      { threshold: 0.4 }
    );

    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  };

  const toggleMute = (e) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
  };

  const players = [
    { title: 'PLAYER_01', role: '[LEAD]' },
    { title: 'PLAYER_02', role: '[SCOUT]' },
    { title: 'PLAYER_03', role: '[SUPPORT]' },
    { title: 'PLAYER_04', role: '[ASSAULT]' }
  ];

  return (
    <section id="story" className="story-container" ref={container} style={{
      padding: '8rem 4rem',
      backgroundColor: 'transparent',
      display: 'flex',
      flexDirection: 'row',
      gap: '4rem',
      maxWidth: '1200px',
      margin: '0 auto',
      alignItems: 'center',
      justifyContent: 'space-between'
    }}>

      {/* Left Column: Context & Video */}
      <div className="story-reveal story-left" style={{ flex: '1 1 55%', minWidth: '400px', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <div>
          <h2 style={{ fontSize: '3rem', color: 'var(--color-accent)', fontFamily: 'var(--font-serif)', marginBottom: '1rem' }}>
            THE INCIDENT
          </h2>
          <p style={{ color: 'var(--color-text)', fontSize: '1.1rem', lineHeight: '1.8', fontFamily: 'var(--font-sans)', fontWeight: 300 }}>
            Decades after the catastrophic failure of Reactor 4, the exclusion zone remains sealed. But anomalies have begun to shift, revealing pathways to secure bunkers containing invaluable artifacts. You and your squad have been briefed. Your mission: infiltrate, secure the payload, and extract before the radiation consumes you.
          </p>
        </div>

        {/* ── Video Player ── */}
        <div
          onClick={togglePlay}
          style={{ width: '100%', position: 'relative', cursor: 'pointer', background: '#000', lineHeight: 0 }}
        >
          {/* Video */}
          <video
            ref={videoRef}
            src="/Jumanji Open World - Official Trailer - Only In Cinemas This Christmas.mp4"
            loop
            playsInline
            preload="metadata"
            style={{ display: 'block', width: '100%', height: 'auto' }}
          />

          {/* ── Control bar: Play/Pause + Mute/Unmute ── */}
          <div style={{
            position: 'absolute',
            bottom: '14px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 4,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>

            {/* Play / Pause */}
            <button
              onClick={(e) => { e.stopPropagation(); togglePlay(); }}
              title={isPlaying ? 'Pause' : 'Play'}
              style={{
                width: '44px', height: '44px',
                borderRadius: '50%',
                background: 'rgba(0,0,0,0.6)',
                border: '2px solid rgba(255,255,255,0.75)',
                color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer',
                backdropFilter: 'blur(6px)',
                transition: 'background 0.2s, transform 0.15s',
                boxShadow: '0 2px 12px rgba(0,0,0,0.5)',
                flexShrink: 0,
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.18)'; e.currentTarget.style.transform = 'scale(1.1)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.6)';        e.currentTarget.style.transform = 'scale(1)'; }}
            >
              {isPlaying ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                  <rect x="5" y="3" width="4" height="18" rx="1"/>
                  <rect x="15" y="3" width="4" height="18" rx="1"/>
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="white" style={{ marginLeft: '2px' }}>
                  <polygon points="5,3 19,12 5,21"/>
                </svg>
              )}
            </button>

            {/* Mute / Unmute */}
            <button
              onClick={toggleMute}
              title={isMuted ? 'Unmute' : 'Mute'}
              style={{
                width: '44px', height: '44px',
                borderRadius: '50%',
                background: isMuted ? 'rgba(204,0,0,0.7)' : 'rgba(0,0,0,0.6)',
                border: isMuted ? '2px solid rgba(255,80,80,0.9)' : '2px solid rgba(255,255,255,0.75)',
                color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer',
                backdropFilter: 'blur(6px)',
                transition: 'background 0.2s, border-color 0.2s, transform 0.15s',
                boxShadow: '0 2px 12px rgba(0,0,0,0.5)',
                flexShrink: 0,
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.1)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
            >
              {isMuted ? (
                /* Muted — speaker with X */
                <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                  <path d="M11 5L6 9H2v6h4l5 4V5z"/>
                  <line x1="23" y1="9" x2="17" y2="15" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                  <line x1="17" y1="9" x2="23" y2="15" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              ) : (
                /* Unmuted — speaker with waves */
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                  <path d="M11 5L6 9H2v6h4l5 4V5z" fill="white" stroke="none"/>
                  <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
                </svg>
              )}
            </button>
          </div>

          {/* Muted hint badge — top-right corner, disappears once unmuted */}
          {isMuted && (
            <div style={{
              position: 'absolute', top: '10px', right: '10px', zIndex: 4,
              background: 'rgba(0,0,0,0.7)',
              border: '1px solid rgba(255,255,255,0.3)',
              color: '#fff',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.6rem',
              letterSpacing: '1.5px',
              padding: '4px 10px',
              backdropFilter: 'blur(4px)',
              pointerEvents: 'none',
              textTransform: 'uppercase',
            }}>
              🔇 MUTED — CLICK 🔊 TO UNMUTE
            </div>
          )}
        </div>

      </div>

      {/* Right Column: Squad Roster */}
      <div className="story-reveal story-right" style={{
        flex: '0 0 350px',
        display: 'flex',
        flexDirection: 'column',
        gap: '2rem',
        borderLeft: '1px solid rgba(155, 168, 168, 0.3)',
        paddingLeft: '3rem'
      }}>
        {players.map((p, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
            {/* Avatar Canvas */}
            <PlayerAvatarCanvas role={p.role} />

            {/* Text labels */}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ color: 'var(--color-text)', fontFamily: 'var(--font-sans)', letterSpacing: '2px', fontSize: '1.1rem', marginBottom: '0.2rem' }}>{p.title}</span>
              <span style={{ color: 'var(--color-accent)', fontFamily: 'var(--font-mono)', letterSpacing: '1px', fontSize: '0.9rem' }}>{p.role}</span>
            </div>
          </div>
        ))}
      </div>

    </section>
  );
};

export default StorySection;
