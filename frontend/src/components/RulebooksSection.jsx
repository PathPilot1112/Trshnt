import React from 'react';
import { AlertTriangle, Users, ShieldAlert, Timer } from 'lucide-react';

const rules = [
  {
    id: '01',
    title: 'RADIATION PROXIMITY',
    text: 'If your dosimeter reads above 3.6 Roentgen, you are off path. Turn back immediately.',
    icon: <AlertTriangle size={24} style={{ color: '#ffb700' }} />
  },
  {
    id: '02',
    title: 'TEAM COHESION',
    text: 'Do not split the party. The zone plays tricks on isolated operatives.',
    icon: <Users size={24} style={{ color: '#39FF14' }} />
  },
  {
    id: '03',
    title: 'ARTIFACT HANDLING',
    text: 'Use lead-lined gloves when handling any discovered clues. Contamination is disqualification.',
    icon: <ShieldAlert size={24} style={{ color: '#ff3333' }} />
  },
  {
    id: '04',
    title: 'TIME LIMIT',
    text: 'You have exactly 90 minutes before the anomaly expands. Evacuate before the siren.',
    icon: <Timer size={24} style={{ color: '#39FF14' }} />
  }
];

const RulebooksSection = () => {
  return (
    <section id="rulebooks" style={{
      padding: '5rem 1.5rem',
      backgroundColor: 'transparent',
      width: '100%',
      maxWidth: '1200px',
      margin: '0 auto'
    }}>
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <div style={{ fontSize: '0.85rem', color: '#39FF14', fontFamily: 'var(--font-mono)', letterSpacing: '3px', marginBottom: '0.5rem' }}>
          // OPERATIONAL_DIRECTIVES
        </div>
        <h2 style={{ fontSize: 'clamp(2.4rem, 6vw, 3.6rem)', color: '#D9E0E0', fontFamily: 'var(--font-serif)', letterSpacing: '4px', margin: 0 }}>
          EXCLUSION ZONE DIRECTIVES
        </h2>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '1.8rem'
      }}>
        {rules.map((rule) => (
          <div
            key={rule.id}
            style={{
              padding: '2rem',
              border: '1px solid rgba(155, 168, 168, 0.25)',
              background: 'rgba(8, 20, 22, 0.85)',
              borderRadius: '4px',
              position: 'relative',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.6)',
              transition: 'transform 0.2s ease, border-color 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#39FF14';
              e.currentTarget.style.transform = 'translateY(-4px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(155, 168, 168, 0.25)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <div style={{
              position: 'absolute',
              top: '15px',
              right: '15px',
              color: 'rgba(217, 224, 224, 0.12)',
              fontFamily: 'var(--font-serif)',
              fontSize: '3rem',
              fontWeight: 'bold',
              lineHeight: 1
            }}>
              {rule.id}
            </div>

            <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
              {rule.icon}
              <h3 style={{ color: '#D9E0E0', margin: 0, fontSize: '1.2rem', fontFamily: 'var(--font-serif)', letterSpacing: '1px' }}>
                {rule.title}
              </h3>
            </div>

            <div style={{ height: '1px', background: 'rgba(155, 168, 168, 0.2)', margin: '1rem 0' }} />

            <p style={{ color: 'rgba(217, 224, 224, 0.8)', fontSize: '0.95rem', fontFamily: 'var(--font-sans)', lineHeight: 1.6, margin: 0 }}>
              {rule.text}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default RulebooksSection;
