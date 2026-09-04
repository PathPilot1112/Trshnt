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
        duration: 1,
        stagger: 0.2,
        scrollTrigger: {
          trigger: container.current,
          start: "top 70%",
        }
      }
    );
  }, { scope: container });

  return (
    <section id="history" className="history-section" ref={container} style={{
      padding: '8rem 4rem',
      backgroundColor: 'transparent'
    }}>
      <div className="history-wrapper" style={{ width: '100%', maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '4rem' }}>
        
        {/* Header Ribbon */}
        <div className="history-header" style={{ 
          borderTop: '1px solid var(--color-accent)', 
          borderBottom: '1px solid var(--color-accent)', 
          padding: '1rem 0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span style={{ fontFamily: 'var(--font-serif)', color: 'var(--color-accent)', fontSize: '1.2rem', letterSpacing: '4px' }}>
            ✦ HISTORICAL INDICATORS ✦
          </span>
          <span style={{ fontFamily: 'var(--font-serif)', color: 'var(--color-accent)', fontSize: '1.2rem', letterSpacing: '4px' }}>
            HISTORICAL INDICATORS ✦
          </span>
          <span style={{ fontFamily: 'var(--font-serif)', color: 'var(--color-accent)', fontSize: '1.2rem', letterSpacing: '4px' }}>
            HISTORICAL INDICATORS
          </span>
        </div>

        {/* Main Content Split */}
        <div className="history-content" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '2rem' }}>
          
          {/* Left Column */}
          <div className="premium-fade-up history-left" style={{ flex: '1 1 300px' }}>
            <span className="premium-label">INCIDENT TIMELINE BEGINS</span>
            <h2 className="history-title" style={{ fontSize: '4rem', lineHeight: '1.1', marginBottom: '2rem', color: 'var(--color-text)' }}>
              IN Q2<br/>1986
            </h2>
            
            <div style={{ marginTop: 'auto', paddingTop: '4rem' }}>
              <span style={{ fontFamily: 'var(--font-serif)', color: 'var(--color-accent)', fontSize: '1.2rem', letterSpacing: '2px', display: 'block', marginBottom: '1rem' }}>
                OUR FORECAST
              </span>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(155, 168, 168, 0.3)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
                <span className="premium-label" style={{ marginBottom: 0 }}>ESTIMATED HALF-LIFE:</span>
                <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text)' }}>~30 YEARS</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(155, 168, 168, 0.3)', paddingBottom: '0.5rem' }}>
                <span className="premium-label" style={{ marginBottom: 0 }}>AVERAGE ANNUAL RADIATION:</span>
                <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text)' }}>~65 mSv</span>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="premium-fade-up history-right" style={{ flex: '1 1 300px', display: 'flex', flexDirection: 'column', gap: '2rem', alignItems: 'flex-end', textAlign: 'right' }}>
            
            <div>
              <span className="premium-label">GUARANTEED ANOMALY RETURN:</span>
              <div className="premium-value">100%</div>
            </div>

            <div>
              <span className="premium-label">CONTAMINATION SEVERITY: (?)</span>
              <div className="premium-value">20% - 30%</div>
            </div>

            <div>
              <span className="premium-label">EVACUATION PLAN</span>
              <div className="premium-value" style={{ textTransform: 'uppercase' }}>UP TO 2 HOURS</div>
            </div>

            <div>
              <span className="premium-label">EXCLUSION RADIUS</span>
              <div className="premium-value" style={{ textTransform: 'uppercase' }}>FROM 30KM</div>
            </div>
            
            <div style={{ width: '100%', marginTop: '2rem', textAlign: 'left' }}>
              <span style={{ fontFamily: 'var(--font-serif)', color: 'var(--color-accent)', fontSize: '1.2rem', letterSpacing: '2px', display: 'block', marginBottom: '1rem' }}>
                ADDITIONAL DIRECTIVES
              </span>
              <div className="premium-divider" style={{ margin: '0.5rem 0 1rem 0' }}></div>
              <span className="premium-label" style={{ color: 'var(--color-text)', lineHeight: '1.6' }}>
                30 DAYS OF MANDATORY QUARANTINE POST-EXTRACTION
              </span>
              <div className="premium-divider" style={{ margin: '1rem 0' }}></div>
              <span className="premium-label" style={{ color: 'var(--color-text)', lineHeight: '1.6' }}>
                THE COMPLEX OPERATES YEAR-ROUND, THUS ENSURING STABLE DECAY
              </span>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
};

export default HistorySection;
