import React, { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

const HistorySection = () => {
  const container = useRef();

  useGSAP(() => {
    gsap.fromTo('.premium-fade-up', 
      { opacity: 0, y: 30 },
      {
        opacity: 1, 
        y: 0,
        duration: 0.8,
        stagger: 0.15,
        scrollTrigger: {
          trigger: container.current,
          start: "top 75%",
        }
      }
    );
  }, { scope: container });

  return (
    <section id="history" className="history-section" ref={container} style={{
      padding: 'clamp(3rem, 6vw, 7rem) clamp(1rem, 4vw, 3rem)',
      backgroundColor: 'transparent',
      boxSizing: 'border-box',
      width: '100%',
      overflow: 'hidden'
    }}>
      <style>{`
        @media (max-width: 768px) {
          .history-extra-label {
            display: none !important;
          }
          .history-right {
            align-items: flex-start !important;
            text-align: left !important;
            margin-top: 1.5rem;
          }
        }
      `}</style>

      <div className="history-wrapper" style={{ width: '100%', maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
        
        {/* Header Ribbon */}
        <div className="history-header" style={{ 
          borderTop: '1px solid var(--color-accent)', 
          borderBottom: '1px solid var(--color-accent)', 
          padding: '0.8rem 0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          overflow: 'hidden'
        }}>
          <span style={{ fontFamily: 'var(--font-serif)', color: 'var(--color-accent)', fontSize: 'clamp(0.9rem, 2.5vw, 1.2rem)', letterSpacing: 'clamp(1px, 1vw, 4px)' }}>
            ✦ HISTORICAL INDICATORS ✦
          </span>
          <span className="history-extra-label" style={{ fontFamily: 'var(--font-serif)', color: 'var(--color-accent)', fontSize: '1.2rem', letterSpacing: '4px' }}>
            HISTORICAL INDICATORS ✦
          </span>
          <span className="history-extra-label" style={{ fontFamily: 'var(--font-serif)', color: 'var(--color-accent)', fontSize: '1.2rem', letterSpacing: '4px' }}>
            HISTORICAL INDICATORS
          </span>
        </div>

        {/* Main Content Split */}
        <div className="history-content" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '2rem' }}>
          
          {/* Left Column */}
          <div className="premium-fade-up history-left" style={{ flex: '1 1 280px', minWidth: 0 }}>
            <span className="premium-label" style={{ color: 'var(--color-accent)', fontSize: '0.85rem', fontFamily: 'var(--font-mono)' }}>INCIDENT TIMELINE BEGINS</span>
            <h2 className="history-title" style={{ fontSize: 'clamp(2.5rem, 7vw, 4rem)', lineHeight: '1.1', margin: '0.5rem 0 1.5rem 0', color: 'var(--color-text)' }}>
              IN Q2<br/>1986
            </h2>
            
            <div style={{ marginTop: 'auto', paddingTop: '2rem' }}>
              <span style={{ fontFamily: 'var(--font-serif)', color: '#39FF14', fontSize: '1.1rem', letterSpacing: '2px', display: 'block', marginBottom: '0.8rem' }}>
                OUR FORECAST
              </span>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(155, 168, 168, 0.3)', paddingBottom: '0.5rem', marginBottom: '0.8rem', gap: '1rem', flexWrap: 'wrap' }}>
                <span className="premium-label" style={{ marginBottom: 0, fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}>ESTIMATED HALF-LIFE:</span>
                <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text)' }}>~30 YEARS</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(155, 168, 168, 0.3)', paddingBottom: '0.5rem', gap: '1rem', flexWrap: 'wrap' }}>
                <span className="premium-label" style={{ marginBottom: 0, fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}>AVERAGE ANNUAL RADIATION:</span>
                <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text)' }}>~65 mSv</span>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="premium-fade-up history-right" style={{ flex: '1 1 280px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: '1.5rem', alignItems: 'flex-end', textAlign: 'right' }}>
            
            <div>
              <span className="premium-label" style={{ color: 'var(--color-accent)', fontSize: '0.85rem', fontFamily: 'var(--font-mono)' }}>GUARANTEED ANOMALY RETURN:</span>
              <div className="premium-value" style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', color: '#39FF14', fontWeight: 'bold' }}>100%</div>
            </div>

            <div>
              <span className="premium-label" style={{ color: 'var(--color-accent)', fontSize: '0.85rem', fontFamily: 'var(--font-mono)' }}>CONTAMINATION SEVERITY:</span>
              <div className="premium-value" style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', color: 'var(--color-text)', fontWeight: 'bold' }}>20% - 30%</div>
            </div>

            <div>
              <span className="premium-label" style={{ color: 'var(--color-accent)', fontSize: '0.85rem', fontFamily: 'var(--font-mono)' }}>EVACUATION PLAN</span>
              <p style={{ color: 'rgba(217, 224, 224, 0.8)', fontSize: '0.95rem', maxWidth: '380px', marginTop: '0.5rem', lineHeight: 1.6, fontFamily: 'var(--font-sans)' }}>
                Upon anomaly breach, immediate quarantine locks engage automatically. Units failing extraction are classified M.I.A.
              </p>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
};

export default HistorySection;
