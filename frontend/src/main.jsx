import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import 'leaflet/dist/leaflet.css'
import './index.css'
import App from './App.jsx'

// Register GSAP ScrollTrigger globally to prevent runtime missing plugin exceptions
gsap.registerPlugin(ScrollTrigger);

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  window.__pwaInstallPrompt = e;
  window.dispatchEvent(new Event('pwa-install-ready'));
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}
