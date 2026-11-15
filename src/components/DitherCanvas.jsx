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

export default function DitherCanvas({ imageSrc = '/skulls.jfif', invert = true }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageSrc;

    img.onload = () => {
      const render = () => {
        const width = canvas.offsetWidth;
        const height = canvas.offsetHeight;

        if (canvas.width !== width || canvas.height !== height) {
          canvas.width = width;
          canvas.height = height;
        }

        if (width === 0 || height === 0) return;

        // Downscale scale factor for pixel-crisp Bayer dither dots
        const scale = 0.32;
        const sw = Math.floor(width * scale);
        const sh = Math.floor(height * scale);

        // Offscreen canvas for sampling source image
        const offCanvas = document.createElement('canvas');
        offCanvas.width = sw;
        offCanvas.height = sh;
        const offCtx = offCanvas.getContext('2d');

        // Contain fit (scaled down to 80% so entire skull composition is fully visible)
        const imgAspect = img.width / img.height;
        let dw, dh, dx, dy;

        const maxW = sw * 0.85;
        const maxH = sh * 0.85;

        if (maxW / maxH > imgAspect) {
          dh = maxH;
          dw = maxH * imgAspect;
        } else {
          dw = maxW;
          dh = maxW / imgAspect;
        }

        dx = (sw - dw) / 2;
        dy = (sh - dh) / 2;

        // Clear offscreen canvas with white background before drawing
        offCtx.fillStyle = '#ffffff';
        offCtx.fillRect(0, 0, sw, sh);
        offCtx.drawImage(img, dx, dy, dw, dh);

        const imgData = offCtx.getImageData(0, 0, sw, sh);
        const data = imgData.data;

        // Output ImageData
        const outputImgData = ctx.createImageData(sw, sh);
        const outData = outputImgData.data;

        for (let y = 0; y < sh; y++) {
          for (let x = 0; x < sw; x++) {
            const idx = (y * sw + x) * 4;
            const r = data[idx];
            const g = data[idx + 1];
            const b = data[idx + 2];

            // Luminance calculation
            let lum = 0.299 * r + 0.587 * g + 0.114 * b;

            // Invert for light background drawings (paper -> dark, ink lines -> light)
            if (invert) {
              lum = 255 - lum;
            }

            // Bayer 8x8 matrix threshold (0..255) — Stationary (Zero wave oscillation)
            const threshold = (BAYER_8X8[y % 8][x % 8] / 64) * 255;

            const outIdx = (y * sw + x) * 4;

            if (lum > threshold) {
              // High Dot: Glowing silver/white dithered ink lines
              outData[outIdx]     = 210;
              outData[outIdx + 1] = 210;
              outData[outIdx + 2] = 215;
            } else {
              // Low Dot: Deep dark background void
              outData[outIdx]     = 10;
              outData[outIdx + 1] = 10;
              outData[outIdx + 2] = 14;
            }

            outData[outIdx + 3] = 255;
          }
        }

        // Render pixelated canvas buffer
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = sw;
        tempCanvas.height = sh;
        tempCanvas.getContext('2d').putImageData(outputImgData, 0, 0);

        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(tempCanvas, 0, 0, width, height);
      };

      render();
    };
  }, [imageSrc, invert]);

  return (
    <canvas 
      ref={canvasRef} 
      className="absolute inset-0 w-full h-full object-contain pointer-events-none opacity-60 mix-blend-screen"
    />
  );
}
