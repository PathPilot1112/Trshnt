import React, { useRef, useEffect, useState } from 'react';
import { Shield, Compass, Crosshair, Zap } from 'lucide-react';

const RoleIcon = ({ role }) => {
  if (role === '[LEAD]') return <Shield size={28} style={{ color: '#39FF14' }} />;
  if (role === '[SCOUT]') return <Compass size={28} style={{ color: '#39FF14' }} />;
  if (role === '[SUPPORT]') return <Crosshair size={28} style={{ color: '#39FF14' }} />;
  return <Zap size={28} style={{ color: '#39FF14' }} />;
};

const StorySection = () => {
  const videoRef = useRef();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onVolumeChange = () => setIsMuted(video.muted);
    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onPause);
    video.addEventListener('volumechange', onVolumeChange);
    return () => {
      video.removeEventListener('play', onPlay);
      video.removeEventListener('pause', onPause);
      video.removeEventListener('volumechange', onVolumeChange);
    };
  }, []);

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
      { threshold: 0.3 }
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
    { title: 'PLAYER_01', role: '[LEAD]', desc: 'Squad Leader & Tactical Navigator' },
    { title: 'PLAYER_02', role: '[SCOUT]', desc: 'Recon & Anomaly Detection' },
    { title: 'PLAYER_03', role: '[SUPPORT]', desc: 'Heavy Equipment & Intel' },
    { title: 'PLAYER_04', role: '[ASSAULT]', desc: 'Extraction & Perimeter Defense' }
  ];

  return (
    <section id="story" className="story-container" style={{
      padding: '6rem 2rem',
      backgroundColor: 'transparent',
      display: 'flex',
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: '3rem',
      maxWidth: '1200px',
      margin: '0 auto',
      alignItems: 'center',
      justifyContent: 'space-between'
    }}>
      {/* Left Column: Mission Briefing & Video */}
      <div style={{ flex: '1 1 500px', display: 'flex', flexDirection: 'column', gap: '1.8rem' }}>
        <div>
          <div style={{ fontSize: '0.85rem', color: '#39FF14', fontFamily: 'var(--font-mono)', letterSpacing: '2px', marginBottom: '0.5rem' }}>
            // CLASSIFIED_BRIEFING
          </div>
          <h2 style={{ fontSize: 'clamp(2.2rem, 5vw, 3.2rem)', color: '#D9E0E0', fontFamily: 'var(--font-serif)', marginBottom: '1rem', letterSpacing: '2px' }}>
            THE INCIDENT
          </h2>
          <p style={{ color: 'rgba(217, 224, 224, 0.85)', fontSize: '1.05rem', lineHeight: '1.8', fontFamily: 'var(--font-sans)', fontWeight: 300 }}>
            Decades after the catastrophic failure of Reactor 4, the exclusion zone remains sealed. Anomalies have begun to shift, revealing pathways to secure bunkers containing invaluable artifacts. Infiltrate the zone, secure the payload, and extract before radiation reaches lethal thresholds.
          </p>
        </div>

        {/* Video Player Box */}
        <div
          onClick={togglePlay}
          style={{
            width: '100%',
            position: 'relative',
            cursor: 'pointer',
            background: '#040d0e',
            border: '1px solid rgba(57, 255, 20, 0.3)',
            borderRadius: '4px',
            overflow: 'hidden',
            boxShadow: '0 0 25px rgba(0, 0, 0, 0.8)'
          }}
        >
          <video
            ref={videoRef}
            src="/Jumanji Open World - Official Trailer - Only In Cinemas This Christmas.mp4"
            loop
            playsInline
            preload="metadata"
            style={{ display: 'block', width: '100%', height: 'auto', opacity: 0.9 }}
          />

          <div style={{
            position: 'absolute',
            bottom: '12px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 4,
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <button
              onClick={(e) => { e.stopPropagation(); togglePlay(); }}
              style={{
                width: '42px', height: '42px',
                borderRadius: '50%',
                background: 'rgba(0,0,0,0.7)',
                border: '1.5px solid #39FF14',
                color: '#39FF14',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              {isPlaying ? '⏸' : '▶'}
            </button>

            <button
              onClick={toggleMute}
              style={{
                width: '42px', height: '42px',
                borderRadius: '50%',
                background: isMuted ? 'rgba(204,0,0,0.7)' : 'rgba(0,0,0,0.7)',
                border: isMuted ? '1.5px solid #ff4444' : '1.5px solid #39FF14',
                color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              {isMuted ? '🔇' : '🔊'}
            </button>
          </div>
        </div>
      </div>

      {/* Right Column: Squad Roster */}
      <div style={{
        flex: '1 1 340px',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.4rem',
        borderLeft: '1px solid rgba(155, 168, 168, 0.25)',
        paddingLeft: 'clamp(1rem, 3vw, 2.5rem)'
      }}>
        <div style={{ fontFamily: 'var(--font-serif)', color: '#39FF14', fontSize: '1.2rem', letterSpacing: '3px', marginBottom: '0.5rem' }}>
          SQUAD ROSTER REQUIREMENTS
        </div>

        {players.map((p, i) => (
          <div key={i} style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1.2rem',
            padding: '12px 16px',
            background: 'rgba(8, 20, 22, 0.7)',
            border: '1px solid rgba(155, 168, 168, 0.2)',
            borderRadius: '4px'
          }}>
            <div style={{
              width: '50px',
              height: '50px',
              borderRadius: '4px',
              background: 'rgba(57, 255, 20, 0.08)',
              border: '1px solid rgba(57, 255, 20, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <RoleIcon role={p.role} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ color: '#D9E0E0', fontFamily: 'var(--font-mono)', fontWeight: 'bold', fontSize: '1rem' }}>{p.title}</span>
              <span style={{ color: '#39FF14', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>{p.role}</span>
              <span style={{ color: '#9BA8A8', fontFamily: 'var(--font-sans)', fontSize: '0.8rem', marginTop: '2px' }}>{p.desc}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default StorySection;
