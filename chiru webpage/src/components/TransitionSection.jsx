import React, { useRef, useEffect } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

const TransitionSection = () => {
  const container = useRef();
  const canvasRef = useRef();

  const progressRef = useRef(0);

  useGSAP(() => {
    // This scrollTrigger fires as this section enters and leaves the viewport
    gsap.to(progressRef, {
      current: 1,
      scrollTrigger: {
        trigger: container.current,
        start: "top bottom", // Starts when the top of the section enters from the bottom of the screen
        end: "bottom top",   // Ends when the bottom of the section leaves the top of the screen
        scrub: true,
        onUpdate: (self) => {
          progressRef.current = self.progress;
        }
      }
    });
  }, { scope: container });

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const resize = () => {
      canvas.width = canvas.parentElement.clientWidth;
      canvas.height = canvas.parentElement.clientHeight;
    };
    window.addEventListener('resize', resize);
    resize();

    // Pre-generate noise map for stable dithering
    const noiseMap = Array.from({ length: 400 }, () =>
      Array.from({ length: 400 }, () => Math.random())
    );

    let time = 0;
    const render = () => {
      time += 0.05;
      const p = progressRef.current;

      // Calculate a phase that peaks in the middle of the scroll (when p = 0.5)
      // This makes the anomaly "appear" and then "dissipate" as you scroll past
      const phase = Math.max(0, Math.sin(p * Math.PI));

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = '#9BA8A8'; // Matching the premium Gold/Bronze color

      const spacing = 12;
      const cols = Math.floor(canvas.width / spacing) + 1;
      const rowHeight = 15;
      const rows = Math.floor(canvas.height / rowHeight) + 1;

      const centerX = cols / 2;
      const centerY = rows / 2;

      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const x = i * spacing;
          const y = j * rowHeight;

          // Build a shape matching the uploaded image (Central orb + Diagonals)
          const distToCenter = Math.sqrt(Math.pow(i - centerX, 2) + Math.pow(j - centerY, 2));

          let shapeVal = 0;

          // 1. Central Orb / Eye
          if (distToCenter < 12) {
            shapeVal = 1;
          } else if (distToCenter < 25) {
            shapeVal = 1 - (distToCenter - 12) / 13;
          }

          // 2. Diagonal beams (like laser tracks or rays)
          const diag1 = Math.abs((i + j * 1.5) - (centerX + centerY * 1.5 - 20));
          if (diag1 < 3) shapeVal += 0.6;

          const diag2 = Math.abs((i + j * 1.5) - (centerX + centerY * 1.5 + 40));
          if (diag2 < 2) shapeVal += 0.5;

          // 3. Lower landscape / anomalous mass
          if (j > rows * 0.65) {
            shapeVal += noiseMap[i % 400][j % 400] * 0.9;
          }

          // Combine shape with general noise for the dithered halftone effect
          const noise = noiseMap[i % 400][j % 400];

          // Multiply by the scroll phase so it dynamically builds and vanishes
          const dynamicShapeVal = shapeVal * (0.8 + 0.3 * Math.sin(time + i * 0.1 + j * 0.1));
          let finalVal = (dynamicShapeVal * 0.7 + noise * 0.3) * phase;

          if (finalVal > 0.25) {
            const thickness = Math.max(1, (finalVal - 0.25) * 5);
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
      ctx.globalAlpha = 1.0;
      animationFrameId = requestAnimationFrame(render);
    };
    render();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <section ref={container} style={{
      height: '100vh',
      width: '100%',
      position: 'relative',
      padding: 0,
      margin: '2rem 0',
      overflow: 'hidden'
    }}>
      <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />
    </section>
  );
};

export default TransitionSection;
