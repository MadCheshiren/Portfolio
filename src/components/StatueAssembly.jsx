import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

// Slices cut in-place from same canvas origin assemble perfectly to {x:0, y:0, rotate:0}
const SLICES = [
  {
    src: '/statue-slice-1.png',
    scatter: { x: -180, y: -130, rotate: -22 },
  },
  {
    src: '/statue-slice-2.png',
    scatter: { x: 160, y: -90, rotate: 16 },
  },
  {
    src: '/statue-slice-3.png',
    scatter: { x: -120, y: 110, rotate: -14 },
  },
  {
    src: '/statue-slice-4.png',
    scatter: { x: 190, y: 140, rotate: 26 },
  },
];

export default function StatueAssembly() {
  const containerRef = useRef(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start 95%', 'start 20%'],
  });

  return (
    <div
      ref={containerRef}
      className="relative w-full max-w-[320px] sm:max-w-[380px] mx-auto select-none"
      style={{ aspectRatio: '475 / 827' }}
    >
      {SLICES.map((slice, i) => (
        <SliceLayer
          key={i}
          src={slice.src}
          scatter={slice.scatter}
          scrollYProgress={scrollYProgress}
          index={i}
        />
      ))}
    </div>
  );
}

function SliceLayer({ src, scatter, scrollYProgress, index }) {
  // Rapid convergence curve so slices fully lock at (0,0) as soon as About section enters upper viewport or is navigated to
  const x = useTransform(scrollYProgress, [0, 0.3, 0.65, 1], [scatter.x, scatter.x * 0.3, 0, 0]);
  const y = useTransform(scrollYProgress, [0, 0.3, 0.65, 1], [scatter.y, scatter.y * 0.3, 0, 0]);
  const rotate = useTransform(scrollYProgress, [0, 0.3, 0.65, 1], [scatter.rotate, scatter.rotate * 0.2, 0, 0]);
  const opacity = useTransform(scrollYProgress, [0, 0.15, 0.5, 1], [0.15, 0.6, 1, 1]);

  return (
    <motion.img
      src={src}
      alt={`Statue fragment ${index + 1}`}
      loading="eager"
      draggable={false}
      style={{ x, y, rotate, opacity }}
      className="absolute inset-0 w-full h-full object-contain pointer-events-none will-change-transform"
    />
  );
}
