import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

const GRID_WIDTH = 64;
const GRID_HEIGHT = 30;
const DENSITY_STRING = ' .:-=+*#%@';

export default function BackgroundAsciiCat() {
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
      step += 0.14;

      // 1. Clear Canvas
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, GRID_WIDTH, GRID_HEIGHT);

      ctx.fillStyle = '#FFFFFF';
      ctx.strokeStyle = '#FFFFFF';

      const centerX = GRID_WIDTH / 2;
      const centerY = GRID_HEIGHT / 2 - 1;

      // 2. Draw Cat Body
      ctx.beginPath();
      ctx.ellipse(centerX + 6, centerY - 1, 9, 7, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.ellipse(centerX - 4, centerY - 1, 13, 7.5, -0.05, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.ellipse(centerX - 12, centerY - 2, 8, 7, 0, 0, Math.PI * 2);
      ctx.fill();

      // 3. Draw Head
      const headX = centerX + 15;
      const headY = centerY - 7;
      ctx.beginPath();
      ctx.ellipse(headX, headY, 6.5, 5.5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Ears
      ctx.beginPath();
      ctx.moveTo(headX + 2, headY - 4);
      ctx.lineTo(headX + 6, headY - 10);
      ctx.lineTo(headX - 1, headY - 6);
      ctx.closePath();
      ctx.fill();

      // Muzzle
      ctx.beginPath();
      ctx.ellipse(headX + 5, headY + 1, 3, 2.5, 0, 0, Math.PI * 2);
      ctx.fill();

      // 4. Fluid S-Curve Tail
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      const tailBaseX = centerX - 18;
      const tailBaseY = centerY - 4;
      ctx.moveTo(tailBaseX, tailBaseY);

      for (let i = 1; i <= 8; i++) {
        const t = i / 8;
        const tx = tailBaseX - t * 14;
        const ty = tailBaseY - t * 10 + Math.sin(step * 2.2 - i * 0.45) * 4;
        ctx.lineTo(tx, ty);
      }
      ctx.stroke();

      // 5. Jointed Feline Leg Anatomy
      ctx.lineWidth = 1.6;
      ctx.strokeStyle = '#FFFFFF';

      const drawJointedLeg = (startX, startY, phaseOffset, isFront) => {
        const angle = Math.sin(step * 3.2 + phaseOffset);
        const hipAngle = angle * 0.55;
        const kneeAngle = isFront 
          ? Math.sin(step * 3.2 + phaseOffset + 0.6) * 0.45 
          : -Math.sin(step * 3.2 + phaseOffset + 0.6) * 0.55;

        const upperLen = 5.5;
        const lowerLen = 5.5;

        const kneeX = startX + Math.sin(hipAngle) * upperLen;
        const kneeY = startY + Math.cos(hipAngle) * upperLen;

        const footX = kneeX + Math.sin(hipAngle + kneeAngle) * lowerLen;
        const footY = kneeY + Math.cos(hipAngle + kneeAngle) * lowerLen;

        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(kneeX, kneeY);
        ctx.lineTo(footX, footY);
        ctx.stroke();

        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(footX, footY, 1.1, 0, Math.PI * 2);
        ctx.fill();
      };

      drawJointedLeg(centerX + 8, centerY + 5, 0, true);
      drawJointedLeg(centerX + 4, centerY + 5, Math.PI, true);
      drawJointedLeg(centerX - 9, centerY + 4, Math.PI * 0.5, false);
      drawJointedLeg(centerX - 13, centerY + 4, Math.PI * 1.5, false);

      // Eye
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(headX + 3, headY - 1, 1.4, 0, Math.PI * 2);
      ctx.fill();

      // 6. Convert to ASCII Grid
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
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden flex items-center">
      <motion.div
        animate={{
          x: ['-30vw', '130vw'],
          y: [0, -12, 0, -12, 0]
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "linear",
          repeatDelay: 1
        }}
        className="opacity-25 select-none font-mono"
      >
        <pre className="text-[8px] sm:text-[10px] md:text-[11px] leading-[0.85] text-zinc-900 font-extrabold whitespace-pre tracking-[0.1em]">
          {asciiArt}
        </pre>
      </motion.div>
    </div>
  );
}
