import React, { useEffect, useRef } from 'react';

const BackgroundCanvas = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    let animationFrameId = null;
    let lastScrollY = -1;
    let pendingRender = false;

    // Pre-generate static noise map once — reused every render
    const NOISE_SIZE = 500;
    const noiseMap = new Float32Array(NOISE_SIZE * NOISE_SIZE);
    for (let i = 0; i < noiseMap.length; i++) {
      noiseMap[i] = Math.random();
    }

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      scheduleRender();
    };

    // Use ImageData to batch all pixel writes into a single GPU upload
    // instead of calling fillRect thousands of times per frame.
    const render = () => {
      pendingRender = false;
      const currentScrollY = window.scrollY || 0;
      lastScrollY = currentScrollY;

      const w = canvas.width;
      const h = canvas.height;
      if (w === 0 || h === 0) return;

      const imageData = ctx.createImageData(w, h);
      const data = imageData.data;

      // Background colour: #002729 → rgb(0, 39, 41)
      for (let i = 0; i < data.length; i += 4) {
        data[i]     = 0;   // R
        data[i + 1] = 39;  // G
        data[i + 2] = 41;  // B
        data[i + 3] = 255; // A
      }

      // Accent colour: #9BA8A8 → rgb(155, 168, 168)
      const accentR = 155, accentG = 168, accentB = 168;

      const spacing   = 12;
      const rowHeight = 15;
      const cols      = Math.floor(w / spacing) + 1;
      const rows      = Math.floor(h / rowHeight) + 1;
      const centerX   = cols / 2;
      const scrollOffset = currentScrollY * 0.03;

      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const sampleJ        = j + scrollOffset;
          const distFromCenter = Math.abs(i - centerX);
          let shapeValue       = 0;
          const mountainSlope  = (rows - sampleJ) * 1.2;

          if (distFromCenter < mountainSlope && sampleJ > rows * 0.2) {
            shapeValue = 1 - distFromCenter / mountainSlope;
          }

          const noise    = noiseMap[(i % NOISE_SIZE) * NOISE_SIZE + (j % NOISE_SIZE)];
          const finalVal = shapeValue * 0.8 + noise * 0.4;

          if (finalVal > 0.4) {
            const thickness = Math.max(1, (finalVal - 0.4) * 5);
            const length    = Math.min(rowHeight, finalVal * rowHeight * 0.8);
            const alpha     = Math.min(0.8, finalVal * (sampleJ / rows + 0.2));
            const alphaInt  = Math.round(alpha * 255);

            const x0 = Math.round(i * spacing + (spacing - thickness) / 2);
            const y0 = Math.round(j * rowHeight + (rowHeight - length) / 2);
            const x1 = Math.min(w, x0 + Math.ceil(thickness));
            const y1 = Math.min(h, y0 + Math.ceil(length));

            for (let py = Math.max(0, y0); py < y1; py++) {
              for (let px = Math.max(0, x0); px < x1; px++) {
                const idx = (py * w + px) * 4;
                const a   = alphaInt / 255;
                data[idx]     = Math.round(accentR * a + 0 * (1 - a));
                data[idx + 1] = Math.round(accentG * a + 39 * (1 - a));
                data[idx + 2] = Math.round(accentB * a + 41 * (1 - a));
                data[idx + 3] = 255;
              }
            }
          }
        }
      }

      ctx.putImageData(imageData, 0, 0);
    };

    // Schedule a render only if one isn't already queued (prevents duplicate frames)
    const scheduleRender = () => {
      if (pendingRender) return;
      pendingRender = true;
      animationFrameId = requestAnimationFrame(render);
    };

    // Re-render on scroll only when scroll position actually changed
    const onScroll = () => {
      if (window.scrollY !== lastScrollY) {
        scheduleRender();
      }
    };

    window.addEventListener('resize', resize, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true });

    // Initial render
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
