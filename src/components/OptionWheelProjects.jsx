import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUpRight, Layers } from 'lucide-react';

export default function OptionWheelProjects({ projects }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isDialExpanded, setIsDialExpanded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  
  const containerRef = useRef(null);
  const touchStartY = useRef(0);
  const initialTouchIndex = useRef(0);

  const activeProject = projects[activeIndex] || projects[0];

  // Prevent page scroll when rolling the wheel over the container on desktop
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e) => {
      e.preventDefault();
      e.stopPropagation();

      if (e.deltaY > 15) {
        setActiveIndex((prev) => Math.min(projects.length - 1, prev + 1));
      } else if (e.deltaY < -15) {
        setActiveIndex((prev) => Math.max(0, prev - 1));
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
  }, [projects.length]);

  // Arrow Key Navigation Listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        if (isHovered || document.activeElement === containerRef.current) {
          e.preventDefault();
          if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
            setActiveIndex((prev) => Math.min(projects.length - 1, prev + 1));
          } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
            setActiveIndex((prev) => Math.max(0, prev - 1));
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isHovered, projects.length]);

  // Touch Drag Gesture on Mobile Side Dial
  const handleDialTouchStart = (e) => {
    touchStartY.current = e.touches[0].clientY;
    initialTouchIndex.current = activeIndex;
    setIsDialExpanded(true);
  };

  const handleDialTouchMove = (e) => {
    if (!touchStartY.current) return;
    const currentY = e.touches[0].clientY;
    const deltaY = touchStartY.current - currentY;

    // Scale sensitivity: 36px drag per item
    const indexOffset = Math.round(deltaY / 36);
    const newIdx = Math.max(0, Math.min(projects.length - 1, initialTouchIndex.current + indexOffset));
    
    if (newIdx !== activeIndex) {
      setActiveIndex(newIdx);
    }
  };

  const handleDialTouchEnd = () => {
    setTimeout(() => setIsDialExpanded(false), 200);
  };

  return (
    <div className="w-full relative py-4">
      <div className="w-full grid lg:grid-cols-12 gap-12 items-center">
        
        {/* Desktop 3D Option Wheel Column (Hidden on mobile < lg) */}
        <div className="hidden lg:flex lg:col-span-5 flex-col items-start select-none">
          <div 
            ref={containerRef}
            tabIndex={0}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className="relative h-[380px] w-full flex items-center justify-start overflow-hidden cursor-grab active:cursor-grabbing focus:outline-none"
            style={{ perspective: 1200 }}
          >
            <div className="relative w-full h-full flex items-center justify-start">
              {projects.map((project, index) => {
                const offset = index - activeIndex;
                const isActive = index === activeIndex;

                const rotateX = offset * -32;
                const translateY = offset * 54;
                const translateZ = -Math.abs(offset) * 50;
                const scale = isActive ? 1.0 : Math.max(0.7, 1 - Math.abs(offset) * 0.12);
                const opacity = isActive ? 1 : Math.max(0.12, 0.7 - Math.abs(offset) * 0.25);
                // Guaranteed positive non-negative blur to eliminate Framer Motion warnings
                const blurVal = isActive ? 0 : Math.max(0, Math.min(6, Math.abs(offset) * 2.2));

                return (
                  <motion.div
                    key={project.id}
                    onClick={() => setActiveIndex(index)}
                    animate={{
                      rotateX,
                      y: translateY,
                      z: translateZ,
                      scale,
                      opacity,
                      filter: `blur(${blurVal}px)`
                    }}
                    transition={{
                      type: 'spring',
                      stiffness: 280,
                      damping: 26,
                    }}
                    style={{
                      transformStyle: 'preserve-3d',
                      position: 'absolute',
                    }}
                    className={`w-full max-w-[340px] text-left cursor-pointer transition-colors ${
                      isActive 
                        ? 'text-5xl lg:text-6xl font-editorial font-bold text-zinc-900 z-30' 
                        : 'text-4xl lg:text-5xl font-editorial text-zinc-700 hover:text-zinc-900 z-10'
                    }`}
                  >
                    <span className="inline-block truncate tracking-tight">{project.title}</span>
                  </motion.div>
                );
              })}
            </div>
          </div>
          
          <div className="text-[11px] font-mono text-zinc-400 mt-2 tracking-wider flex items-center gap-1.5 uppercase">
            <span>[ SCROLL, CLICK, OR ARROW KEYS ↑ ↓ ]</span>
          </div>
        </div>

        {/* Right Column: Flat Project Details Card */}
        <div className="lg:col-span-7 w-full relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeProject.id}
              initial={{ opacity: 0, y: 15, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -15, scale: 0.98 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="bg-white rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row gap-8 items-stretch overflow-hidden border border-zinc-100"
            >
              {/* Image Preview */}
              <div className="md:w-1/2 aspect-[16/10] md:aspect-auto rounded-2xl bg-zinc-100 overflow-hidden flex items-center justify-center shrink-0">
                {activeProject.image ? (
                  <img 
                    src={activeProject.image} 
                    alt={activeProject.title} 
                    className="w-full h-full object-cover"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                ) : (
                  <div className="text-zinc-400 font-mono text-xs p-6 text-center">
                    [ Preview Unavailable ]
                  </div>
                )}
              </div>

              {/* Content Details */}
              <div className="md:w-1/2 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-3 flex-wrap">
                    {activeProject.featured && (
                      <span className="px-3 py-1 bg-zinc-900 text-white text-[10px] font-mono font-semibold rounded-full uppercase tracking-wider">
                        Featured
                      </span>
                    )}
                    <span className="px-3 py-1 bg-zinc-100 text-zinc-600 text-[10px] font-mono font-semibold rounded-full uppercase tracking-wider">
                      {activeProject.category}
                    </span>
                  </div>

                  <h3 className="text-3xl sm:text-4xl font-editorial text-zinc-900 mb-3">
                    {activeProject.title}
                  </h3>
                  <p className="text-zinc-600 text-sm font-sans leading-relaxed mb-6 font-light">
                    {activeProject.description}
                  </p>
                </div>

                {/* Tags & Action Button */}
                <div className="space-y-5 mt-auto">
                  <div className="flex flex-wrap gap-1.5">
                    {activeProject.tags.map((tag, idx) => (
                      <span 
                        key={idx} 
                        className="px-2.5 py-1 bg-zinc-100 text-zinc-700 text-xs font-mono font-medium rounded-md"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>

                  <a 
                    href={activeProject.link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 w-full py-3.5 px-6 bg-zinc-900 text-white font-sans font-bold text-sm rounded-xl hover:bg-zinc-800 transition-colors"
                  >
                    View Project <ArrowUpRight size={16} />
                  </a>
                </div>
              </div>

            </motion.div>
          </AnimatePresence>

          {/* MOBILE FLOATING SIDE TOUCH DIAL CONTROLLER (Positioned right alongside the card on mobile < lg) */}
          <div className="lg:hidden absolute -right-2 top-1/2 -translate-y-1/2 z-40 flex flex-col items-end">
            
            {/* Expanded Slide Menu */}
            <AnimatePresence>
              {isDialExpanded && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.85, x: 15 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.85, x: 15 }}
                  transition={{ type: "spring", stiffness: 380, damping: 26 }}
                  className="mb-2 bg-zinc-900/95 text-white backdrop-blur-md p-3 rounded-2xl shadow-2xl flex flex-col gap-1.5 min-w-[190px] border border-zinc-700/60"
                >
                  <div className="text-[9px] font-mono text-zinc-400 px-2 uppercase tracking-widest flex items-center justify-between pb-1 border-b border-zinc-800">
                    <span>SLIDE TO SELECT</span>
                    <Layers size={10} />
                  </div>

                  {projects.map((project, idx) => {
                    const isActive = idx === activeIndex;
                    return (
                      <button
                        key={project.id}
                        onClick={() => {
                          setActiveIndex(idx);
                          setIsDialExpanded(false);
                        }}
                        className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-left transition-all ${
                          isActive 
                            ? 'bg-white text-zinc-900 font-bold' 
                            : 'text-zinc-300 hover:bg-zinc-800/80'
                        }`}
                      >
                        <span className={`text-[10px] font-mono ${isActive ? 'text-zinc-900' : 'text-zinc-500'}`}>
                          0{idx + 1}
                        </span>
                        <span className="text-xs font-editorial truncate">
                          {project.title}
                        </span>
                      </button>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Circular Floating Touch Knob */}
            <motion.button
              whileTap={{ scale: 0.92 }}
              onTouchStart={handleDialTouchStart}
              onTouchMove={handleDialTouchMove}
              onTouchEnd={handleDialTouchEnd}
              onClick={() => setIsDialExpanded(prev => !prev)}
              className={`w-12 h-12 rounded-full flex items-center justify-center shadow-xl border-2 transition-all cursor-pointer ${
                isDialExpanded 
                  ? 'bg-white text-zinc-900 border-zinc-900 scale-105' 
                  : 'bg-zinc-900 text-white border-white/90'
              }`}
              aria-label="Mobile Project Selector Dial"
            >
              <div className="flex flex-col items-center">
                <span className="font-mono text-xs font-bold leading-none">0{activeIndex + 1}</span>
                <span className="text-[7px] font-mono text-zinc-400 tracking-tighter uppercase mt-0.5">SLIDE</span>
              </div>
            </motion.button>

          </div>

        </div>

      </div>
    </div>
  );
}
