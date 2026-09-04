import React from 'react';

const HistorySection = () => {
  return (
    <section id="history" className="history-section" style={{
      padding: '5rem 1.5rem',
      backgroundColor: 'transparent'
    }}>
      <div className="history-wrapper" style={{ width: '100%', maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '3rem' }}>
        
        {/* Header Ribbon */}
        <div className="history-header" style={{ 
          borderTop: '1px solid rgba(57, 255, 20, 0.3)', 
          borderBottom: '1px solid rgba(57, 255, 20, 0.3)', 
          padding: '1rem 0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <span style={{ fontFamily: 'var(--font-serif)', color: '#39FF14', fontSize: '1rem', letterSpacing: '3px' }}>
            ✦ HISTORICAL INDICATORS
          </span>
          <span style={{ fontFamily: 'var(--font-serif)', color: '#39FF14', fontSize: '1rem', letterSpacing: '3px' }}>
            ZONE TELEMETRY DATA
          </span>
          <span style={{ fontFamily: 'var(--font-serif)', color: '#39FF14', fontSize: '1rem', letterSpacing: '3px' }}>
            PRIPYAT SECTOR ✦
          </span>
        </div>

        {/* Main Content Split */}
        <div className="history-content" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '3rem' }}>
          
          {/* Left Column */}
          <div style={{ flex: '1 1 320px' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: '#39FF14', letterSpacing: '2px' }}>
              INCIDENT TIMELINE BEGINS
            </span>
            <h2 style={{ fontSize: 'clamp(3rem, 6vw, 4.5rem)', lineHeight: '1.1', margin: '1rem 0 2rem 0', color: '#D9E0E0', fontFamily: 'var(--font-serif)' }}>
              IN Q2<br/>1986
            </h2>
            
            <div style={{ marginTop: '2rem' }}>
              <span style={{ fontFamily: 'var(--font-serif)', color: '#39FF14', fontSize: '1.1rem', letterSpacing: '2px', display: 'block', marginBottom: '1rem' }}>
                FORECAST & MEASUREMENTS
              </span>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(155, 168, 168, 0.25)', paddingBottom: '0.6rem', marginBottom: '1rem' }}>
                <span style={{ color: '#9BA8A8', fontFamily: 'var(--font-mono)', fontSize: '0.9rem' }}>ESTIMATED HALF-LIFE:</span>
                <span style={{ fontFamily: 'var(--font-mono)', color: '#D9E0E0', fontWeight: 'bold' }}>~30 YEARS</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(155, 168, 168, 0.25)', paddingBottom: '0.6rem' }}>
                <span style={{ color: '#9BA8A8', fontFamily: 'var(--font-mono)', fontSize: '0.9rem' }}>AVERAGE ANNUAL RADIATION:</span>
                <span style={{ fontFamily: 'var(--font-mono)', color: '#D9E0E0', fontWeight: 'bold' }}>~65 mSv</span>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div style={{ flex: '1 1 320px', display: 'flex', flexDirection: 'column', gap: '1.8rem' }}>
            <div>
              <span style={{ color: '#9BA8A8', fontFamily: 'var(--font-mono)', fontSize: '0.85rem', letterSpacing: '1px' }}>
                GUARANTEED ANOMALY RETURN:
              </span>
              <div style={{ fontSize: '2.5rem', color: '#39FF14', fontFamily: 'var(--font-serif)', fontWeight: 'bold' }}>100%</div>
            </div>

            <div>
              <span style={{ color: '#9BA8A8', fontFamily: 'var(--font-mono)', fontSize: '0.85rem', letterSpacing: '1px' }}>
                CONTAMINATION SEVERITY:
              </span>
              <div style={{ fontSize: '2.5rem', color: '#ffb700', fontFamily: 'var(--font-serif)', fontWeight: 'bold' }}>20% - 30%</div>
            </div>

            <div>
              <span style={{ color: '#9BA8A8', fontFamily: 'var(--font-mono)', fontSize: '0.85rem', letterSpacing: '1px' }}>
                EXCLUSION RADIUS
              </span>
              <div style={{ fontSize: '2rem', color: '#D9E0E0', fontFamily: 'var(--font-serif)' }}>FROM 30 KM</div>
            </div>
            
            <div style={{ width: '100%', marginTop: '1rem' }}>
              <span style={{ fontFamily: 'var(--font-serif)', color: '#39FF14', fontSize: '1.1rem', letterSpacing: '2px', display: 'block', marginBottom: '0.8rem' }}>
                ADDITIONAL DIRECTIVES
              </span>
              <div style={{ borderTop: '1px solid rgba(155, 168, 168, 0.2)', padding: '0.8rem 0', color: 'rgba(217, 224, 224, 0.85)', fontSize: '0.9rem', lineHeight: '1.6' }}>
                30 DAYS OF MANDATORY QUARANTINE POST-EXTRACTION
              </div>
              <div style={{ borderTop: '1px solid rgba(155, 168, 168, 0.2)', padding: '0.8rem 0', color: 'rgba(217, 224, 224, 0.85)', fontSize: '0.9rem', lineHeight: '1.6' }}>
                THE COMPLEX OPERATES YEAR-ROUND, ENSURING STABLE DECAY
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
};

export default HistorySection;
