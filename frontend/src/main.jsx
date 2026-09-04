import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import 'leaflet/dist/leaflet.css'
import './index.css'
import App from './App.jsx'

// Register GSAP ScrollTrigger globally to prevent runtime missing plugin exceptions
gsap.registerPlugin(ScrollTrigger);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => console.log('Chernobyl-trshnt SW registered:', reg.scope))
      .catch(err => console.error('Chernobyl-trshnt SW registration failed:', err));
  });
}
