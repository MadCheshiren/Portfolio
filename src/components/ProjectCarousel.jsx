import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, ArrowUpRight } from 'lucide-react';

export default function ProjectCarousel({ projects }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const toPrev = (e) => {
    e.stopPropagation();
    setActiveIndex(prev => Math.max(0, prev - 1));
  };

  const toNext = (e) => {
    e.stopPropagation();
    setActiveIndex(prev => Math.min(projects.length - 1, prev + 1));
  };

  const toSlide = (e, index) => {
    e.stopPropagation();
    setActiveIndex(index);
  };

  const slideWidth = 320; 

  if (projects.length === 0) {
    return <div className="text-center text-zinc-500 py-20">No projects found.</div>;
  }

  return (
    <div 
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="w-full flex flex-col items-center justify-center relative overflow-hidden select-none py-10"
    >
      <div 
        className="relative flex items-center justify-start overflow-visible h-[480px] w-full max-w-[320px]"
      >
        <motion.div 
          className="flex w-fit items-center"
          animate={{ x: -activeIndex * slideWidth }}
          transition={{ type: 'spring', bounce: 0.1, duration: 0.8 }}
        >
          {projects.map((project, i) => {
            const isActive = activeIndex === i;
            const diff = i - activeIndex;

            const targetRotate = isHovered ? diff * 8 : diff * 2;
            const targetScale = isActive ? 1.05 : (isHovered ? 0.9 : 0.95);
            const targetY = isHovered ? Math.abs(diff) * 10 : 0;

            return (
              <motion.div 
                key={project.id}
                className="shrink-0 flex flex-col items-center justify-center gap-1.5 will-change-[transform,scale]"
                style={{ width: `${slideWidth}px` }}
                animate={{ 
                  rotate: targetRotate, 
                  scale: targetScale, 
                  y: targetY,
                  zIndex: isActive ? 30 : 20 - Math.abs(diff)
                }}
                transition={{ type: 'spring', bounce: 0.2, duration: 0.8 }}
                onClick={(e) => !isActive && toSlide(e, i)}
              >
                <div 
                  className={`w-[300px] h-[420px] rounded-3xl bg-white border ${
                    isActive ? 'border-zinc-300 shadow-2xl' : 'border-zinc-100 shadow-md opacity-80'
                  } overflow-hidden flex flex-col transition-all duration-300 cursor-pointer group`}
                >
                  {project.image ? (
                    <div className="aspect-[16/9] w-full overflow-hidden bg-zinc-200 shrink-0">
                      <img 
                        src={project.image} 
                        alt={project.title} 
                        className="w-full h-full object-cover"
                        onError={(e) => e.target.style.display = 'none'}
                      />
                    </div>
                  ) : (
                    <div className="aspect-[16/9] w-full bg-zinc-50 flex items-center justify-center text-zinc-400 font-mono text-xs shrink-0 border-b border-zinc-100">
                      [ Preview Unavailable ]
                    </div>
                  )}
                  
                  <div className="p-6 flex flex-col flex-grow">
                    {project.featured && (
                      <span className="inline-block px-3 py-1 bg-zinc-900 text-white text-[10px] font-semibold rounded-full mb-3 w-max">
                        Featured
                      </span>
                    )}
                    
                    <h3 className="text-xl font-bold text-zinc-900 mb-2">{project.title}</h3>
                    <p className="text-zinc-500 text-sm leading-relaxed mb-4 line-clamp-3">
                      {project.description}
                    </p>
                    
                    {isActive ? (
                      <a 
                        href={project.link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-900 hover:text-zinc-600 transition-colors mt-auto"
                        onClick={(e) => e.stopPropagation()}
                      >
                        View Project <ArrowUpRight size={16} />
                      </a>
                    ) : (
                      <div className="mt-auto text-sm font-medium text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity">
                        Click to focus
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )
          })}
        </motion.div>
      </div>

      <div className="mt-8 px-2 py-1 flex items-center gap-3 justify-center rounded-full bg-zinc-900 shadow-md z-20">
        <button onClick={toPrev} className="p-1.5 cursor-pointer hover:bg-zinc-800 rounded-full transition-colors border-0 bg-transparent text-zinc-400 hover:text-white">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="flex justify-center items-center gap-1.5">
          {projects.map((_, i) => (
            <div 
              key={i} 
              onClick={(e) => toSlide(e, i)}
              className={`rounded-full cursor-pointer h-1.5 transition-all duration-300 ${
                activeIndex === i ? 'w-6 bg-white' : 'w-1.5 bg-zinc-600 hover:bg-zinc-400'
              }`}>
            </div>
          ))}
        </div>
        <button onClick={toNext} className="p-1.5 cursor-pointer hover:bg-zinc-800 rounded-full transition-colors border-0 bg-transparent text-zinc-400 hover:text-white">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
