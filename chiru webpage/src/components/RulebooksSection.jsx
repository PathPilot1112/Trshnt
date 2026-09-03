import React, { useRef, useEffect } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

const rules = [
  { id: '01', title: 'RADIATION PROXIMITY', text: 'If your dosimeter reads above 3.6 Roentgen, you are off path. Turn back immediately.' },
  { id: '02', title: 'TEAM COHESION', text: 'Do not split the party. The zone plays tricks on isolated individuals.' },
  { id: '03', title: 'ARTIFACT HANDLING', text: 'Use lead-lined gloves when handling any discovered clues. Contamination is disqualification.' },
  { id: '04', title: 'TIME LIMIT', text: 'You have exactly 90 minutes before the anomaly expands. Evacuate before the siren.' }
];

const SoldierCanvas = ({ scrollProgress }) => {
  const canvasRef = useRef();

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    let animationFrameId;
    let imgDataObj = null;

    const img = new Image();
    img.src = window.innerWidth < 768 ? '/phone v2.png' : '/matrix_pilot.png';
    img.onload = () => {
      const offscreenCanvas = document.createElement('canvas');
      // Keep full original resolution for sampling
      offscreenCanvas.width = img.width;
      offscreenCanvas.height = img.height;
      const oCtx = offscreenCanvas.getContext('2d');
      oCtx.drawImage(img, 0, 0);
      imgDataObj = oCtx.getImageData(0, 0, img.width, img.height);
    };

    const resize = () => {
      const parent = canvas.parentElement;
      canvas.width = parent.clientWidth || window.innerWidth;
      canvas.height = parent.clientHeight || window.innerHeight;
    };
    window.addEventListener('resize', resize);
    setTimeout(resize, 100);
    resize();

    let isVisible = true;
    const observer = new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting;
    });
    observer.observe(canvas);

    const noiseMap = Array.from({ length: 300 }, () =>
      Array.from({ length: 300 }, () => Math.random())
    );

    let time = 0;
    const render = () => {
      time += 0.05;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (!imgDataObj || !isVisible) {
        animationFrameId = requestAnimationFrame(render);
        return;
      }

      ctx.fillStyle = '#9BA8A8';

      const isMobile = canvas.width < 768;
      const spacing = isMobile ? 4 : 5;
      const cols = Math.floor(canvas.width / spacing) + 5; // Draw extra columns past the edge
      const rowHeight = isMobile ? 5 : 7;
      const rows = Math.floor(canvas.height / rowHeight) + 1;

      const p = scrollProgress.current;

      // For Soldier Canvas, use Math.min on mobile to ensure the entire image is fully visible
      const scale = isMobile 
        ? Math.min(canvas.width / imgDataObj.width, canvas.height / imgDataObj.height) * 0.95
        : Math.max(canvas.width / imgDataObj.width, canvas.height / imgDataObj.height);
      const scaledImgWidth = imgDataObj.width * scale;
      const scaledImgHeight = imgDataObj.height * scale;
      const offsetX = (canvas.width - scaledImgWidth) / 2;
      const offsetY = (canvas.height - scaledImgHeight) / 2;

      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const x = i * spacing;
          const y = j * rowHeight;

          // Parallax effect: disable on mobile to avoid vertical clipping
          const parallaxShift = isMobile ? 0 : (p - 0.5) * 150;
          const adjustedY = y - parallaxShift;

          // Map canvas coordinate to image pixel coordinate
          const imgX = Math.floor((x - offsetX) / scale);
          const imgY = Math.floor((adjustedY - offsetY) / scale);

          let brightness = 0.05; // Base faint brightness for the entire canvas to fill empty edges

          // Check if we are sampling inside the image bounds
          if (imgX >= 0 && imgX < imgDataObj.width && imgY >= 0 && imgY < imgDataObj.height) {
            const pixelIndex = (imgY * imgDataObj.width + imgX) * 4;
            const r = imgDataObj.data[pixelIndex];
            const g = imgDataObj.data[pixelIndex + 1];
            const b = imgDataObj.data[pixelIndex + 2];

            // Brightness threshold logic
            brightness = Math.max(brightness, (r + g + b) / (255 * 3));
          }

          // Always draw, as base brightness ensures it renders faint lines
          if (brightness > 0.02) {
            const dynamicBrightness = brightness * (0.8 + 0.35 * Math.sin(time + i * 0.15 + j * 0.1));
            const noise = noiseMap[i % 300][j % 300];
            const finalVal = dynamicBrightness * 0.8 + noise * 0.3;

            if (finalVal > 0.15) {
              const thickness = Math.max(1, (finalVal - 0.15) * 4.5);
              const length = Math.min(rowHeight, finalVal * rowHeight * 1.2);

              ctx.globalAlpha = Math.min(1, finalVal + 0.1);
              ctx.fillRect(
                x + (spacing - thickness) / 2,
                y + (rowHeight - length) / 2,
                thickness,
                length
              );
            }
          }
        }
      }
      ctx.globalAlpha = 1.0;
      animationFrameId = requestAnimationFrame(render);
    };
    render();

    return () => {
      window.removeEventListener('resize', resize);
      observer.disconnect();
      cancelAnimationFrame(animationFrameId);
    };
  }, [scrollProgress]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: '600px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
      <div style={{
        position: 'absolute',
        bottom: '2rem',
        color: 'var(--color-accent)',
        fontFamily: 'var(--font-sans)',
        fontSize: '2rem',
        letterSpacing: '8px',
        fontWeight: '300',
        textShadow: '0 0 20px rgba(155, 168, 168, 0.5)'
      }}>
        GET READY
      </div>
    </div>
  );
};

const MascotCanvas = ({ scrollProgress }) => {
  const canvasRef = useRef();

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    let animationFrameId;
    let imgDataObj = null;

    const img = new Image();
    img.src = '/soldier_mascot.png';
    img.onload = () => {
      const offscreenCanvas = document.createElement('canvas');
      offscreenCanvas.width = img.width;
      offscreenCanvas.height = img.height;
      const oCtx = offscreenCanvas.getContext('2d');
      oCtx.drawImage(img, 0, 0);
      imgDataObj = oCtx.getImageData(0, 0, img.width, img.height);
    };

    const resize = () => {
      const parent = canvas.parentElement;
      canvas.width = parent.clientWidth || 500;
      canvas.height = parent.clientHeight || 600;
    };
    window.addEventListener('resize', resize);
    setTimeout(resize, 100);
    resize();

    let isVisible = true;
    const observer = new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting;
    });
    observer.observe(canvas);

    const noiseMap = Array.from({ length: 300 }, () =>
      Array.from({ length: 300 }, () => Math.random())
    );

    let time = 0;
    const render = () => {
      time += 0.05;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (!imgDataObj || !isVisible) {
        animationFrameId = requestAnimationFrame(render);
        return;
      }

      ctx.fillStyle = '#9BA8A8';

      const isMobile = canvas.width < 768;
      const spacing = isMobile ? 4 : 5;
      const cols = Math.floor(canvas.width / spacing) + 5;
      const rowHeight = isMobile ? 5 : 7;
      const rows = Math.floor(canvas.height / rowHeight) + 1;

      const p = scrollProgress.current;

      const scale = isMobile 
        ? Math.min(canvas.width / imgDataObj.width, canvas.height / imgDataObj.height) * 0.95
        : Math.min(canvas.width / imgDataObj.width, canvas.height / imgDataObj.height) * 0.95;
      const scaledImgWidth = imgDataObj.width * scale;
      const scaledImgHeight = imgDataObj.height * scale;
      const offsetX = (canvas.width - scaledImgWidth) / 2;
      const offsetY = (canvas.height - scaledImgHeight) / 2;

      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const x = i * spacing;
          const y = j * rowHeight;

          const parallaxShift = (p - 0.5) * 150;
          const adjustedY = y - parallaxShift;

          const imgX = Math.floor((x - offsetX) / scale);
          const imgY = Math.floor((adjustedY - offsetY) / scale);

          let brightness = 0.1; // Increased base brightness so the grid is visible

          if (imgX >= 0 && imgX < imgDataObj.width && imgY >= 0 && imgY < imgDataObj.height) {
            const pixelIndex = (imgY * imgDataObj.width + imgX) * 4;
            const r = imgDataObj.data[pixelIndex];
            const g = imgDataObj.data[pixelIndex + 1];
            const b = imgDataObj.data[pixelIndex + 2];

            // Boost image brightness significantly so dark 3D render is visible
            brightness = Math.max(brightness, ((r + g + b) / (255 * 3)) * 2.0);
          }

          if (brightness > 0.05) {
            const dynamicBrightness = brightness * (0.8 + 0.35 * Math.sin(time + i * 0.15 + j * 0.1));
            const noise = noiseMap[i % 300][j % 300];
            const finalVal = dynamicBrightness * 1.2 + noise * 0.3;

            if (finalVal > 0.1) {
              const thickness = Math.max(1, (finalVal - 0.1) * 4.5);
              const length = Math.min(rowHeight, finalVal * rowHeight * 1.5);

              ctx.globalAlpha = Math.min(1, finalVal + 0.2);
              ctx.fillRect(
                x + (spacing - thickness) / 2,
                y + (rowHeight - length) / 2,
                thickness,
                length
              );
            }
          }
        }
      }
      ctx.globalAlpha = 1.0;
      animationFrameId = requestAnimationFrame(render);
    };
    render();

    return () => {
      window.removeEventListener('resize', resize);
      observer.disconnect();
      cancelAnimationFrame(animationFrameId);
    };
  }, [scrollProgress]);

  return (
    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
    </div>
  );
};

const RulebooksSection = () => {
  const container = useRef();
  const progressRef = useRef(0);

  useGSAP(() => {
    gsap.to(progressRef, {
      current: 1,
      scrollTrigger: {
        trigger: container.current,
        start: "top bottom",
        end: "bottom top",
        scrub: true,
        onUpdate: (self) => {
          progressRef.current = self.progress;
        }
      }
    });
  }, { scope: container });

  return (
    <div ref={container} style={{ width: '100%', position: 'relative' }}>
      <section id="rulebooks" style={{
        padding: '0',
        backgroundColor: 'transparent',
        display: 'flex',
        flexDirection: 'column',
        gap: '0',
        width: '100%',
        margin: '0 auto',
      }}>

      {/* Top Part: Directives Text (Left) + Mascot (Right) */}
      <div className="rulebooks-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', width: '100%', minHeight: '100vh' }}>
        {/* Left Column: Rules */}
        <div className="rulebooks-left" style={{ display: 'flex', flexDirection: 'column', gap: '2rem', padding: '8rem 5%' }}>
          <h2 className="rulebooks-title" style={{ marginBottom: '2rem', fontSize: '4rem', color: 'var(--color-accent)', fontFamily: 'var(--font-serif)' }}>DIRECTIVES</h2>

          {rules.map((rule) => (
            <div key={rule.id} className="rule-card" style={{
              padding: '2.5rem',
              border: '1px solid rgba(155, 168, 168, 0.3)',
              background: 'rgba(0, 39, 41, 0.8)',
              position: 'relative',
              overflow: 'hidden',
              cursor: 'crosshair',
              transition: 'border-color 0.3s ease'
            }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--color-accent)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(155, 168, 168, 0.3)';
              }}
            >
              <div style={{ position: 'absolute', top: '15px', right: '15px', color: 'rgba(217, 224, 224, 0.15)', fontFamily: 'var(--font-serif)', fontSize: '4rem', fontWeight: 'bold' }}>
                {rule.id}
              </div>
              <h3 style={{ color: 'var(--color-text)', marginBottom: '1rem', fontSize: '1.4rem', fontFamily: 'var(--font-serif)' }}>{rule.title}</h3>
              <div className="premium-divider" style={{ margin: '1rem 0' }}></div>
              <p style={{ color: 'rgba(217, 224, 224, 0.8)', fontSize: '1rem', fontFamily: 'var(--font-sans)', fontWeight: 300, lineHeight: 1.6 }}>{rule.text}</p>
            </div>
          ))}
        </div>

        {/* Right Column: Mascot Canvas */}
        <div className="rulebooks-right" style={{ position: 'relative', height: '100%', minHeight: '100vh', padding: '0' }}>
          <div className="mascot-sticky-container" style={{
            position: 'sticky',
            top: '0',
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden'
          }}>
            <MascotCanvas scrollProgress={progressRef} />
          </div>
        </div>
      </div>

      </section>

      {/* Bottom Part: The Old Pilot Animation */}
      <section style={{ 
        position: 'relative', 
        width: '100%', 
        height: '100vh', 
        overflow: 'hidden',
        padding: '0',
        backgroundColor: 'transparent'
      }}>
        <SoldierCanvas scrollProgress={progressRef} />
      </section>

    </div>
  );
};

export default RulebooksSection;
