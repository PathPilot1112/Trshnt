import { useRef, useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

// Components
import Navigation from './components/Navigation';
import HomeSection from './components/HomeSection';
import HistorySection from './components/HistorySection';
import RulebooksSection from './components/RulebooksSection';
import StorySection from './components/StorySection';
import ImageSection from './components/ImageSection';
import RegistrationBanner from './components/RegistrationBanner';
import Footer from './components/Footer';
import RegistrationPage from './components/RegistrationPage';

gsap.registerPlugin(ScrollTrigger);

// Helper component to scroll to top on route change
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
    ScrollTrigger.refresh();
  }, [pathname]);
  return null;
}

function ConditionalNavigation() {
  const location = useLocation();
  if (
    location.pathname.startsWith('/admin') ||
    location.pathname.startsWith('/register') ||
    location.pathname.startsWith('/registration-success')
  ) {
    return null;
  }
  return <Navigation />;
}

/**
 * FogController — shows the fog overlay ONLY when the home section (#home)
 * or the registration banner (#registration-banner) is visible in the viewport.
 * Uses IntersectionObserver so there is zero scroll-listener cost.
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

function App() {
  const appRef = useRef();

  useGSAP(() => {
    // We can add global scroll triggers here if needed
  }, { scope: appRef });

  return (
    <Router>
      <ScrollToTop />
      <div className="app-container" ref={appRef}>
        <div className="noise-overlay"></div>

        {/* Fog — controlled by IntersectionObserver, visible only on #home and #registration-banner */}
        <FogController />

        {/* Global Vignette Overlay (Flashlight effect) */}
        <div style={{
          position: 'fixed', top: 0, left: 0,
          width: '100vw', height: '100vh',
          background: 'radial-gradient(circle at center, transparent 15%, rgba(0,0,0,0.9) 90%)',
          pointerEvents: 'none', zIndex: 90
        }}></div>

        <ConditionalNavigation />

        <Routes>
          <Route path="/" element={
            <main>
              <HomeSection />
              <StorySection />
              <ImageSection />
              <HistorySection />
              <RulebooksSection />
              <RegistrationBanner />
              <Footer />
            </main>
          } />

          <Route path="/register" element={
            <main>
              <RegistrationPage />
              <Footer />
            </main>
          } />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
