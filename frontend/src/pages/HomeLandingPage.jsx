import React from 'react';
import Navigation from '../components/Navigation';
import HomeSection from '../components/HomeSection';
import StorySection from '../components/StorySection';
import ImageSection from '../components/ImageSection';
import HistorySection from '../components/HistorySection';
import RulebooksSection from '../components/RulebooksSection';
import RegistrationBanner from '../components/RegistrationBanner';
import Footer from '../components/Footer';

const HomeLandingPage = ({ onNavigate }) => {
  return (
    <div className="app-container" style={{
      position: 'relative',
      width: '100%',
      minHeight: '100vh',
      minHeight: '100dvh',
      background: 'var(--color-bg, #081011)',
      color: '#D9E0E0',
      overflowX: 'hidden'
    }}>
      <div className="noise-overlay"></div>

      {/* Sleek Radial Vignette Overlay */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: 'radial-gradient(circle at center, transparent 30%, rgba(0,0,0,0.85) 95%)',
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
