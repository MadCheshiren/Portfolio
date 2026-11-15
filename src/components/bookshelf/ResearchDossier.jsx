import { motion, AnimatePresence } from 'framer-motion';
import { ExternalLink, GitBranch, X, BookOpen, Layers, CheckCircle } from 'lucide-react';

export default function ResearchDossier({ book, onClose }) {
  if (!book) return null;

  return (
    <AnimatePresence>
      {/* Outer Floating Overlay Shell */}
      <motion.div
        initial={{ opacity: 0, x: 80, scale: 0.98 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        exit={{ opacity: 0, x: 80, scale: 0.98 }}
        transition={{ type: 'spring', damping: 28, stiffness: 240 }}
        className="fixed inset-y-4 right-4 sm:right-6 w-[calc(100vw-2rem)] max-w-2xl z-50 pointer-events-auto flex flex-col"
      >
        {/* Double-Bezel Architecture: Outer Glass Shell */}
        <div className="w-full h-full bg-black/50 border border-white/10 backdrop-blur-3xl rounded-[2rem] p-2 shadow-2xl flex flex-col overflow-hidden">
          
          {/* Inner Machined Core */}
          <div className="w-full h-full bg-zinc-950/90 border border-white/5 rounded-[calc(2rem-0.5rem)] p-6 sm:p-10 overflow-y-auto flex flex-col justify-between scrollbar-thin scrollbar-thumb-zinc-800">
            
            <div>
              {/* Header Bar */}
              <div className="flex items-center justify-between border-b border-zinc-800/80 pb-6 mb-8">
                <div className="flex items-center space-x-3">
                  <span className="font-mono text-xs px-3 py-1 bg-zinc-900 text-amber-400 border border-zinc-800 rounded-full tracking-wider">
                    {book.vol}
                  </span>
                  <span className="font-mono text-xs text-zinc-400 tracking-widest uppercase">
                    {book.taxonomy}
                  </span>
                </div>
                
                <button
                  onClick={onClose}
                  className="group p-2 text-zinc-400 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-full transition-all duration-300 active:scale-95"
                  aria-label="Close dossier"
                >
                  <X className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
                </button>
              </div>

              {/* Book Title & Subtitle */}
              <div className="mb-8">
                <h2 className="text-4xl sm:text-5xl font-editorial tracking-tight text-white mb-2 leading-none">
                  {book.title}
                </h2>
                <p className="text-lg text-zinc-400 font-light font-sans">
                  {book.subtitle}
                </p>
              </div>

              {/* Abstract / Overview Card */}
              <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-6 mb-8 shadow-inner">
                <h3 className="text-[11px] font-mono uppercase text-amber-400 tracking-widest mb-3 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-amber-400" /> Abstract & Field Notes
                </h3>
                <p className="text-zinc-300 leading-relaxed text-sm font-sans font-light">
                  {book.description}
                </p>
              </div>

              {/* Problem Statement */}
              <div className="mb-8">
                <h3 className="text-[11px] font-mono uppercase text-zinc-500 tracking-widest mb-3">
                  [ Problem Statement ]
                </h3>
                <p className="text-zinc-400 text-sm leading-relaxed font-sans font-light">
                  {book.problemStatement}
                </p>
              </div>

              {/* System Architecture */}
              {book.architecture && (
                <div className="mb-8">
                  <h3 className="text-[11px] font-mono uppercase text-zinc-500 tracking-widest mb-3 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-amber-400" /> System Architecture & Pipeline
                  </h3>
                  <ul className="space-y-2.5">
                    {book.architecture.map((item, idx) => (
                      <li key={idx} className="flex items-start text-sm text-zinc-300 gap-3 font-sans">
                        <span className="text-amber-400 font-mono text-xs pt-0.5">0{idx + 1}.</span>
                        <span className="font-light">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Key Deliverables */}
              {book.features && (
                <div className="mb-8">
                  <h3 className="text-[11px] font-mono uppercase text-zinc-500 tracking-widest mb-3 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-400" /> Key Engineering Deliverables
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {book.features.map((feat, idx) => (
                      <div key={idx} className="bg-zinc-900/40 border border-zinc-800/60 p-3.5 rounded-lg text-xs text-zinc-300 font-sans font-light">
                        {feat}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Stack Specs */}
              <div className="mb-8">
                <h3 className="text-[11px] font-mono uppercase text-zinc-500 tracking-widest mb-3">
                  [ Stack Specs ]
                </h3>
                <div className="flex flex-wrap gap-2">
                  {book.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[11px] font-mono px-3 py-1.5 bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-md"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Action Bar / Nested CTA Buttons */}
            <div className="pt-6 border-t border-zinc-800/80 flex flex-wrap gap-4 items-center justify-between">
              <div className="flex flex-wrap gap-3">
                {book.demoUrl && (
                  <a
                    href={book.demoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="group inline-flex items-center gap-3 px-6 py-3 bg-white text-black hover:bg-zinc-200 rounded-full text-xs font-mono font-semibold tracking-wider uppercase transition-all duration-300 active:scale-95 shadow-lg"
                  >
                    <span>Launch Demo</span>
                    <span className="w-6 h-6 rounded-full bg-black/10 flex items-center justify-center group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-300">
                      <ExternalLink className="w-3.5 h-3.5 text-black" />
                    </span>
                  </a>
                )}
                
                {book.repoUrl && (
                  <a
                    href={book.repoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="group inline-flex items-center gap-3 px-6 py-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-white rounded-full text-xs font-mono font-medium tracking-wider uppercase transition-all duration-300 active:scale-95"
                  >
                    <span>Repository</span>
                    <span className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-300">
                      <GitBranch className="w-3.5 h-3.5 text-white" />
                    </span>
                  </a>
                )}
              </div>

              <button
                onClick={onClose}
                className="text-xs font-mono text-zinc-500 hover:text-zinc-300 underline underline-offset-4 uppercase tracking-wider transition-colors"
              >
                Return to Shelf
              </button>
            </div>

          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
