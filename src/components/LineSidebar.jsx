import { useState, useRef } from 'react';
import { motion } from 'framer-motion';

export default function LineSidebar({
  items = [],
  accentColor = '#18181b',
  textColor = '#71717a',
  activeTextColor = '#09090b',
  markerColor = '#d4d4d8',
  showIndex = true,
  showMarker = true,
  proximityRadius = 100,
  maxShift = 24,
  markerLength = 40,
  itemGap = 24,
  defaultActive = 0,
  onItemClick,
}) {
  const [activeIndex, setActiveIndex] = useState(defaultActive);
  const [mouseY, setMouseY] = useState(null);
  const containerRef = useRef(null);

  const handleMouseMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setMouseY(e.clientY - rect.top);
  };

  const handleMouseLeave = () => {
    setMouseY(null);
  };

  return (
    <div 
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="flex flex-col select-none py-2"
      style={{ gap: `${itemGap}px` }}
    >
      {items.map((item, idx) => {
        const isActive = idx === activeIndex;

        // Proximity magnetic shift calculation
        let shiftX = 0;
        if (mouseY !== null && containerRef.current) {
          const itemHeight = 36;
          const itemY = idx * (itemGap + itemHeight) + itemHeight / 2;
          const dist = Math.abs(mouseY - itemY);

          if (dist < proximityRadius) {
            const factor = Math.cos((dist / proximityRadius) * (Math.PI / 2));
            shiftX = factor * maxShift;
          }
        }

        return (
          <div
            key={idx}
            onClick={() => {
              setActiveIndex(idx);
              if (onItemClick) onItemClick(idx, item);
            }}
            className="group flex items-center gap-3.5 cursor-pointer py-1.5"
          >
            {/* Horizontal Line Marker with magnetic shift */}
            {showMarker && (
              <motion.div
                animate={{
                  width: isActive ? markerLength + 14 : markerLength,
                  x: shiftX,
                  backgroundColor: isActive ? accentColor : markerColor,
                }}
                transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                className="h-[2px] rounded-full shrink-0"
              />
            )}

            {/* Index Number */}
            {showIndex && (
              <span 
                className={`text-xs font-mono tracking-wider shrink-0 transition-colors duration-200 ${
                  isActive ? 'font-bold text-zinc-900' : 'text-zinc-400'
                }`}
              >
                {String(idx + 1).padStart(2, '0')}
              </span>
            )}

            {/* Item Label - Crisp Sans with clean line-height to prevent letter collision */}
            <motion.span
              animate={{ x: shiftX * 0.5 }}
              transition={{ type: 'spring', stiffness: 350, damping: 25 }}
              style={{ color: isActive ? activeTextColor : textColor }}
              className={`text-sm sm:text-base font-sans leading-snug transition-colors duration-200 ${
                isActive ? 'font-bold scale-102' : 'font-medium group-hover:text-zinc-900'
              }`}
            >
              {item}
            </motion.span>
          </div>
        );
      })}
    </div>
  );
}
