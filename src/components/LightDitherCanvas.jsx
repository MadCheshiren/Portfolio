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

export default function LightDitherCanvas({ imageSrc = '/ink-art.jpg' }) {
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

        // High-resolution sampling scale for 100% sharp artwork detail
        const scale = 0.85;
        const sw = Math.floor(width * scale);
        const sh = Math.floor(height * scale);

        const offCanvas = document.createElement('canvas');
        offCanvas.width = sw;
        offCanvas.height = sh;
        const offCtx = offCanvas.getContext('2d');

        // Aspect-cover fit
        const imgAspect = img.width / img.height;
        const canvasAspect = sw / sh;
        let dw, dh, dx, dy;

        if (canvasAspect > imgAspect) {
          dw = sw;
          dh = sw / imgAspect;
          dx = 0;
          dy = (sh - dh) / 2;
        } else {
          dh = sh;
          dw = sh * imgAspect;
          dx = (sw - dw) / 2;
          dy = 0;
        }

        offCtx.drawImage(img, dx, dy, dw, dh);
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

            // Bayer 8x8 matrix threshold offset (-0.5 to +0.5)
            const bayerVal = (BAYER_8X8[y % 8][x % 8] / 64) - 0.5;

            // Fine micro-dither grain modulation (±16) preserving 100% sharp gold & black detail
            const ditherOffset = bayerVal * 32;

            const modR = Math.max(0, Math.min(255, r + ditherOffset));
            const modG = Math.max(0, Math.min(255, g + ditherOffset));
            const modB = Math.max(0, Math.min(255, b + ditherOffset));

            outData[idx]     = modR;
            outData[idx + 1] = modG;
            outData[idx + 2] = modB;
            outData[idx + 3] = 255;
          }
        }

        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = sw;
        tempCanvas.height = sh;
        tempCanvas.getContext('2d').putImageData(outputImgData, 0, 0);

        ctx.imageSmoothingEnabled = true;
        ctx.drawImage(tempCanvas, 0, 0, width, height);
      };

      render();
    };
  }, [imageSrc]);

  return (
    <canvas 
      ref={canvasRef} 
      className="absolute inset-0 w-full h-full object-cover pointer-events-none opacity-85 mix-blend-multiply"
    />
  );
}
