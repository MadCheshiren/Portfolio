import { motion } from 'framer-motion';
import StatueAssembly from './StatueAssembly';

export default function About() {
  return (
    <section id="about" className="py-24 px-6 bg-zinc-50 overflow-hidden">
      <div className="max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-12 gap-12 items-center">
          
          {/* Scroll-Driven Statue Slice Assembly */}
          <div className="lg:col-span-5 flex items-center justify-center p-6 min-h-[500px]">
            <StatueAssembly />
          </div>

          {/* Editorial Biography & Pull Quote */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-7 space-y-8"
          >
            <div>
              <span className="text-xs font-mono text-zinc-400 mb-3 block uppercase tracking-widest">[ PROFILE // KIRREN FRAGINAL ]</span>
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-editorial tracking-tight text-zinc-900 leading-tight mb-6">
                Bridging technical precision with creative expression.
              </h2>
              <p className="text-base sm:text-lg font-light text-zinc-600 leading-relaxed font-sans mb-4">
                Based in Naga City, I work across Quality Assurance, System Administration, and software engineering. I focus on reliable infrastructure, quality-driven testing, and intuitive web experiences.
              </p>
              <p className="text-base sm:text-lg font-light text-zinc-600 leading-relaxed font-sans">
                When I’m not writing code or testing systems, I build wholesome visual novel games and write stories.
              </p>
            </div>

            {/* Minimalist Editorial Metadata Bar */}
            <div className="pt-6 border-t border-zinc-200 grid grid-cols-2 sm:grid-cols-3 gap-6 font-mono text-xs">
              <div>
                <span className="text-zinc-400 block mb-1 uppercase tracking-wider">LOCATION</span>
                <span className="text-zinc-900 font-bold">Naga City, PH</span>
              </div>
              <div>
                <span className="text-zinc-400 block mb-1 uppercase tracking-wider">SPECIALTY</span>
                <span className="text-zinc-900 font-bold">QA & SysAdmin</span>
              </div>
              <div>
                <span className="text-zinc-400 block mb-1 uppercase tracking-wider">DEGREE</span>
                <span className="text-zinc-900 font-bold">BSIT</span>
              </div>
            </div>

          </motion.div>

        </div>
      </div>
    </section>
  );
}
