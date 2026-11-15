import { motion } from 'framer-motion';
import { Send } from 'lucide-react';

export default function Contact() {
  return (
    <section id="contact" className="py-24 px-6 bg-zinc-950 text-white relative overflow-hidden min-h-[640px] flex items-center">
      
      {/* Clean Inverted Skulls Background */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden z-0">
        <img 
          src="/skulls.jfif" 
          alt="Skulls background artwork" 
          className="w-full h-full object-contain max-h-[85%] opacity-40 filter invert grayscale mix-blend-screen select-none"
        />
      </div>

      {/* Subtle Gradient Overlay for Depth */}
      <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/70 via-transparent to-zinc-950/80 pointer-events-none z-0" />

      <div className="max-w-4xl mx-auto w-full relative z-10">
        <div className="text-center mb-12">
          <span className="text-xs font-mono text-zinc-400 mb-3 block uppercase tracking-widest">[ CONTACT ]</span>
          <h2 className="text-5xl md:text-7xl font-editorial tracking-tight mb-4">Let's Connect</h2>
          <p className="text-base md:text-lg text-zinc-300 max-w-xl mx-auto font-sans font-light leading-relaxed">
            Send a clear message, get a real reply. I'm currently open to new opportunities and interesting projects.
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <form action="https://formspree.io/f/xojyqboj" method="POST" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label htmlFor="name" className="text-xs font-mono font-medium text-zinc-300 uppercase tracking-wider">Name</label>
                <input 
                  type="text" 
                  id="name" 
                  name="name" 
                  required
                  className="w-full px-4 py-3.5 bg-transparent border border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent transition-all font-sans text-white"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="email" className="text-xs font-mono font-medium text-zinc-300 uppercase tracking-wider">Email</label>
                <input 
                  type="email" 
                  id="email" 
                  name="email" 
                  required
                  className="w-full px-4 py-3.5 bg-transparent border border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent transition-all font-sans text-white"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="message" className="text-xs font-mono font-medium text-zinc-300 uppercase tracking-wider">Message</label>
              <textarea 
                id="message" 
                name="message" 
                required
                rows="5"
                className="w-full px-4 py-3.5 bg-transparent border border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent transition-all resize-none font-sans text-white"
              ></textarea>
            </div>

            <button 
              type="submit"
              className="w-full md:w-auto px-8 py-4 bg-white text-zinc-950 font-bold rounded-xl hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2 font-sans cursor-pointer"
            >
              Send Message <Send size={18} />
            </button>
          </form>
        </motion.div>
      </div>

      {/* Editorial bottom divider creating a crisp transition into the white footer */}
      <div className="absolute bottom-0 inset-x-0 h-px bg-zinc-800/80 pointer-events-none" />
    </section>
  );
}
