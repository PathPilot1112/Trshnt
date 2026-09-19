import React, { useRef, useState, useEffect } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

const RegistrationBanner = ({ onOpenRegister }) => {
  const bannerRef = useRef();

  // Target event date: calculate countdown
  const [timeLeft, setTimeLeft] = useState({
    days: '00',
    hours: '00',
    minutes: '00',
    seconds: '00'
  });

  useEffect(() => {
    // Set a countdown target 3 days from now or fixed target
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 3);
    targetDate.setHours(10, 0, 0, 0);

    const updateCountdown = () => {
      const now = new Date().getTime();
      const diff = targetDate.getTime() - now;

      if (diff <= 0) {
        setTimeLeft({ days: '00', hours: '00', minutes: '00', seconds: '00' });
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({
        days: String(days).padStart(2, '0'),
        hours: String(hours).padStart(2, '0'),
        minutes: String(minutes).padStart(2, '0'),
        seconds: String(seconds).padStart(2, '0')
      });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

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

  const handleRegisterClick = () => {
    if (onOpenRegister) {
      onOpenRegister();
    } else {
      window.location.hash = '#register';
    }
  };

  return (
    <section id="registration-banner" ref={bannerRef} style={{
      minHeight: 'auto',
      padding: 'clamp(2.5rem, 5vw, 4rem) clamp(1rem, 3vw, 2rem)',
      backgroundColor: 'rgba(0, 39, 41, 0.65)',
      borderTop: '1px solid rgba(155, 168, 168, 0.2)',
      borderBottom: '1px solid rgba(155, 168, 168, 0.2)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      zIndex: 10,
      width: '100%',
      boxSizing: 'border-box'
    }}>
      <style>{`
        @media (max-width: 600px) {
          .banner-countdown {
            gap: 0.5rem !important;
          }
          .banner-countdown-box {
            min-width: 55px !important;
            padding: 0.5rem 0.4rem !important;
          }
          .banner-countdown-num {
            fontSize: 1.4rem !important;
          }
          .banner-action-wrap {
            width: 100% !important;
            align-items: stretch !important;
          }
          .register-cta-btn {
            width: 100% !important;
            justify-content: center !important;
            padding: 1rem !important;
          }
        }
      `}</style>

      <div className="banner-content" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        maxWidth: '1200px',
        width: '100%',
        gap: '2rem',
        flexWrap: 'wrap'
      }}>
        {/* Text & Countdown */}
        <div style={{ flex: '1 1 280px', minWidth: 0 }}>
          <h2 style={{
            fontSize: 'clamp(1.6rem, 4vw, 2.5rem)',
            color: 'var(--color-text)',
            marginBottom: '0.8rem',
            textShadow: '0 0 10px rgba(217, 224, 224, 0.3)',
            lineHeight: 1.2
          }}>
            THE COUNTDOWN HAS BEGUN
          </h2>
          <p style={{
            fontSize: 'clamp(0.85rem, 2.5vw, 1.05rem)',
            color: 'var(--color-accent)',
            marginBottom: '1.5rem',
            fontFamily: 'var(--font-mono)',
            lineHeight: 1.5
          }}>
            Clearance permits are strictly limited per sector. Assemble your Research Unit before quarantine lockdown.
          </p>

          {/* Countdown Clock */}
          <div className="banner-countdown" style={{
            display: 'flex',
            gap: '0.8rem',
            fontFamily: 'var(--font-mono)',
            flexWrap: 'wrap'
          }}>
            {[
              { label: 'DAYS', val: timeLeft.days },
              { label: 'HRS', val: timeLeft.hours },
              { label: 'MIN', val: timeLeft.minutes },
              { label: 'SEC', val: timeLeft.seconds }
            ].map((item, idx) => (
              <div key={idx} className="banner-countdown-box" style={{
                background: 'rgba(0, 20, 22, 0.8)',
                border: '1px solid rgba(57, 255, 20, 0.3)',
                padding: '0.7rem 0.9rem',
                textAlign: 'center',
                minWidth: '65px',
                borderRadius: '2px'
              }}>
                <div className="banner-countdown-num" style={{ fontSize: '1.6rem', color: '#39FF14', fontWeight: 'bold', lineHeight: 1.1 }}>{item.val}</div>
                <div style={{ fontSize: '0.65rem', color: 'var(--color-accent)', letterSpacing: '1px', marginTop: '2px' }}>{item.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Button */}
        <div className="banner-action-wrap" style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', alignItems: 'flex-start', flex: '1 1 280px', minWidth: 0 }}>
          <button 
            onClick={handleRegisterClick}
            className="register-cta-btn"
            style={{
              padding: '1.1rem 2rem',
              backgroundColor: '#39FF14',
              color: '#002729',
              fontSize: 'clamp(0.9rem, 2.5vw, 1.15rem)',
              fontWeight: 'bold',
              fontFamily: 'var(--font-mono)',
              border: 'none',
              cursor: 'pointer',
              letterSpacing: '1.5px',
              textTransform: 'uppercase',
              boxShadow: '0 0 20px rgba(57, 255, 20, 0.4)',
              transition: 'all 0.3s ease',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              borderRadius: '2px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#fff';
              e.currentTarget.style.boxShadow = '0 0 30px rgba(255, 255, 255, 0.7)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#39FF14';
              e.currentTarget.style.boxShadow = '0 0 20px rgba(57, 255, 20, 0.4)';
            }}
          >
            ENLIST UNIT // REGISTER NOW ➔
          </button>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--color-accent)' }}>
            CLEARANCE PROTOCOL: OMEGA-4 REQUIRED
          </span>
        </div>
      </div>
    </section>
  );
};

export default RegistrationBanner;
