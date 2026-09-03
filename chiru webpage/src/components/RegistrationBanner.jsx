import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

const RegistrationBanner = () => {
  const bannerRef = useRef();
  const navigate = useNavigate();

  useGSAP(() => {
    gsap.from('.banner-content', {
      scrollTrigger: {
        trigger: bannerRef.current,
        start: 'top 80%',
      },
      y: 50,
      opacity: 0,
      duration: 1,
      ease: 'power3.out'
    });
  }, { scope: bannerRef });

  return (
    <section id="registration-banner" ref={bannerRef} style={{
      minHeight: 'auto',
      padding: '4rem',
      backgroundColor: 'rgba(0, 39, 41, 0.5)',
      borderTop: '1px solid rgba(155, 168, 168, 0.2)',
      borderBottom: '1px solid rgba(155, 168, 168, 0.2)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      zIndex: 10
    }}>

      <div className="banner-content" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        maxWidth: '1200px',
        width: '100%',
        gap: '2rem',
        flexWrap: 'wrap'
      }}>

        {/* Text Content */}
        <div style={{ flex: '1 1 500px' }}>
          <h2 style={{
            fontSize: '2.5rem',
            color: 'var(--color-text)',
            marginBottom: '1rem',
            textShadow: '0 0 10px rgba(217, 224, 224, 0.3)'
          }}>
            THE COUNTDOWN HAS BEGUN
          </h2>
          <p style={{
            fontSize: '1.2rem',
            color: 'var(--color-accent)',
            marginBottom: '2rem',
            maxWidth: '600px',
            lineHeight: 1.8
          }}>
            Come join the elite forces. Register yourself and prepare for a great experience that will test your limits. The perimeter is closing in. Are you ready?
          </p>

          <button
            onClick={() => {
              window.scrollTo(0, 0);
              navigate('/register');
            }}
            style={{
              padding: '1rem 3rem',
              background: 'transparent',
              border: '2px solid var(--color-accent)',
              color: 'var(--color-text)',
              fontFamily: 'var(--font-mono)',
              fontSize: '1.2rem',
              cursor: 'pointer',
              textTransform: 'uppercase',
              letterSpacing: '2px',
              transition: 'all 0.3s ease',
              position: 'relative',
              overflow: 'hidden'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--color-accent)';
              e.currentTarget.style.color = 'var(--color-bg)';
              e.currentTarget.style.boxShadow = '0 0 20px rgba(155, 168, 168, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'var(--color-text)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            [ REGISTER NOW ]
          </button>
        </div>

        {/* Topographic Heatmap Scanner */}
        <div style={{ 
          flex: '1 1 400px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <div className="heatmap-scanner" style={{
            width: '100%',
            maxWidth: '450px',
            aspectRatio: '4/3',
            background: '#091515',
            border: '2px solid rgba(57, 255, 20, 0.3)',
            borderRadius: '8px',
            position: 'relative',
            overflow: 'hidden',
            fontFamily: 'var(--font-mono)',
            color: 'rgba(57, 255, 20, 0.7)',
            boxShadow: 'inset 0 0 20px rgba(0, 0, 0, 0.8), 0 0 15px rgba(57, 255, 20, 0.1)',
            padding: '1rem'
          }}>
            {/* Corner Brackets */}
            <div style={{ position: 'absolute', top: 0, left: 0, width: '20px', height: '20px', borderTop: '3px solid rgba(57, 255, 20, 0.8)', borderLeft: '3px solid rgba(57, 255, 20, 0.8)' }}></div>
            <div style={{ position: 'absolute', top: 0, right: 0, width: '20px', height: '20px', borderTop: '3px solid rgba(57, 255, 20, 0.8)', borderRight: '3px solid rgba(57, 255, 20, 0.8)' }}></div>
            <div style={{ position: 'absolute', bottom: 0, left: 0, width: '20px', height: '20px', borderBottom: '3px solid rgba(57, 255, 20, 0.8)', borderLeft: '3px solid rgba(57, 255, 20, 0.8)' }}></div>
            <div style={{ position: 'absolute', bottom: 0, right: 0, width: '20px', height: '20px', borderBottom: '3px solid rgba(57, 255, 20, 0.8)', borderRight: '3px solid rgba(57, 255, 20, 0.8)' }}></div>

            {/* Inner Screen */}
            <div style={{
              position: 'absolute',
              top: '1rem', left: '1rem', right: '1rem', bottom: '1rem',
              background: 'linear-gradient(rgba(57, 255, 20, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(57, 255, 20, 0.1) 1px, transparent 1px)',
              backgroundSize: '25% 25%',
              border: '1px solid rgba(57, 255, 20, 0.2)',
              zIndex: 1
            }}>
              {/* Grid Labels */}
              <div style={{ position: 'absolute', top: '2%', left: '2%', fontSize: '0.5rem' }}>A3</div>
              <div style={{ position: 'absolute', top: '2%', left: '27%', fontSize: '0.5rem' }}>A7</div>
              <div style={{ position: 'absolute', top: '2%', left: '77%', fontSize: '0.5rem' }}>C7</div>
              <div style={{ position: 'absolute', top: '27%', left: '2%', fontSize: '0.5rem' }}>A3</div>
              <div style={{ position: 'absolute', top: '52%', left: '2%', fontSize: '0.5rem' }}>B3</div>
              <div style={{ position: 'absolute', bottom: '2%', left: '2%', fontSize: '0.5rem' }}>A3</div>
              <div style={{ position: 'absolute', bottom: '2%', left: '27%', fontSize: '0.5rem' }}>C7</div>
              <div style={{ position: 'absolute', bottom: '2%', left: '52%', fontSize: '0.5rem' }}>G7</div>
              <div style={{ position: 'absolute', bottom: '2%', left: '77%', fontSize: '0.5rem' }}>A5</div>

              {/* Heatmap Blur Blobs */}
              <div className="heatmap-blobs" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', filter: 'blur(15px)', zIndex: -1 }}>
                <div style={{ position: 'absolute', top: '10%', left: '15%', width: '70%', height: '80%', background: 'radial-gradient(ellipse, rgba(57, 255, 20, 0.4) 0%, transparent 60%)' }}></div>
                <div style={{ position: 'absolute', top: '20%', left: '25%', width: '50%', height: '60%', background: 'radial-gradient(ellipse, rgba(255, 200, 0, 0.5) 0%, transparent 50%)' }}></div>
                <div style={{ position: 'absolute', top: '35%', left: '25%', width: '30%', height: '30%', background: 'radial-gradient(circle, rgba(255, 0, 0, 0.7) 0%, transparent 60%)' }}></div>
                <div style={{ position: 'absolute', top: '15%', left: '55%', width: '25%', height: '35%', background: 'radial-gradient(circle, rgba(255, 0, 0, 0.6) 0%, transparent 60%)' }}></div>
                <div style={{ position: 'absolute', top: '65%', left: '55%', width: '20%', height: '20%', background: 'radial-gradient(circle, rgba(255, 100, 0, 0.5) 0%, transparent 60%)' }}></div>
              </div>

              {/* Topographic Contour Lines SVG */}
              <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: 'absolute', top: 0, left: 0, zIndex: 0 }}>
                {/* Green */}
                <path d="M 25,50 C 25,20 60,10 80,25 C 90,40 85,60 75,70 C 80,85 60,95 40,85 C 20,90 10,70 25,50 Z" fill="none" stroke="rgba(57, 255, 20, 0.4)" strokeWidth="0.5"/>
                <path d="M 30,50 C 30,30 55,20 70,30 C 80,40 75,55 70,65 C 70,75 55,85 40,75 C 25,80 20,65 30,50 Z" fill="none" stroke="rgba(57, 255, 20, 0.6)" strokeWidth="0.5"/>
                {/* Yellow */}
                <path d="M 35,50 C 35,35 50,25 65,35 C 70,42 65,52 65,60 C 65,68 50,75 40,68 C 30,70 28,60 35,50 Z" fill="none" stroke="rgba(255, 200, 0, 0.5)" strokeWidth="0.4"/>
                <path d="M 38,50 C 38,40 48,30 60,38 C 65,42 62,50 62,55 C 62,62 48,68 40,62 C 34,62 33,55 38,50 Z" fill="none" stroke="rgba(255, 200, 0, 0.7)" strokeWidth="0.4"/>
                {/* Red Left */}
                <path d="M 40,50 C 40,43 45,40 50,45 C 53,48 50,55 45,55 C 41,55 39,53 40,50 Z" fill="none" stroke="rgba(255, 0, 0, 0.6)" strokeWidth="0.3"/>
                <path d="M 42,50 C 42,46 45,44 48,47 C 49,49 47,53 45,53 C 43,53 41,51 42,50 Z" fill="none" stroke="rgba(255, 0, 0, 0.8)" strokeWidth="0.3"/>
                {/* Red Top Right */}
                <path d="M 58,35 C 58,30 65,28 68,33 C 70,36 67,40 64,40 C 60,40 57,38 58,35 Z" fill="none" stroke="rgba(255, 0, 0, 0.6)" strokeWidth="0.3"/>
                {/* Orange Bottom Right */}
                <path d="M 60,65 C 60,60 65,58 68,62 C 70,66 65,70 62,68 C 59,67 59,66 60,65 Z" fill="none" stroke="rgba(255, 100, 0, 0.6)" strokeWidth="0.3"/>
              </svg>

              {/* Target Crosshair */}
              <div className="target-crosshair" style={{ position: 'absolute', top: '50%', left: '45%', width: '40px', height: '40px', transform: 'translate(-50%, -50%)', zIndex: 2 }}>
                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: '2px solid rgba(255, 0, 0, 0.7)', borderRadius: '50%', animation: 'pulse-ring 2s infinite' }}></div>
                <div style={{ position: 'absolute', top: '50%', left: '-15px', right: '-15px', height: '2px', background: 'rgba(255, 0, 0, 0.8)' }}></div>
                <div style={{ position: 'absolute', left: '50%', top: '-15px', bottom: '-15px', width: '2px', background: 'rgba(255, 0, 0, 0.8)' }}></div>
                
                <div style={{ position: 'absolute', top: '15px', left: '-60px', color: '#ff003c', fontSize: '0.5rem', fontWeight: 'bold', textShadow: '0 0 5px rgba(255,0,0,0.5)', textAlign: 'right', animation: 'blink 1.5s infinite' }}>
                  TARGET<br/>LOCATION
                </div>
              </div>

              {/* Legends */}
              <div style={{ position: 'absolute', top: '5%', right: '5%', width: '80px', border: '1px solid rgba(57, 255, 20, 0.3)', background: 'rgba(0, 20, 15, 0.8)', padding: '5px', zIndex: 2 }}>
                <div style={{ fontSize: '0.4rem', borderBottom: '1px solid rgba(57, 255, 20, 0.3)', paddingBottom: '3px', marginBottom: '3px' }}>LEGEND</div>
                <div style={{ fontSize: '0.35rem', marginBottom: '5px' }}>RADIATION INTENSITY</div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '2px' }}>
                   <div style={{ width: '8px', height: '8px', background: 'red' }}></div> <span style={{ fontSize: '0.35rem' }}>&gt;3000R/h</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '2px' }}>
                   <div style={{ width: '8px', height: '8px', background: 'orange' }}></div> <span style={{ fontSize: '0.35rem' }}>1000-3000</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '2px' }}>
                   <div style={{ width: '8px', height: '8px', background: 'yellow' }}></div> <span style={{ fontSize: '0.35rem' }}>500-1000</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '2px' }}>
                   <div style={{ width: '8px', height: '8px', background: 'lime' }}></div> <span style={{ fontSize: '0.35rem' }}>100-500</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                   <div style={{ width: '8px', height: '8px', background: 'green' }}></div> <span style={{ fontSize: '0.35rem' }}>&lt;100</span>
                </div>
              </div>

              <div style={{ position: 'absolute', bottom: '5%', right: '5%', width: '80px', border: '1px solid rgba(57, 255, 20, 0.3)', background: 'rgba(0, 20, 15, 0.8)', padding: '5px', zIndex: 2 }}>
                <div style={{ fontSize: '0.35rem', marginBottom: '5px' }}>RADIATION INTENSITY</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                   <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}><div style={{ width: '10px', height: '4px', background: 'red' }}></div><span style={{ fontSize: '0.3rem' }}>&gt;10000</span></div>
                   <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}><div style={{ width: '10px', height: '4px', background: 'orange' }}></div><span style={{ fontSize: '0.3rem' }}>5000-10000</span></div>
                   <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}><div style={{ width: '10px', height: '4px', background: 'yellow' }}></div><span style={{ fontSize: '0.3rem' }}>1000-5000</span></div>
                   <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}><div style={{ width: '10px', height: '4px', background: 'lime' }}></div><span style={{ fontSize: '0.3rem' }}>&lt;1000</span></div>
                </div>
              </div>
            </div>

            {/* Bottom Labels */}
            <div style={{ position: 'absolute', bottom: '1rem', left: '1rem', background: 'rgba(57, 255, 20, 0.1)', border: '1px solid rgba(57, 255, 20, 0.3)', padding: '2px 8px', fontSize: '0.5rem', zIndex: 2 }}>
              ZONE_4_RADIATION_HEATMAP_DATA
            </div>
            <div style={{ position: 'absolute', bottom: '0.5rem', right: '1.2rem', fontSize: '0.4rem', zIndex: 2, opacity: 0.7 }}>
              51.3894° N, 30.0994° E
            </div>
          </div>
        </div>

      </div>

      <style>{`
        @keyframes pulse-ring {
          0% { transform: scale(0.8); opacity: 0.8; box-shadow: 0 0 0 0 rgba(255, 0, 0, 0.7); }
          70% { transform: scale(1.2); opacity: 0; box-shadow: 0 0 0 10px rgba(255, 0, 0, 0); }
          100% { transform: scale(0.8); opacity: 0; }
        }
        @keyframes blink {
          0%, 49% { opacity: 1; }
          50%, 100% { opacity: 0.5; }
        }
        @keyframes spin {
          100% { transform: rotate(360deg); }
        }
        @media (max-width: 768px) {
          .banner-content {
            text-align: center;
          }
          .banner-content button {
            width: 100%;
          }
        }
      `}</style>
    </section>
  );
};

export default RegistrationBanner;
