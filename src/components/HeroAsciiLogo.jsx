import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

const GRID_WIDTH = 48;
const GRID_HEIGHT = 26;
// High contrast density string for dark crisp lines
const DENSITY_STRING = '  ..::-=*#%@';

export default function HeroAsciiLogo() {
  const [asciiArt, setAsciiArt] = useState('');
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current || document.createElement('canvas');
    canvas.width = GRID_WIDTH;
    canvas.height = GRID_HEIGHT;
    const ctx = canvas.getContext('2d');

    let animationFrameId;
    let step = 0;

    const render = () => {
      step += 0.05;

      // Clear Canvas
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, GRID_WIDTH, GRID_HEIGHT);

      const centerX = GRID_WIDTH / 2;
      const centerY = GRID_HEIGHT / 2 + 1;

      // Draw Outer Shield Crest (Thick lines for dark contrast)
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(centerX - 16, centerY - 8);
      ctx.lineTo(centerX, centerY - 12);
      ctx.lineTo(centerX + 16, centerY - 8);
      ctx.lineTo(centerX + 18, centerY + 2);
      ctx.lineTo(centerX, centerY + 11);
      ctx.lineTo(centerX - 18, centerY + 2);
      ctx.closePath();
      ctx.stroke();

      // Draw Cat Ears atop the Shield
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      // Left Ear
      ctx.moveTo(centerX - 14, centerY - 8);
      ctx.lineTo(centerX - 18, centerY - 16);
      ctx.lineTo(centerX - 6, centerY - 10);
      ctx.closePath();
      ctx.fill();

      // Right Ear
      ctx.beginPath();
      ctx.moveTo(centerX + 14, centerY - 8);
      ctx.lineTo(centerX + 18, centerY - 16);
      ctx.lineTo(centerX + 6, centerY - 10);
      ctx.closePath();
      ctx.fill();

      // Inner Code / Game Controller Emblem Core
      // Left Bracket '<'
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(centerX - 10, centerY - 4);
      ctx.lineTo(centerX - 14, centerY - 1);
      ctx.lineTo(centerX - 10, centerY + 2);
      ctx.stroke();

      // Right Bracket '>'
      ctx.beginPath();
      ctx.moveTo(centerX + 10, centerY - 4);
      ctx.lineTo(centerX + 14, centerY - 1);
      ctx.lineTo(centerX + 10, centerY + 2);
      ctx.stroke();

      // Center D-Pad Cross (+)
      const pulse = Math.sin(step * 3) * 0.8;
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(centerX - 1.5, centerY - 5, 3, 8 + pulse);
      ctx.fillRect(centerX - 5, centerY - 1.5, 10 + pulse, 3);

      // Cat Eyes inside emblem (glow)
      const leftEyeX = centerX - 6;
      const rightEyeX = centerX + 6;
      const eyeY = centerY - 6;

      ctx.beginPath();
      ctx.arc(leftEyeX, eyeY, 2.2, 0, Math.PI * 2);
      ctx.arc(rightEyeX, eyeY, 2.2, 0, Math.PI * 2);
      ctx.fill();

      // Pupil (Dark)
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(leftEyeX, eyeY, 1.0, 0, Math.PI * 2);
      ctx.arc(rightEyeX, eyeY, 1.0, 0, Math.PI * 2);
      ctx.fill();

      // Convert Canvas Pixels to High-Density ASCII Matrix
      const imgData = ctx.getImageData(0, 0, GRID_WIDTH, GRID_HEIGHT).data;
      let result = '';

      for (let y = 0; y < GRID_HEIGHT; y++) {
        for (let x = 0; x < GRID_WIDTH; x++) {
          const idx = (y * GRID_WIDTH + x) * 4;
          const r = imgData[idx];
          const g = imgData[idx + 1];
          const b = imgData[idx + 2];
          const brightness = (r + g + b) / 3;

          const charIdx = Math.floor((brightness / 255) * (DENSITY_STRING.length - 1));
          result += DENSITY_STRING[charIdx];
        }
        result += '\n';
      }

      setAsciiArt(result);
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center p-4 font-mono select-none overflow-hidden">
      <motion.div
        animate={{ 
          y: [0, -5, 0],
          rotate: [-1, 1, -1] 
        }}
        transition={{ 
          duration: 4, 
          repeat: Infinity, 
          ease: "easeInOut" 
        }}
        className="inline-block"
      >
        <pre className="text-[9px] sm:text-[10px] md:text-[12px] leading-[0.88] text-black font-black whitespace-pre font-mono tracking-[0.08em] drop-shadow-md">
          {asciiArt}
        </pre>
      </motion.div>
      <div className="mt-3 text-[11px] font-mono text-zinc-900 font-bold uppercase tracking-widest">
        [ EMBLEM // KMF_QA_DEV ]
      </div>
    </div>
  );
}
