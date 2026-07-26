import React, { useEffect, useRef } from 'react';

const BackgroundCanvas = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    let animationFrameId;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resize);
    resize();

    // Generate static noise array once so it doesn't flicker
    const noiseMap = Array.from({ length: 500 }, () =>
      Array.from({ length: 500 }, () => Math.random())
    );

    const render = () => {
      // Clear with dark teal background
      ctx.fillStyle = '#002729';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Champagne/muted teal for the halftone dots
      ctx.fillStyle = '#9BA8A8';

      const spacing = 12;
      const cols = Math.floor(canvas.width / spacing) + 1;
      const rowHeight = 15;
      const rows = Math.floor(canvas.height / rowHeight) + 1;

      const centerX = cols / 2;

      const scrollY = window.scrollY || 0;
      const scrollOffset = scrollY * 0.03;

      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const x = i * spacing;
          const y = j * rowHeight;

          const sampleJ = j + scrollOffset;

          const distFromCenter = Math.abs(i - centerX);

          let shapeValue = 0;
          const mountainSlope = (rows - sampleJ) * 1.2;

          if (distFromCenter < mountainSlope && sampleJ > rows * 0.2) {
            shapeValue = 1 - (distFromCenter / mountainSlope);
          }

          const noise = noiseMap[i % 500][j % 500];
          const finalVal = shapeValue * 0.8 + noise * 0.4;

          if (finalVal > 0.4) {
            const thickness = Math.max(1, (finalVal - 0.4) * 5);
            const length = Math.min(rowHeight, finalVal * rowHeight * 0.8);

            ctx.globalAlpha = Math.min(0.8, finalVal * (sampleJ / rows + 0.2));

            ctx.fillRect(
              x + (spacing - thickness) / 2,
              y + (rowHeight - length) / 2,
              thickness,
              length
            );
          }
        }
      }
      ctx.globalAlpha = 1.0;

      animationFrameId = requestAnimationFrame(render);
    };
    render();

    window.addEventListener('resize', render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('resize', render);
    };
  }, []);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      zIndex: 0,
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
