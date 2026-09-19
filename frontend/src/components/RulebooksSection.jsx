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
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    let animationFrameId;
    let imgDataObj = null;

    const isMobile = window.innerWidth < 768;
    const sources = isMobile
      ? ['/phone_v2.webp', '/phone_v2.png', '/phone v2.png', '/matrix_pilot.webp', '/matrix_pilot.png']
      : ['/matrix_pilot.webp', '/matrix_pilot.png', '/phone_v2.webp'];

    let sourceIndex = 0;
    const img = new Image();

    const tryNextSource = () => {
      if (sourceIndex < sources.length) {
        img.src = sources[sourceIndex];
        sourceIndex++;
      }
    };

    img.onload = () => {
      try {
        const offscreenCanvas = document.createElement('canvas');
        offscreenCanvas.width = img.width;
        offscreenCanvas.height = img.height;
        const oCtx = offscreenCanvas.getContext('2d');
        oCtx.drawImage(img, 0, 0);
        imgDataObj = oCtx.getImageData(0, 0, img.width, img.height);
      } catch (err) {
        console.warn('Canvas sample error:', err);
        tryNextSource();
      }
    };

    img.onerror = () => {
      console.warn(`Failed loading image: ${img.src}, trying fallback...`);
      tryNextSource();
    };

    tryNextSource();

    const resize = () => {
      if (!canvas || !canvas.parentElement) return;
      const parent = canvas.parentElement;
      canvas.width = parent.clientWidth || window.innerWidth || 360;
      canvas.height = parent.clientHeight || window.innerHeight || 500;
    };
    window.addEventListener('resize', resize);
    setTimeout(resize, 50);
    setTimeout(resize, 200);
    resize();

    let isVisible = true;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry) {
        isVisible = entry.isIntersecting;
      }
    }, { threshold: 0.01 });
    observer.observe(canvas);

    const noiseMap = Array.from({ length: 300 }, () =>
      Array.from({ length: 300 }, () => Math.random())
    );

    let time = 0;
    const render = () => {
      time += 0.05;

      if (!isVisible) {
        animationFrameId = requestAnimationFrame(render);
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (!imgDataObj) {
        animationFrameId = requestAnimationFrame(render);
        return;
      }

      ctx.fillStyle = '#9BA8A8';

      const isMobile = canvas.width < 768;
      const spacing = isMobile ? 5 : 6;
      const cols = Math.floor(canvas.width / spacing) + 2;
      const rowHeight = isMobile ? 7 : 8;
      const rows = Math.floor(canvas.height / rowHeight) + 2;

      const p = scrollProgress.current || 0;
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

          const parallaxShift = (p - 0.5) * 120;
          const adjustedY = y - parallaxShift;

          const imgX = Math.floor((x - offsetX) / scale);
          const imgY = Math.floor((adjustedY - offsetY) / scale);

          let brightness = 0.1;

          if (imgX >= 0 && imgX < imgDataObj.width && imgY >= 0 && imgY < imgDataObj.height) {
            const pixelIndex = (imgY * imgDataObj.width + imgX) * 4;
            const r = imgDataObj.data[pixelIndex];
            const g = imgDataObj.data[pixelIndex + 1];
            const b = imgDataObj.data[pixelIndex + 2];

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

const MascotCanvas = ({ scrollProgress }) => {
  const canvasRef = useRef();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    let animationFrameId;
    let imgDataObj = null;

    const sources = ['/soldier_mascot.webp', '/soldier_mascot.png'];
    let sourceIndex = 0;
    const img = new Image();

    const tryNextSource = () => {
      if (sourceIndex < sources.length) {
        img.src = sources[sourceIndex];
        sourceIndex++;
      }
    };

    img.onload = () => {
      try {
        const offscreenCanvas = document.createElement('canvas');
        offscreenCanvas.width = img.width;
        offscreenCanvas.height = img.height;
        const oCtx = offscreenCanvas.getContext('2d');
        oCtx.drawImage(img, 0, 0);
        imgDataObj = oCtx.getImageData(0, 0, img.width, img.height);
      } catch (err) {
        tryNextSource();
      }
    };

    img.onerror = () => tryNextSource();
    tryNextSource();

    const resize = () => {
      if (!canvas || !canvas.parentElement) return;
      canvas.width = canvas.parentElement.clientWidth || 300;
      canvas.height = canvas.parentElement.clientHeight || 400;
    };
    window.addEventListener('resize', resize);
    setTimeout(resize, 100);
    resize();

    let isVisible = true;
    const observer = new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting;
    });
    observer.observe(canvas);

    let time = 0;
    const render = () => {
      time += 0.05;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (!imgDataObj || !isVisible) {
        animationFrameId = requestAnimationFrame(render);
        return;
      }

      ctx.fillStyle = '#39FF14';
      const spacing = 5;
      const cols = Math.floor(canvas.width / spacing);
      const rowHeight = 7;
      const rows = Math.floor(canvas.height / rowHeight);

      const scale = Math.min(canvas.width / imgDataObj.width, canvas.height / imgDataObj.height) * 0.9;
      const scaledW = imgDataObj.width * scale;
      const scaledH = imgDataObj.height * scale;
      const ox = (canvas.width - scaledW) / 2;
      const oy = (canvas.height - scaledH) / 2;

      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const x = i * spacing;
          const y = j * rowHeight;
          const imgX = Math.floor((x - ox) / scale);
          const imgY = Math.floor((y - oy) / scale);

          if (imgX >= 0 && imgX < imgDataObj.width && imgY >= 0 && imgY < imgDataObj.height) {
            const idx = (imgY * imgDataObj.width + imgX) * 4;
            const a = imgDataObj.data[idx + 3];
            if (a > 50) {
              ctx.globalAlpha = (a / 255) * (0.6 + 0.3 * Math.sin(time + i * 0.2));
              ctx.fillRect(x, y, spacing - 1, rowHeight - 1);
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

  return <canvas ref={canvasRef} style={{ width: '100%', height: '100%', maxHeight: '450px' }} />;
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
    <div ref={container} style={{ width: '100%', position: 'relative', overflow: 'hidden' }}>
      <style>{`
        .rulebooks-grid {
          display: grid;
          grid-template-columns: 1.2fr 0.8fr;
          width: 100%;
          min-height: 100vh;
          box-sizing: border-box;
        }

        .rulebooks-left {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          padding: clamp(3rem, 6vw, 6rem) clamp(1rem, 4vw, 3rem);
          box-sizing: border-box;
        }

        @media (max-width: 860px) {
          .rulebooks-grid {
            grid-template-columns: 1fr !important;
            min-height: auto !important;
            width: 100% !important;
            max-width: 100% !important;
          }

          .rulebooks-left {
            padding: 2.2rem 1rem !important;
            width: 100% !important;
            max-width: 100% !important;
            box-sizing: border-box !important;
          }

          .rulebooks-right {
            display: none !important;
          }
        }
      `}</style>

      <section id="rulebooks" style={{
        padding: '0',
        backgroundColor: 'transparent',
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        maxWidth: '100%',
        margin: '0 auto',
        boxSizing: 'border-box'
      }}>

        {/* Top Part: Directives Text (Left) + Mascot (Right) */}
        <div className="rulebooks-grid">
          {/* Left Column: Rules */}
          <div className="rulebooks-left">
            <h2 style={{ 
              marginBottom: '1rem', 
              fontSize: 'clamp(1.7rem, 6vw, 3.5rem)', 
              color: 'var(--color-accent)', 
              fontFamily: 'var(--font-serif)',
              lineHeight: 1.15,
              letterSpacing: 'clamp(1px, 0.5vw, 2px)',
              wordBreak: 'break-word',
              overflowWrap: 'break-word'
            }}>
              DIRECTIVES
            </h2>

            {rules.map((rule) => (
              <div key={rule.id} style={{
                padding: 'clamp(1rem, 3vw, 1.8rem)',
                border: '1px solid rgba(155, 168, 168, 0.3)',
                background: 'rgba(0, 39, 41, 0.88)',
                position: 'relative',
                overflow: 'hidden',
                borderRadius: '4px',
                width: '100%',
                boxSizing: 'border-box'
              }}>
                <div style={{ 
                  position: 'absolute', 
                  top: '8px', 
                  right: '12px', 
                  color: 'rgba(217, 224, 224, 0.1)', 
                  fontFamily: 'var(--font-serif)', 
                  fontSize: 'clamp(2.2rem, 5.5vw, 3.5rem)', 
                  fontWeight: 'bold',
                  lineHeight: 1,
                  pointerEvents: 'none'
                }}>
                  {rule.id}
                </div>
                <h3 style={{ color: '#39FF14', marginBottom: '0.5rem', fontSize: 'clamp(1rem, 2.8vw, 1.3rem)', fontFamily: 'var(--font-serif)', paddingRight: '2rem' }}>
                  {rule.title}
                </h3>
                <div style={{ height: '1px', background: 'rgba(57, 255, 20, 0.3)', margin: '0.5rem 0' }}></div>
                <p style={{ color: 'rgba(217, 224, 224, 0.88)', fontSize: 'clamp(0.82rem, 2.2vw, 0.95rem)', fontFamily: 'var(--font-sans)', fontWeight: 300, lineHeight: 1.55, margin: 0 }}>
                  {rule.text}
                </p>
              </div>
            ))}
          </div>

          {/* Right Column: Mascot Canvas */}
          <div className="rulebooks-right" style={{ position: 'relative', height: '100%', minHeight: '100vh', padding: '0' }}>
            <div style={{
              position: 'sticky',
              top: '80px',
              width: '100%',
              height: '80vh',
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

      {/* Bottom Part: The Matrix Pilot Animation */}
      <section style={{ 
        position: 'relative', 
        width: '100%', 
        height: 'clamp(400px, 80vh, 750px)', 
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
