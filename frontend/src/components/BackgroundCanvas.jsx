import React, { useEffect, useRef } from 'react';

const BackgroundCanvas = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });

    let animationFrameId = null;
    let lastScrollY = -1;
    let pendingRender = false;

    // Pre-generate static noise/dither array
    const NOISE_SIZE = 250;
    const noiseMap = new Float32Array(NOISE_SIZE * NOISE_SIZE);
    for (let i = 0; i < noiseMap.length; i++) {
      noiseMap[i] = Math.random();
    }

    const resize = () => {
      // Limit devicePixelRatio to 1.5 to prevent massive 4K canvas buffer on mobile devices
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.floor(window.innerWidth * dpr);
      canvas.height = Math.floor(window.innerHeight * dpr);
      scheduleRender();
    };

    const render = () => {
      pendingRender = false;
      const currentScrollY = window.scrollY || 0;
      lastScrollY = currentScrollY;

      const w = canvas.width;
      const h = canvas.height;
      if (w === 0 || h === 0) return;

      // Fill background in dark tactical teal/black #001c1e
      ctx.fillStyle = '#001c1e';
      ctx.fillRect(0, 0, w, h);

      // Accent color #9BA8A8 with GPU vector drawing
      const spacing = 16;
      const rowHeight = 18;
      const cols = Math.floor(w / spacing) + 1;
      const rows = Math.floor(h / rowHeight) + 1;
      const centerX = cols / 2;
      const scrollOffset = currentScrollY * 0.02;

      ctx.fillStyle = 'rgba(155, 168, 168, 0.45)';

      for (let i = 0; i < cols; i++) {
        const distFromCenter = Math.abs(i - centerX);
        for (let j = 0; j < rows; j++) {
          const sampleJ = j + scrollOffset;
          const mountainSlope = (rows - sampleJ) * 1.2;

          let shapeValue = 0;
          if (distFromCenter < mountainSlope && sampleJ > rows * 0.2) {
            shapeValue = 1 - distFromCenter / mountainSlope;
          }

          const noise = noiseMap[(i % NOISE_SIZE) * NOISE_SIZE + (j % NOISE_SIZE)];
          const finalVal = shapeValue * 0.8 + noise * 0.4;

          if (finalVal > 0.45) {
            const thickness = Math.max(1, Math.floor((finalVal - 0.45) * 4));
            const length = Math.min(rowHeight, Math.floor(finalVal * rowHeight * 0.7));

            const x0 = Math.floor(i * spacing + (spacing - thickness) / 2);
            const y0 = Math.floor(j * rowHeight + (rowHeight - length) / 2);

            ctx.fillRect(x0, y0, thickness, length);
          }
        }
      }
    };

    const scheduleRender = () => {
      if (pendingRender) return;
      pendingRender = true;
      animationFrameId = requestAnimationFrame(render);
    };

    const onScroll = () => {
      if (Math.abs(window.scrollY - lastScrollY) > 5) {
        scheduleRender();
      }
    };

    window.addEventListener('resize', resize, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true });

    resize();

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('scroll', onScroll);
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, []);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      zIndex: 1,
      pointerEvents: 'none'
    }}>
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: '100%', display: 'block' }}
      />
    </div>
  );
};

export default BackgroundCanvas;
