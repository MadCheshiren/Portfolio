import { useEffect, useRef } from 'react';

const BAYER_8X8 = [
  [ 0, 32,  8, 40,  2, 34, 10, 42],
  [48, 16, 56, 24, 50, 18, 58, 26],
  [12, 44,  4, 36, 14, 46,  6, 38],
  [60, 28, 52, 20, 62, 30, 54, 22],
  [ 3, 35, 11, 43,  1, 33,  9, 41],
  [51, 19, 59, 27, 49, 17, 57, 25],
  [15, 47,  7, 39, 13, 45,  5, 37],
  [63, 31, 55, 23, 61, 29, 53, 21]
];

export default function InkDitherCanvas({ videoSrc = '/background.webm' }) {
  const canvasRef = useRef(null);
  const videoRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const video = document.createElement('video');
    video.src = videoSrc;
    video.autoplay = true;
    video.loop = true;
    video.muted = true;
    video.playsInline = true;
    video.crossOrigin = 'anonymous';
    videoRef.current = video;

    let animationFrameId;

    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        // Fallback autoplay handler
        video.muted = true;
        video.play();
      });
    }

    const render = () => {
      const width = canvas.offsetWidth;
      const height = canvas.offsetHeight;

      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }

      if (width > 0 && height > 0 && video.readyState >= 2) {
        const scale = 0.22;
        const sw = Math.floor(width * scale);
        const sh = Math.floor(height * scale);

        // Offscreen sampling canvas
        const offCanvas = document.createElement('canvas');
        offCanvas.width = sw;
        offCanvas.height = sh;
        const offCtx = offCanvas.getContext('2d');

        // Draw video aspect-cover
        const videoAspect = (video.videoWidth || 16) / (video.videoHeight || 9);
        const canvasAspect = sw / sh;
        let dw, dh, dx, dy;

        if (canvasAspect > videoAspect) {
          dw = sw;
          dh = sw / videoAspect;
          dx = 0;
          dy = (sh - dh) / 2;
        } else {
          dh = sh;
          dw = sh * videoAspect;
          dx = (sw - dw) / 2;
          dy = 0;
        }

        offCtx.drawImage(video, dx, dy, dw, dh);
        const imgData = offCtx.getImageData(0, 0, sw, sh);
        const data = imgData.data;

        const outputImgData = ctx.createImageData(sw, sh);
        const outData = outputImgData.data;

        for (let y = 0; y < sh; y++) {
          for (let x = 0; x < sw; x++) {
            const idx = (y * sw + x) * 4;
            const r = data[idx];
            const g = data[idx + 1];
            const b = data[idx + 2];

            // Luminance
            const lum = 0.299 * r + 0.587 * g + 0.114 * b;

            // Bayer 8x8 matrix threshold
            const bayerVal = (BAYER_8X8[y % 8][x % 8] / 64) * 255;

            const outIdx = (y * sw + x) * 4;

            if (lum > bayerVal) {
              // High dot: Dark charcoal ink particle
              outData[outIdx]     = 18;
              outData[outIdx + 1] = 18;
              outData[outIdx + 2] = 22;
            } else {
              // Low dot: Crisp pure background
              outData[outIdx]     = 255;
              outData[outIdx + 1] = 255;
              outData[outIdx + 2] = 255;
            }

            outData[outIdx + 3] = 255;
          }
        }

        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = sw;
        tempCanvas.height = sh;
        tempCanvas.getContext('2d').putImageData(outputImgData, 0, 0);

        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(tempCanvas, 0, 0, width, height);
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.src = '';
      }
    };
  }, [videoSrc]);

  return (
    <canvas 
      ref={canvasRef} 
      className="absolute inset-0 w-full h-full object-cover pointer-events-none opacity-20 mix-blend-multiply z-0"
    />
  );
}
