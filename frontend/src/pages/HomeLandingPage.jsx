import React, { useState, useEffect } from 'react';
import Navigation from '../components/Navigation';
import HomeSection from '../components/HomeSection';
import StorySection from '../components/StorySection';
import ImageSection from '../components/ImageSection';
import HistorySection from '../components/HistorySection';
import RulebooksSection from '../components/RulebooksSection';
import RegistrationBanner from '../components/RegistrationBanner';
import Footer from '../components/Footer';
import CustomCursor from '../components/CustomCursor';

/**
 * FogController — shows the fog overlay when home or registration banner is visible
 */
function FogController() {
  const [fogVisible, setFogVisible] = useState(false);

  useEffect(() => {
    const targets = ['home', 'registration-banner'].map(id =>
      document.getElementById(id)
    ).filter(Boolean);

    if (targets.length === 0) return;

    let visibleCount = 0;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          visibleCount += entry.isIntersecting ? 1 : -1;
        });
        setFogVisible(visibleCount > 0);
      },
      { threshold: 0.1 }
    );

    targets.forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div
      className="fog-container"
      style={{
        transition: 'opacity 0.8s ease',
        opacity: fogVisible ? 1 : 0,
        pointerEvents: 'none',
      }}
    >
      <div className="fog-layer layer-1"></div>
      <div className="fog-layer layer-2"></div>
      <div className="fog-layer layer-3"></div>
    </div>
  );
}

const HomeLandingPage = ({ onNavigate }) => {
  return (
    <div className="app-container" style={{
      position: 'relative',
      width: '100%',
      minHeight: '100vh',
      minHeight: '100dvh',
      background: 'var(--color-bg, #002729)',
      color: '#D9E0E0',
      overflowX: 'hidden'
    }}>
      <CustomCursor />
      <FogController />
      <div className="noise-overlay"></div>

      {/* Sleek Radial Vignette Overlay */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: 'radial-gradient(circle at center, transparent 35%, rgba(0,0,0,0.85) 95%)',
        pointerEvents: 'none',
        zIndex: 5
      }}></div>

      <Navigation onNavigate={onNavigate} />

      <main style={{ position: 'relative', zIndex: 10 }}>
        <HomeSection />
        <StorySection />
        <ImageSection />
        <HistorySection />
        <RulebooksSection />
        <RegistrationBanner onOpenRegister={() => {
          if (onNavigate) onNavigate('register');
          else window.location.hash = '#register';
        }} />
        <Footer />
      </main>
    </div>
  );
};

export default HomeLandingPage;
