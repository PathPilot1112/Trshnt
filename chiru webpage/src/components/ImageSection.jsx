import React, { useRef, useEffect } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

const ImageCanvas = ({ scrollProgress }) => {
  const canvasRef = useRef();

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    let animationFrameId;
    let imgDataObj = null;

    const img = new Image();
    img.src = window.innerWidth < 768 ? '/phone v1.png' : '/image.png';
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
      // Use smaller spacing on mobile to increase resolution, otherwise the image becomes unrecognizable
      const spacing = isMobile ? 4 : 5;
      const cols = Math.floor(canvas.width / spacing) + 5; // Draw extra columns past the edge
      const rowHeight = isMobile ? 5 : 7;
      const rows = Math.floor(canvas.height / rowHeight) + 1;

      const p = scrollProgress.current;

      // Use Math.min on mobile to ensure the entire image is visible without cropping
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

          // Parallax effect: disable or reduce on mobile to avoid cropping the focal point
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

            // Brightness threshold logic - boosted slightly for visibility, but not too bright
            brightness = Math.max(brightness, ((r + g + b) / (255 * 3)) * 1.2);
          }

          // Always draw, as base brightness ensures it renders faint lines
          if (brightness > 0.02) {
            // Incorporate time to animate the lines continuously even without scrolling
            const dynamicBrightness = brightness * (0.8 + 0.35 * Math.sin(time + i * 0.15 + j * 0.1));
            const noise = noiseMap[i % 300][j % 300];
            const finalVal = dynamicBrightness * 1.0 + noise * 0.3; // Balanced contrast

            if (finalVal > 0.15) {
              const thickness = Math.max(1, (finalVal - 0.15) * 4.5); // Slightly thinner lines
              const length = Math.min(rowHeight, finalVal * rowHeight * 1.2); // Normal length

              ctx.globalAlpha = Math.min(1, finalVal + 0.2); // Balanced opacity
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
    <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />

      {/* Dark gradient container to make text pop */}
      <div className="image-text-container" style={{
        position: 'absolute',
        bottom: '0',
        width: '100%',
        padding: '4rem 2rem 3rem 2rem',
        background: 'linear-gradient(to top, rgba(0, 39, 41, 1) 0%, rgba(0, 39, 41, 0.8) 40%, rgba(0, 39, 41, 0) 100%)',
        textAlign: 'center',
        zIndex: 10,
        pointerEvents: 'none'
      }}>
        <div className="image-text" style={{
          color: 'var(--color-text)',
          fontFamily: 'var(--font-sans)',
          fontSize: '1.4rem',
          letterSpacing: '5px',
          fontWeight: '600',
          textShadow: '0px 4px 15px rgba(0, 0, 0, 0.9), 0 0 20px rgba(155, 168, 168, 0.6)',
          textTransform: 'uppercase'
        }}>
          GEAR UP WITH YOURSELF WITH THE RULES CAREFULLY TO ESCAPE
        </div>
      </div>
    </div>
  );
};

const ImageSection = () => {
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
    <section ref={container} style={{
      padding: '0',
      backgroundColor: 'transparent',
      display: 'flex',
      width: '100%',
      height: '100vh',
      margin: '0 auto',
      position: 'relative'
    }}>
      <ImageCanvas scrollProgress={progressRef} />
    </section>
  );
};

export default ImageSection;
