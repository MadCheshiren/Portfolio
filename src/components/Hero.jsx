import { motion } from 'framer-motion';

export default function Hero() {
  return (
    <section id="home" className="min-h-screen flex items-start pt-32 lg:pt-40 pb-16 bg-white relative overflow-hidden">
      
      {/* Full-width container with 0px horizontal padding so content touches screen edges */}
      <div className="w-full flex flex-col lg:flex-row items-start justify-between relative z-10">
        
        {/* Left Column: Flush against left screen edge (0px padding, pushed down for perfect vertical balance) */}
        <div className="w-full lg:w-1/2 space-y-6 pl-0 pt-4 lg:pt-8">
          
          {/* Hero Title: High-Fashion Editorial Serif */}
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="inline-block"
          >
            <div className="relative group overflow-hidden py-3 px-4 sm:py-4 sm:px-6 cursor-pointer select-none">
              {/* Sliding black background box */}
              <div className="absolute inset-0 bg-black -translate-x-[101%] group-hover:translate-x-0 transition-transform duration-300 ease-out" />
              <h1 className="relative z-10 text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-editorial tracking-tight leading-none text-black group-hover:text-white transition-colors duration-300">
                I'm Kirren
              </h1>
            </div>
          </motion.div>

          {/* Bio Paragraph: Sharp Rectangular Container matching Title above */}
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="inline-block max-w-2xl block"
          >
            <div className="relative group overflow-hidden py-3 px-4 sm:py-4 sm:px-6 cursor-pointer select-none">
              {/* Sliding black background box */}
              <div className="absolute inset-0 bg-black -translate-x-[101%] group-hover:translate-x-0 transition-transform duration-300 ease-out" />
              <p className="relative z-10 text-lg md:text-2xl font-light leading-relaxed text-zinc-800 group-hover:text-white transition-colors duration-300 font-sans">
                Building elegant, functional web experiences. Bridging technical precision with creative expression.
              </p>
            </div>
          </motion.div>

        </div>

        {/* Right Column: Architectural Sketch pulled UP high so the cathedral spire sits near the top right */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.3, ease: [0.32, 0.72, 0, 1] }}
          className="w-full lg:w-1/2 flex justify-end pr-0 relative -mt-20 lg:-mt-32"
        >
          <div className="relative max-w-md lg:max-w-xl w-full aspect-[3/4] flex items-start justify-end pointer-events-none select-none">
            
            {/* Grayscale + Contrast for crisp white blend, stuck to right edge and pulled up */}
            <motion.img 
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
              src="/sketch-bg.jfif" 
              alt="Renaissance architectural sketch" 
              className="w-full h-full object-contain object-right-top opacity-90 mix-blend-multiply filter grayscale contrast-[160%] brightness-[105%] [mask-image:radial-gradient(ellipse_at_center,black_60%,transparent_98%)]"
            />

          </div>
        </motion.div>

      </div>
    </section>
  );
}
